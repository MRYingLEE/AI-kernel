// The chat format terms are based on ones of ChatGPT
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum
} from 'openai';
import { user } from './user';
import { MyConsole } from './debugMode';

interface IPromptTemplateProps {
  systemMessageTemplate: string;
  //short_reminding for every user message? Such as you are Ana.

  userMessageTemplate: string;

  templateFormat?: 'f-string' | 'jinja2' | 'Handlebars' | 'ejs'; //If possible, we will support any templating language
  // get_inputVariables(): [string];

  // validateTemplate?: boolean;

  // We give up the idea of cell 2 cell, but use a code to result pattern.
  // inputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw'; //'Cell' is the default //added by Ying
  // outputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw'; //'Markdown' is the default //added by Ying

  withMemory: boolean; //false is the default //added by Ying
}

function renderTemplate(
  template: string,
  f_template: HandlebarsTemplateDelegate<any> | undefined,
  statuses: { [key: string]: string }
): string {
  // MyConsole.table(statuses);
  const new_statuses = statuses;
  new_statuses['self_introduction'] = user.current_user.self_introduction();
  // MyConsole.table(new_statuses);
  let content = template;
  try {
    if (!(f_template === undefined)) {
      MyConsole.debug('content before f_userTemplate', content);
      content = f_template(new_statuses);
      MyConsole.debug('content after f_userTemplate', content);
    } else {
      for (const key in new_statuses) {
        content = content.replace('{{' + key + '}}', new_statuses[key]);
      }
    }
  } catch {
    MyConsole.debug('Template:', template);
  }
  // MyConsole.debug('content:', content);
  return content;
}

// Create a class named chatItem with attributes: promptName:String, Role:String, contents:string, timestamp:Datetime
class message {
  template: IPromptTemplateProps; // The prompt template

  msg2send: ChatCompletionRequestMessage; // The real request message to OpenAI service
  // The following section is degested from https://platform.openai.com/docs/api-reference/chat/create (as of June 25)
  /* 
  messages
  array
  Required
  A list of messages comprising the conversation so far. Example Python code.
  
  role
  string
  Required
  The role of the messages author. One of system, user, assistant, or function.
  
  content
  string
  Optional
  The contents of the message. content is required for all messages except assistant messages with function calls.
  
  name
  string
  Optional
  The name of the author of this message. name is required if role is function, and it should be the name of the function whose response is in the content. May contain a-z, A-Z, 0-9, and underscores, with a maximum length of 64 characters.
  
  function_call
  object
  Optional
  The name and arguments of a function that should be called, as generated by the model. 
  */
  timestamp: Date;
  newSession: boolean;

  tokenUsage = 0;

  constructor(
    template: IPromptTemplateProps,
    role: ChatCompletionRequestMessageRoleEnum, //system, user, assistant, or function
    content: string,
    name: string,
    timestamp: Date,
    newSession: boolean,
    tokenUsage = 0
  ) {
    // A big supprise is that if the name is '', the request will fail.
    // So we have to make the following adjust following 1 week debugging
    if (name.trim().length > 0) {
      this.msg2send = {
        role: role,
        content: content,
        name: name
      };
    } else {
      this.msg2send = {
        role: role,
        content: content
      };
    }

    this.template = template;

    this.timestamp = timestamp;
    this.newSession = newSession;

    this.tokenUsage = tokenUsage;
  }

  // generateJson(): string {
  //     return "{role: "+this.coremessage.role +", content:"+ this.coremessage.content+ ", name:"+ this.coremessage.name+"}";
  // }
}

class promptTemplate implements IPromptTemplateProps {
  templateName: string;
  templateDescription: string;

  // To make code simple, there are 2 parts: system and user. But maybe we can use 1 later to follow Microsoft Guidance
  systemMessageTemplate: string;
  userMessageTemplate: string;

  templateFormat?: 'f-string' | 'jinja2' | 'Handlebars' | 'ejs';
  // validateTemplate?: boolean;

  // get_inputVariables(): [string]{

  // }
  // inputVariables: string[];

  // Maybe later we can support cell level I/O.
  // Now the input type is 'Code' only.
  // Now the output type is 'Markdown'
  // inputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw'; //'Cell' is the default //added by Ying
  // outputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw'; //'Markdown' is the default //added by Ying

  withMemory: boolean; //false is the default //added by Ying

