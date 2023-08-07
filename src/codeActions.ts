/* A class AI Kernel is to manager the output and input of chats with ChatGPT. 
Every output chat message (prompt) has a template, which could have parameters.
A chat message, output or input, is identified by its name (ID).

The class has the following attributes:
globalHistory: chat history with time stamp

streamHistory: streaming chat history with time stamp. When a streamed messages are finished successfully, 
    it will be added to the globalHistory.
method retry: to resend the last message of the same chat template.
method newCaht: to start a new chat template without history.

*/

// AI Kernel is also a typical Jupyter Kernel with a few AI service provider behind.

/*
/clear slash command
*/

import { ICodeSnippet, CodeSnippetService } from 'jupyterlite-prompts';

// import { globalOpenAI } from './driver_azure';
import { user } from './user';
// import { Configuration, OpenAIApi } from 'openai';
import { OpenAIDriver } from './driver_azure';
/*
//Todo: to make sure Handlebars loaded at the beginning
*/
import Handlebars from 'handlebars/lib/handlebars';
import { MyConsole } from './controlMode';

function getAllPromptTemplates() {
  let allActions = '';
  for (const snippet of CodeSnippetService.snippets) {
    if (!(snippet.name.startsWith('@') || snippet.name.startsWith('/'))) {
      continue;
    }
    allActions += '\n' + snippet.name;
  }
  return allActions;
}

function extractURLs(inputString: string): {
  urls: RegExpMatchArray | null;
  remainingPart: string;
} {
  // Define the regex pattern to match URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  // Use the match() method to find all URLs in the input string
  const urls = inputString.match(urlPattern);

  // Use the replace() method to remove the URLs from the input string
  const remainingPart = inputString.replace(urlPattern, '');

  return { urls, remainingPart }; // Fix: Change curly braces to square brackets for object property
}

export interface IActionResult {
  outputResult: string;
  outputFormat: string;
  isProcessed: boolean;
}

export class inChainedCodeAction {
  execute: (inputCode: string) => Promise<IActionResult>;
  priority: number;
  timestamp: number;

  constructor(
    execute: (inputCode: string) => Promise<IActionResult>,
    priority: number
  ) {
    this.execute = execute;
    this.priority = priority;
    this.timestamp = Date.now();
  }

  static notProcessed(): Promise<IActionResult> {
    return Promise.resolve({
      outputResult: '',
      outputFormat: 'text/markdown',
      isProcessed: false
    });
  }
}

export const globalCodeActions: inChainedCodeAction[] = [];

function globalSortedCodeActions(): inChainedCodeAction[] {
  return globalCodeActions.sort((a, b) => {
    if (a.priority === b.priority) {
      return a.timestamp - b.timestamp;
    }
    return a.priority - b.priority;
  });
}

async function action_SetKey(code: string): Promise<IActionResult> {
  if (code.trim().toLowerCase().startsWith('key=')) {
    const apiKey = code.trim().slice('key='.length);
    //The key should have a 20+ length. This one is of ying.li@AILean.live
    if (apiKey.trim().length === '644f0583d9464db18a2539ee9683a111'.length) {
      let welcome = 'Welcome';
      /**
       * Test Handlebars
       */

      if (Handlebars) {
        const welcomeTemplate1 = Handlebars.compile('Welcome {{name}}');
        welcome = welcomeTemplate1({ name: user.current_user.name });
        // MyConsole.debug(welcome);
      }
      if (OpenAIDriver.refreshAPIKey(apiKey)) {
        // else {
        //   const Handlebars2 = await import('handlebars');
        //   const welcomeTemplate2 = Handlebars2.compile('Welcome 2 ：{{name}}');
        //   MyConsole.log(welcomeTemplate2({ name: user.current_user.name }));
        // }
        try {
          const completion =
            await OpenAIDriver.get_globalOpenAI().getChatCompletions(
              'gpt-35-turbo',
              [
                {
                  role: 'system',
                  content: 'You are a helpful assistant'
                },
                {
                  role: 'user',
                  content: user.self_introduction() + '\n Please say hello.'
                }
              ]
            );
          MyConsole.debug(completion.choices);
        } catch (error: any) {
          return Promise.resolve({
            outputResult:
              '<p>**The key is invalid.**' +
              error.message +
              '</p><p>**Stack trace**:' +
              error.stack,
            outputFormat: 'text/markdown',
            isProcessed: true
          });
        }
        /*
                  To list all registered actions for debugging
                */
        const allActions = getAllPromptTemplates();

        return {
          outputResult:
            welcome +
            ', try now!' +
            '<p>' +
            'OpenAI API Key (' +
            apiKey +
            ') has been assigned.</p>' +
            '<p>FYI: The current available instructions/ roles / characters for AI is as the following:</p><p>' +
            allActions +
            '</p>',
          outputFormat: 'text/markdown',
          isProcessed: true
        };
      }
    }
  }
  return inChainedCodeAction.notProcessed();
}

