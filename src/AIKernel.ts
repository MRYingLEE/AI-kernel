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

// const template = promptTemplates[templateName];

// if (focalcode_text.toLowerCase().startsWith('/clear')) {
//   if (template !== null) {
//     template.startNewSession();
//     return [];
//   }
// }

// if (template !== null) {
//   return template.buildTemplate(statuses);
// } else {
//   return [];
// }
import { promptTemplates } from './promptTemplate';
// import { globalOpenAI } from './driver_openai';
import { user } from './user';
// import { Configuration, OpenAIApi } from 'openai';
import { OpenAIDriver } from './driver_openai';
/*
//Todo: to make sure Handlebars loaded at the beginning
*/
import Handlebars from 'handlebars/lib/handlebars';

function getAllPromptTemplates() {
  let allActions = '';
  for (const key in promptTemplates) {
    if (!promptTemplates[key]) {
      continue;
    }
    allActions += '\n' + key;
  }
  return allActions;
}

interface IActionResult {
  outputResult: string;
  outputFormat: string;
  isProcessed: boolean;
}

class inChangedCodeAction {
  execute: (inputCode: string) => IActionResult;
  priority: number;
  timestamp: number;

  constructor(execute: (inputCode: string) => IActionResult, priority: number) {
    this.execute = execute;
    this.priority = priority;
    this.timestamp = Date.now();
  }
}

export const globalCodeActions: inChangedCodeAction[] = [];

function globalSortedCodeActions(): inChangedCodeAction[] {
  return globalCodeActions.sort((a, b) => {
    if (a.priority === b.priority) {
      return a.timestamp - b.timestamp;
    }
    return a.priority - b.priority;
  });
}

function action_SetKey(code: string): IActionResult {
  if (code.trim().toLowerCase().startsWith('key=')) {
    const apiKey = code.trim().slice('key='.length);
    //The key should have a 20+ length.
    if (
      apiKey.trim().length ===
      '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'.length
    ) {
      if (OpenAIDriver.refreshAPIKey(apiKey)) {
        let welcome = 'Welcome';
        /**
         * Test Handlebars
         */
        if (Handlebars) {
          const welcomeTemplate1 = Handlebars.compile('Welcome {{name}}');
          welcome = welcomeTemplate1({ name: user.current_user.name });
          console.log(welcome);
        }
        // else {
        //   const Handlebars2 = await import('handlebars');
        //   const welcomeTemplate2 = Handlebars2.compile('Welcome 2 ：{{name}}');
        //   console.log(welcomeTemplate2({ name: user.current_user.name }));
        // }

        /*
                  To list all registered actions for debugging
                */
        const allActions = getAllPromptTemplates();

        /*
                Here, we try to compile all promptTamplests
                */
        for (const element of Object.values(promptTemplates)) {
          try {
            element.f_sysTemplate = Handlebars.compile(
              element.systemMessageTemplate
            );
          } catch {
            element.f_sysTemplate = undefined;
          }

          try {
            element.f_userTemplate = Handlebars.compile(
              element.userMessageTemplate
            );
          } catch {
            element.f_userTemplate = undefined;
          }
        }

        return {
          outputResult:
            welcome +
            ', try now!' +
            '<p>' +
            'OpenAI API Key (' +
            apiKey +
            ') has been assigned.</p>' +
            '<p>FYI: The current list is as the following:</p><p>' +
            allActions +
            '</p>',
          outputFormat: 'text/markdown',
          isProcessed: true
        };
      }
    }
  }
  return {
    outputResult: '',
    outputFormat: 'text/markdown',
    isProcessed: false
  };
}

function action_list(code: string): IActionResult {
  if (code.trim().toLowerCase() === '/list') {
    const allActions = getAllPromptTemplates();
    return {
      outputResult:
        '<p>FYI: The current list is as the following:</p><p>' +
        allActions +
        '</p>',
      outputFormat: 'text/markdown',
      isProcessed: true
    };
  }
  return {
    outputResult: '',
    outputFormat: 'text/markdown',
    isProcessed: false
  };
}

globalCodeActions.push(new inChangedCodeAction(action_SetKey, 0));
globalCodeActions.push(new inChangedCodeAction(action_list, 0));
globalSortedCodeActions();