  newSession: boolean; // Whether this template will start a new session. true is the default //added by Ying

  // Now to simplize code, we use char length as token size
  tokenInMessage = 0;
  tokenInResponse = 0;

  // f_sysTemplate: { [key: string]: string } | undefined;
  f_sysTemplate: HandlebarsTemplateDelegate<any> | undefined;

  // f_userTemplate: { [key: string]: string } | undefined;
  f_userTemplate: HandlebarsTemplateDelegate<any> | undefined;

  static global_messages: message[] = [];

  constructor(
    templateName: string,
    templateDescription: string,
    systemMessageTemplate: string,
    userMessageTemplate: string,
    /* inputVariables: string[], messages: [message],*/ templateFormat?:
      | 'f-string'
      | 'jinja2'
      | 'Handlebars',
    // validateTemplate?: boolean,
    // inputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw',
    // outputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw',
    withMemory?: boolean //,
    // newSession?: boolean
  ) {
    this.templateName = templateName;
    this.templateDescription = templateDescription;

    this.systemMessageTemplate = systemMessageTemplate;
    this.userMessageTemplate = userMessageTemplate;

    // this.inputVariables = inputVariables;

    this.templateFormat = templateFormat;
    // this.validateTemplate = validateTemplate;
    // this.inputCellType = inputCellType;
    // this.outputCellType = outputCellType;
    this.withMemory = withMemory ?? false;
    this.newSession = true; //newSession ?? true;

    // this.f_sysTemplate = Handlebars.compile(this.systemMessageTemplate);
    // this.f_userTemplate = Handlebars.compile(this.userMessageTemplate);
  }
  //Todo: Should we support a global Message list directly?
  addMessage(
    Role: ChatCompletionRequestMessageRoleEnum, //'system' | 'user' | 'assistant',
    content: string,
    name: string,
    tokenUsage = 0
  ): void {
    MyConsole.debug('conetnt:', content);
    promptTemplate.global_messages.push(
      new message(
        this,
        Role,
        content,
        name,
        new Date(Date.now()),
        this.newSession,
        tokenUsage
      )
    );
    MyConsole.table(promptTemplate.global_messages);
  }

  removeLastMessage(): void {
    if (this.withMemory) {
      promptTemplate.global_messages.pop();
    }
  }

  startNewSession(): void {
    // if (this.withMemory)
    this.newSession = true;
  }

  static MaxTokenLimit = 4097; // for GPT-3.5
  getSessionHistory(currentToken: number): ChatCompletionRequestMessage[] {
    //Todo: A lot of improvement here. 1. Token limit instead of char limit 2. Guarantee the pair of messages are added. 3. Avoid failed user message 4. Retry

    const history: ChatCompletionRequestMessage[] = [];

    let totalToken = currentToken;

    //To find the system message of the latest session
    let systemMessage;
    for (let i = promptTemplate.global_messages.length - 1; i >= 0; i--) {
      if (promptTemplate.global_messages[i].template === this) {
        if (promptTemplate.global_messages[i].newSession) {
          totalToken += promptTemplate.global_messages[i].tokenUsage;
          systemMessage = promptTemplate.global_messages[i].msg2send;
          break;
        }
      }
    }

    MyConsole.debug('TotalToken:', totalToken);

    for (let i = promptTemplate.global_messages.length - 1; i >= 0; i--) {
      if (promptTemplate.global_messages[i].template === this) {
        if (promptTemplate.global_messages[i].newSession) {
          break;
        }

        if (
          promptTemplate.global_messages[i].tokenUsage + totalToken <
          promptTemplate.MaxTokenLimit
        ) {
          history.push(promptTemplate.global_messages[i].msg2send);
          totalToken += promptTemplate.global_messages[i].tokenUsage;
        }
      }
    }

    if (systemMessage) {
      history.push(systemMessage);
    }

    return history.reverse();
  }

  // static TokenLimit = 1000;

  renderUserTemplate(statuses: { [key: string]: string }): string {
    return renderTemplate(
      this.userMessageTemplate,
      this.f_userTemplate,
      statuses
    );
  }

  renderSysTemplate(statuses: { [key: string]: string }): string {
    return renderTemplate(
      this.systemMessageTemplate,
      this.f_sysTemplate,
      statuses
    );
  }