function action_list(code: string): Promise<IActionResult> {
  if (code.trim().toLowerCase() === '/list') {
    const allActions = getAllPromptTemplates();
    return Promise.resolve({
      outputResult:
        '<p>FYI: The current list is as the following:</p><p>' +
        allActions +
        '</p>',
      outputFormat: 'text/markdown',
      isProcessed: true
    });
  }
  return inChainedCodeAction.notProcessed();
}

async function definePromptTemplate(
  code: string,
  prefix: string,
  promptKind: string,
  prefix_symbol: string
  // withMemory: boolean
): Promise<IActionResult> {
  if (code.trim().toLowerCase().startsWith(prefix)) {
    const innerCode = code.trim().substring(prefix.length);
    const innerlines = innerCode.split('\n');

    if (innerlines.length > 1) {
      const define = innerlines.slice(1).join('\n');
      const { urls, remainingPart } = extractURLs(define);
      let iconURL = '';
      if (urls) {
        if (urls.length > 0) {
          iconURL = urls[0];
        }
      }

      if (!innerlines[0].startsWith(prefix_symbol)) {
        innerlines[0] = prefix_symbol + innerlines[0];
      }
      const newSnippet: ICodeSnippet = {
        name: innerlines[0],
        description: '',
        language: 'Markdown',
        code: remainingPart,
        id: CodeSnippetService.snippets.length,
        tags: [],
        templateEngine: 'Handlebars',
        voiceName: '',
        iconURL: iconURL
      };

      await CodeSnippetService.addSnippet(newSnippet);
      // debugger;
      const md_iconURL = newSnippet.iconURL || '';

      const allTemplates = getAllPromptTemplates();
      return Promise.resolve({
        outputResult:
          '<p> The ' +
          promptKind +
          ' ' +
          innerlines[0] +
          ' has been defined.</p><p>' +
          // '**' +
          // md_displayName +
          '**' +
          md_iconURL +
          ':</p><p>FYI: The current prompt templates (roles/actions) are as the following:</p><p>' +
          allTemplates +
          '</p>',
        outputFormat: 'text/markdown',
        isProcessed: true
      });
    }
  }
  return inChainedCodeAction.notProcessed();
}
function action_defineRole(code: string): Promise<IActionResult> {
  const prefix = '/role:';
  const promptKind = 'role';
  // const withMemory = true;
  const prefix_symbol = '@';
  return definePromptTemplate(code, prefix, promptKind, prefix_symbol); // withMemory);
}

function action_defineInstruction(code: string): Promise<IActionResult> {
  const prefix = '/instruct:';
  const promptKind = 'instruction';
  // const withMemory = false;
  const prefix_symbol = '/';
  return definePromptTemplate(code, prefix, promptKind, prefix_symbol); // withMemory);
}

function action_defineUser(code: string): Promise<IActionResult> {
  const prefix = '/user';

  if (code.trim().toLowerCase().startsWith(prefix)) {
    const innerCode = code.trim().substring(prefix.length);
    try {
      if (user.fromJson(innerCode)) {
        return Promise.resolve({
          outputResult: '<p> The current user has been defined.</p>',
          outputFormat: 'text/markdown',
          isProcessed: true
        });
      }
    } catch (error: any) {
      console.error(error);
    }

    return Promise.resolve({
      outputResult:
        '<p> The user define is invalid. Please check the JSON format in an online JSON viewer.</p>',
      outputFormat: 'text/markdown',
      isProcessed: true
    });
  }
  return inChainedCodeAction.notProcessed();
}

function action_debug(code: string): Promise<IActionResult> {
  if (code.trim() === '/debug:AILearn.live') {
    MyConsole.inDebug = !MyConsole.inDebug;
    const mode = MyConsole.inDebug ? 'enabled' : 'disbaled';
    return Promise.resolve({
      outputResult: '<p>**Now debug is ' + mode + '**</p>',
      outputFormat: 'text/markdown',
      isProcessed: true
    });
  }
  return Promise.resolve({
    outputResult: '',
    outputFormat: 'text/markdown',
    isProcessed: false
  });
}

globalCodeActions.push(new inChainedCodeAction(action_SetKey, 0));
globalCodeActions.push(new inChainedCodeAction(action_list, 1));
globalCodeActions.push(new inChainedCodeAction(action_defineUser, 2));
globalCodeActions.push(new inChainedCodeAction(action_defineRole, 3));
globalCodeActions.push(new inChainedCodeAction(action_defineInstruction, 4));
globalCodeActions.push(new inChainedCodeAction(action_debug, 5));
// globalCodeActions.push(new inChainedCodeAction(action_stream, 5));

globalSortedCodeActions();
