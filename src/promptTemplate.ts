// The chat format terms are based on ones of ChatGPT
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum
} from 'openai';
import { user } from './user';
import Handlebars from 'handlebars/lib/handlebars';

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

// Create a class named chatItem with attributes: promptName:String, Role:String, contents:string, timestamp:Datetime
class message {
  template: IPromptTemplateProps; // The prompt template

  coremessage: ChatCompletionRequestMessage; // The real request message to OpenAI service

  timestamp: Date;
  newSession: boolean;

  tokenUsage = 0;

  constructor(
    template: IPromptTemplateProps,
    role: ChatCompletionRequestMessageRoleEnum, //'system' | 'user' | 'assistant',
    content: string,
    name: string,
    timestamp: Date,
    newSession: boolean,
    tokenUsage = 0
  ) {
    this.coremessage = {
      role: role,
      content: content,
      name: name
    };

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

  systemMessageTemplate: string;
  userMessageTemplate: string;

  templateFormat?: 'f-string' | 'jinja2' | 'Handlebars';
  // validateTemplate?: boolean;

  // get_inputVariables(): [string]{

  // }
  // inputVariables: string[];

  inputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw'; //'Cell' is the default //added by Ying
  outputCellType?: 'Cell' | 'Code' | 'Markdown' | 'Raw'; //'Markdown' is the default //added by Ying

  withMemory: boolean; //false is the default //added by Ying

  newSession: boolean; //true is the default //added by Ying

  tokenInMessage = 0;
  tokenInResponse = 0;

  // f_sysTemplate: { [key: string]: string } | undefined;
  f_sysTemplate: HandlebarsTemplateDelegate<any> | undefined;

  // f_userTemplate: { [key: string]: string } | undefined;
  f_userTemplate: HandlebarsTemplateDelegate<any> | undefined;

  static global_messages: message[] = [];
  static generateTemplateFunctions(): void {
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
  }

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
    withMemory?: boolean,
    newSession?: boolean
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
    this.newSession = newSession ?? true;

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
    console.log('conetnt:', content);
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

  getSessionHistoy(tokenLimit = 4000): ChatCompletionRequestMessage[] {
    //Todo: A lot of improvement here. 1. Token limit instead of char limit 2. Guarantee the pair of messages are added. 3. Avoid failed user message 4. Retry

    const history: ChatCompletionRequestMessage[] = [];

    let totalToken = 0;

    let systemMessage;
    for (let i = promptTemplate.global_messages.length - 1; i >= 0; i--) {
      if (promptTemplate.global_messages[i].template === this) {
        if (promptTemplate.global_messages[i].newSession) {
          totalToken =
            promptTemplate.global_messages[i].coremessage.content.length;
          systemMessage = promptTemplate.global_messages[i].coremessage;
        }
      }
    }

    console.log('TotalToken:', totalToken);

    for (let i = promptTemplate.global_messages.length - 1; i >= 0; i--) {
      if (promptTemplate.global_messages[i].template === this) {
        if (promptTemplate.global_messages[i].newSession) {
          break;
        }

        if (
          totalToken +
            promptTemplate.global_messages[i].coremessage.content.length <
          tokenLimit
        ) {
          history.push(promptTemplate.global_messages[i].coremessage);
          totalToken +=
            promptTemplate.global_messages[i].coremessage.content.length;
        }
      }
    }

    if (systemMessage) {
      history.push(systemMessage);
    }

    return history.reverse();
  }

  static TokenLimit = 1000;

  renderUserTemplate(statuses: { [key: string]: string }): string {
    const new_statuses = statuses;
    new_statuses['self_introduction'] = user.current_user.self_introduction();
    let content = '';
    try {
      if (this.f_userTemplate) {
        content = this.f_userTemplate(new_statuses);
      }
    } catch {
      console.log(this.userMessageTemplate);
    }
    console.log('content:', content);
    return content;
  }

  renderSysTemplate(statuses: { [key: string]: string }): string {
    const new_statuses = statuses;
    new_statuses['self_introduction'] = user.current_user.self_introduction();
    let content = '';
    try {
      if (this.f_sysTemplate) {
        content = this.f_sysTemplate(new_statuses);
      }
    } catch {
      console.log(this.systemMessageTemplate);
    }
    console.log('content:', content);
    return content;
  }

  buildTemplate(statuses: {
    [key: string]: string;
  }): ChatCompletionRequestMessage[] {
    console.log(
      'statuses:',
      statuses,
      '\n this.systemMessageTemplate:',
      this.systemMessageTemplate,
      '\nthis.userMessageTemplate:',
      this.userMessageTemplate
    );
    let sysContent = '';
    if (this.newSession) {
      sysContent = this.renderSysTemplate(statuses);
    }
    console.log('sysContent:', sysContent);

    let usrContent = this.renderUserTemplate(statuses);
    console.log('usrContent:', usrContent);

    if ((sysContent + usrContent).trim() === '') {
      return [];
    }

    if (usrContent.trim() === '') {
      // this.addMessage('user', sysContent, ''); //The system message is not taken attention by ChatGPT. So we have to put it in user message.
      if (this.withMemory) {
        this.newSession = false;
      }
    } else {
      if (sysContent) {
        // this.addMessage("system", sysContent, "");  The system message is not taken attention by ChatGPT. So we have to put it in user message.
        if (this.withMemory) {
          this.newSession = false;
        }

        usrContent = sysContent + '\n' + usrContent;
      }

      // this.addMessage('user', usrContent, '');
    }

    const messages = this.getSessionHistoy(promptTemplate.TokenLimit);

    return messages;
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
//     console.log("The following Python code has been developed:\n```Python\n" + result + "\n```\n");
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
**Your name is AI and you are a coding assistant. You are helping the user with their task.**

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
    aiPrompt,
    '',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    false
  ),
  // "python helper": new JupyterPromptTemplate([], pythonPromt, "jinja2", true, "Cell", "Code"),
  '@2e': new promptTemplate(
    'to English',
    '',
    all2EnglishPrompt,
    '',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    false
  ),
  '@2c': new promptTemplate(
    'to Chinese',
    '',
    all2ChinesePrompt,
    '',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    false
  ),
  '@refinery': new promptTemplate(
    'refinery',
    '',
    refineryPrompt,
    '',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    false
  ),

  '@Ana': new promptTemplate(
    '@Ana(NY)',
    '',
    NewYorkGirlPrompt,
    '{{cell_text}}',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    true
  ),
  '@Maisie': new promptTemplate(
    '@Maisie(London)',
    '',
    LondonGirlPrompt,
    '{{cell_text}}',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    true
  ),
  '@Max': new promptTemplate(
    '@Max(HK)',
    '',
    HongKongBoyPrompt,
    '{{cell_text}}',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    true
  ),

  '@Jason': new promptTemplate(
    '@Jason(HK)',
    '',
    JasonPrompt,
    '{{cell_text}}',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    true
  ),
  '@諸葛亮': new promptTemplate(
    '@諸葛亮',
    '',
    ZhuGeLiangPrompt,
    '{{cell_text}}',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    true
  ),
  '@孫悟空': new promptTemplate(
    '@孫悟空',
    '',
    SunWuKongPrompt,
    '{{cell_text}}',
    'Handlebars',
    true,
    // 'Cell',
    // 'Markdown',
    true
  )
};

export {
  ChatCompletionRequestMessage as coreMessage,
  promptTemplates,
  promptTemplate
};