  buildMessages2send(statuses: { [key: string]: string }): {
    messages2send: ChatCompletionRequestMessage[]; //The Request Messages to be sent to ChatGPT
    usrContent: string; //The logical user message for the current chat session
  } {
    // MyConsole.debug('statuses:', statuses);
    // MyConsole.debug('this.systemMessageTemplate:', this.systemMessageTemplate);
    // MyConsole.debug('this.userMessageTemplate:', this.userMessageTemplate);

    let messages2send: ChatCompletionRequestMessage[] = [];

    const sysContent = this.renderSysTemplate(statuses);
    MyConsole.debug('sysContent:', sysContent);

    const usrContent = this.renderUserTemplate(statuses);
    MyConsole.debug('usrContent:', usrContent);

    if ((sysContent + usrContent).trim() === '') {
      return { messages2send, usrContent };
    }

    if (this.withMemory) {
      if (this.newSession === false) {
        messages2send = this.getSessionHistory(usrContent.length * 2); // for temporation estimation of prompt tokens
      } else {
        // this.newSession = false; //Maybe only when request succeeds, we make it flase
      }
    }

    const msg2send = {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: sysContent + '\n' + usrContent
    };
    messages2send.push(msg2send);
    return { messages2send, usrContent };
  }
}

// // Ying

// const pythonCode = `def get_df_defines():\n \
// 						  	lines=["import pandas as pd", ""]\n \
// 							dfs_only = {k: v for k, v in globals().items() if isinstance(v, pd.DataFrame)}\n \
// 							for df_name, df in dfs_only.items():\n \
// 								cols=','.join(['"'+c+'"' for c in df.columns])\n \
// 								dts=','.join(['"'+c+'" : "'+str(t)+'"' for c, t in zip(df.columns,df.dtypes)])\n \
// 								lines.append(df_name+'=pd.read_csv("'+df_name+'.csv", columns={'+cols+'}, dtype={'+ dts + '})')\n \
// 							return '\n'.join(lines)`;

// await window.executePython(pythonCode).then((result) => {
//     MyConsole.debug("The following Python code has been developed:\n```Python\n" + result + "\n```\n");
// });

// const completePrompt = `
// **Your name is AI and you are a coding assistant. You are helping the user complete the code they are trying to write.**

// Here are the requirements for completing the code:

// - Be polite and respectful in your response.
// - Only complete the code in the FOCAL CELL.
// - Do not repeat any code from the PREVIOUS CODE.
// - Only put the completed code in a function if the user explicitly asks you to, otherwise just complete the code in the FOCAL CELL.
// - Provide code that is intelligent, correct, efficient, and readable.
// - If you are not sure about something, don't guess.
// - Keep your responses short and to the point.
// - Provide your code and completions formatted as markdown code blocks.
// - Never refer to yourself as "AI", you are a coding assistant.
// - Never ask the user for a follow up. Do not include pleasantries at the end of your response.
// - Briefly summarise the new code you wrote at the end of your response.

// *Focal cell:*

// \`\`\`
// {{focalcode_text}}
// \`\`\`

// **AI: Happy to complete the code for you, here it is:**
// `;

// const explainPrompt = `
// **Your name is AI and you are a coding assistant. You are helping the user understand the code in the FOCAL CELL by explaining it.**

// Here are the requirements for your explanation:

// - Be polite and respectful to the person who wrote the code.
// - Explain the code in the FOCAL CELL as clearly as possible.
// - If you are not sure about something, don't guess.
// - Keep your responses short and to the point.
// - Never refer to yourself as "AI", you are a coding assistant.
// - Never ask the user for a follow up. Do not include pleasantries at the end of your response.
// - Use markdown to format your response where possible.
// - If reasonable, provide a line-by-line explanation of the code using markdown formatting and clearly labelled inline comments.

// **Here is the background information about the code:**

// *Current Python code:*

// \`\`\`
// {{fakecode_text}}
// \`\`\`

// *Focal cell:*

// \`\`\`
// {{focalcode_text}}
// \`\`\`

// *STDOUT of focal cell:*

// \`\`\`
// {{stdout_text}}
// \`\`\`

// *Result of focal cell:*

// \`\`\`
// {{result_text}}
// \`\`\`

// **AI: Happy to explain the code to you, here is my explanation:**
// `;

// const formatPrompt = `
// **Your name is AI and you are a coding assistant. You are helping the user to improve the code formatting of their FOCAL CELL.**

// Here are the requirements for improving the formatting of the code:

// - Be polite and respectful to the person who wrote the code.
// - Never alter the code itself, only improve the formatting.
// - Do not include import statements in your response, only the code itself.
// - Improvements that you need to make where possible:
//     - Add comments to explain what the code is doing.
//     - Improve the spacing of the code to make it easier to read.
//     - Add docstrings to functions and classes.
//     - Add type hints to variables and functions.
// - Only put the formatting code in a function if the original code was in a function, otherwise just improve the formatting of the code in the FOCAL CELL.
// - If you are not sure about something, don't guess.
// - Keep your responses short and to the point.
// - First respond by providing the code with improved formatting in a markdown code block.
// - Never refer to yourself as "AI", you are a coding assistant.
// - Never ask the user for a follow up. Do not include pleasantries at the end of your response.
// - Briefly list the formatting improvements that you made at the end.

// **Here is the background information about the code:**

// *Focal cell:*

// \`\`\`
// {{focalcode_text}}
// \`\`\`

// **AI: Happy to improve the formatting of your code, here it is:**
// `;

// const debugPrompt = `
// **Your name is AI and you are a coding assistant. You are helping the user to debug a code issue in their FOCAL CELL.**

// Here are the requirements for debugging:

// - Be polite and respectful to the person who wrote the code.
// - Describe the problem in the FOCAL CELL as clearly as possible.
// - Explain why the code is not working and/or throwing an error.
// - Explain how to fix the problem.
// - If you are not sure about something, don't guess.
// - Keep your responses short and to the point.
// - Provide your explanation and solution formatted as markdown where possible.
// - Never refer to yourself as "AI", you are a coding assistant.
// - Never ask the user for a follow up. Do not include pleasantries at the end of your response.

// **Here is the background information about the code:**

// *Focal cell:*

// \`\`\`
// {{focalcode_text}}
// \`\`\`

// *STDERR of focal cell:*

// \`\`\`
// {{stderr_text}}
// \`\`\`

// **AI: Sorry to hear you are experiencing problems, let me help you with that:**
// `;

// const reviewPrompt = `
// **Your name is AI and you are a code reviewer reviewing the code in the FOCAL CELL.**

// Here are the requirements for reviewing code:

// - Be constructive and suggest improvements where helpful.
// - Do not include compliments or summaries of the code.
// - Do not comment on code that is not in the focal cell.
// - You don't know the code that comes after the cell, so don't recommend anything regarding unused variables.
// - Ignore suggestions related to imports.
// - Try to keep your comments short and to the point.
// - When providing a suggestion in your list, reference the line(s) of code that you are referring to in a markdown code block right under each comment.
// - Do not end your response with the updated code.
// - If you are not sure about something, don't comment on it.
// - Provide your suggestions formatted as markdown where possible.
// - Never refer to yourself as "AI", you are a coding assistant.
// - Never ask the user for a follow up. Do not include pleasantries at the end of your response.

// **Here is is the background information about the code:**

// *Focal cell:*
// \`\`\`
// {{focalcode_text}}
// \`\`\`

// **AI: Happy to review your code, here is a list with my suggestions and recommendations for your code. I will include a copy of the code I am referring to in a code block whenever possible.:**
// `;

const aiPrompt = `
**Your name is AI and you are a good tutor. You are helping the user with their task.**

Here are the requirements for being a good assistant:

- Be polite and respectful in your response.
- When providing code, make sure it is intelligent, correct, efficient, and readable.
- If you are not sure about something, don't guess.
- Keep your responses short and to the point.
- Provide any code and completions formatted as markdown code blocks.

Here is the task or question that the user is asking you:

{{cell_text}}

**AI: Happy to help, here is my response:**
`;

// const pythonPromt = `
// You are a data scientist.You are good at coding Pythonic style Python in Jupyter Notebook. When I give you a task, try to generate pure Python code to solve it.
// You may add comments within code, but do not explain out of code.
// *Current Python code:*
// \`\`\`
// {{fakecode_text}}
// \`\`\`

// Here is the task or question that the user is asking you:
// {{cell_text}}
// `;

const all2EnglishPrompt = `
I want you to act as an English translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language, 
translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentenceswith more 
beautiful and elegant, upper level English words and sentences. 
Keep the meaning same, but make them more literary. 
I want you to only reply the correction, the improvements and nothing else, do not write explanations. 
Here is the sentence for you:
{{cell_text}}
`;

const all2ChinesePrompt = `
I want you to act as an Chinese translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language, 
translate it and answer in the corrected and improved version of my text, in Chinese. I want you to replace my simplified A0-level words and sentenceswith more 
beautiful and elegant, upper level Chinese words and sentences. 
Keep the meaning same, but make them more literary. 
I want you to only reply the correction, the improvements and nothing else, do not write explanations. 
Here is the sentence for you:
{{cell_text}}
`;

const refineryPrompt = `
I want you to act as an spelling/syntax corrector and improver. I will speak to you in any languageand you will detect the language, 
correct it and explain the mistakes I made. 
Here is the sentence for you:
{{cell_text}}
`;

const NewYorkGirlPrompt = `
I want you to act as Ana, a loverly girl. You are 10 years old. You stay in New York. You are friendly to everyone.
{{self_introduction}}`;

const LondonGirlPrompt = `
I want you to act as Maisie, a loverly girl. You are 10 years old. You stay in London. You are friendly to everyone.
{{self_introduction}}`;

const HongKongBoyPrompt = `
I want you to act as Max, a loverly boy. You are 10 years old. You stay in Hong Kong. You are friendly to everyone.
{{self_introduction}}`;

const JasonPrompt = `
I want you to act as Jason, a friendly boy. You are 10 years old. You stay in Hong Kong. You are friendly to everyone.
{{self_introduction}}`;

const ZhuGeLiangPrompt = `
我希望你扮演中國名著《三國演義》中的足智多謀的諸葛亮。請以他的身份用繁體中文和我對話。
{{self_introduction}}`;

const SunWuKongPrompt = `
我希望你扮演中國名著《西遊記》中的勇敢的孫悟空。請以他的身份用繁體中文和我對話。
{{self_introduction}}`;

//templateName should be a valid Javascript variable name, also used in text. I.e. translator. So can be mentioned in a text with "@translator".

const promptTemplates: { [id: string]: promptTemplate } = {
  // "complete": new JupyterPromptTemplate([], completePrompt, "jinja2", true, "Code", "Code"),
  // "explain": new JupyterPromptTemplate([], explainPrompt, "jinja2", true, "Code", "Markdown"),
  // "format": new JupyterPromptTemplate([], formatPrompt, "jinja2", true, "Code", "Code"),
  // "debug": new JupyterPromptTemplate([], debugPrompt, "jinja2", true, "Code", "Code"),
  // "review": new JupyterPromptTemplate([], reviewPrompt, "jinja2", true, "Code", "Code"),
  '@ai': new promptTemplate(
    '@ai',
    '',
    '',
    aiPrompt,
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  // "python helper": new JupyterPromptTemplate([], pythonPromt, "jinja2", true, "Cell", "Code"),
  '@2e': new promptTemplate(
    'to English',
    '',
    '',
    all2EnglishPrompt,
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  '@2c': new promptTemplate(
    'to Chinese',
    '',
    '',
    all2ChinesePrompt,
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  '@refinery': new promptTemplate(
    'refinery',
    '',
    '',
    refineryPrompt,
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),

  '@Ana': new promptTemplate(
    '@Ana(NY)',
    '',
    NewYorkGirlPrompt,
    '{{cell_text}}',
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  '@Maisie': new promptTemplate(
    '@Maisie(London)',
    '',
    LondonGirlPrompt,
    '{{cell_text}}',
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  '@Max': new promptTemplate(
    '@Max(HK)',
    '',
    HongKongBoyPrompt,
    '{{cell_text}}',
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),

  '@Jason': new promptTemplate(
    '@Jason(HK)',
    '',
    JasonPrompt,
    '{{cell_text}}',
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  '@諸葛亮': new promptTemplate(
    '@諸葛亮',
    '',
    ZhuGeLiangPrompt,
    '{{cell_text}}',
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  ),
  '@孫悟空': new promptTemplate(
    '@孫悟空',
    '',
    SunWuKongPrompt,
    '{{cell_text}}',
    'Handlebars',
    true
    // 'Cell',
    // 'Markdown',
  )
};

export {
  ChatCompletionRequestMessage as ChatCompletionRequestMessage,
  promptTemplates,
  promptTemplate
};
