// The chat format terms are based on ones of ChatGPT

import { ChatRequestMessage } from '@azure/openai';

// import { user } from './user';
import { MyConsole } from './controlMode';

// import Handlebars from 'handlebars/lib/handlebars';
import { ICodeSnippet } from 'jupyterlab_examples_prompts';
import { renderUserTemplate, renderSysTemplate } from './renderTemplate';

// Create a class named chatItem with attributes: promptName:String, Role:String, contents:string, timestamp:Datetime
export class IOMessage {
  snippet: ICodeSnippet; // The prompt template
  timestamp: Date;
  newSession: boolean;
  tokenUsage = 0;
  msg2send: ChatRequestMessage; // The real request message to OpenAI service

  private constructor(
    snippet: ICodeSnippet,
    role: 'system' | 'user' | 'assistant' | 'function',
    content: string,
    // name: string,
    timestamp: Date,
    newSession: boolean,
    tokenUsage = 0
  ) {
    // A big supprise is that if the name is '', the request will fail.
    // So we have to make the following adjust following 1 week debugging
    this.msg2send = {
      name: '',
      role: role,
      content: content
    };

    this.snippet = snippet;
    this.timestamp = timestamp;
    this.newSession = newSession;
    this.tokenUsage = tokenUsage;
  }

  static withMemory(snippet: ICodeSnippet): boolean {
    return snippet.name.startsWith('@');
  }

  get_Markdown_iconURL(): string {
    let md_iconURL = '';

    if (this.snippet.iconURL) {
      if (this.snippet.iconURL.trim().length > 0) {
        md_iconURL =
          // '![' + this.get_Markdown_DisplayName() + '](' + this.iconURL + ')';
          '<img src="' +
          this.snippet.iconURL +
          '" alt="' +
          this.snippet.name +
          '">';
      }
    }
    return md_iconURL;
  }

  static global_messages: IOMessage[] = [];
  static global_newSession: { [key: string]: boolean } = {};

  //Todo: Should we support a global Message list directly?
  static addMessage(
    snippet: ICodeSnippet,
    Role: 'system' | 'user' | 'assistant',
    content: string,
    // name: string,
    tokenUsage = 0
  ): void {
    MyConsole.debug('conetnt:', content);
    IOMessage.global_messages.push(
      new IOMessage(
        snippet,
        Role,
        content,
        // name,
        new Date(Date.now()),
        IOMessage.global_newSession[snippet.name] || true,
        tokenUsage
      )
    );
    MyConsole.table(IOMessage.global_messages);
  }

  // static removeLastMessage(): void {
  //   if (this.withMemory()) {
  //     IOMessage.global_messages.pop();
  //   }
  // }

  static startNewSession(snippet: ICodeSnippet): void {
    // if (this.withMemory)
    this.global_newSession[snippet.name] = true;
  }

  static MaxTokenLimit = 4097; // for GPT-3.5
  static getSessionHistory(
    snippet: ICodeSnippet,
    currentToken: number
  ): ChatRequestMessage[] {
    //Todo: A lot of improvement here. 1. Token limit instead of char limit 2. Guarantee the pair of messages are added. 3. Avoid failed user message 4. Retry

    const history: ChatRequestMessage[] = [];

    let totalToken = currentToken;

    //To find the system message of the latest session
    let systemMessage;
    for (let i = IOMessage.global_messages.length - 1; i >= 0; i--) {
      if (IOMessage.global_messages[i].snippet === snippet) {
        if (IOMessage.global_messages[i].newSession) {
          totalToken += IOMessage.global_messages[i].tokenUsage;
          systemMessage = IOMessage.global_messages[i].msg2send;
          break;
        }
      }
    }

    MyConsole.debug('TotalToken:', totalToken);

    for (let i = IOMessage.global_messages.length - 1; i >= 0; i--) {
      if (IOMessage.global_messages[i].snippet === snippet) {
        if (IOMessage.global_messages[i].newSession) {
          break;
        }

        if (
          IOMessage.global_messages[i].tokenUsage + totalToken <
          IOMessage.MaxTokenLimit
        ) {
          history.push(IOMessage.global_messages[i].msg2send);
          totalToken += IOMessage.global_messages[i].tokenUsage;
        }
      }
    }

    if (systemMessage) {
      history.push(systemMessage);
    }

    return history.reverse();
  }

  // static TokenLimit = 1000;

  static buildMessages2send(
    snippet: ICodeSnippet,
    statuses: { [key: string]: string }
  ): {
    messages2send: ChatRequestMessage[]; //The Request Messages to be sent to ChatGPT
    usrContent: string; //The logical user message for the current chat session
  } {
    // MyConsole.debug('statuses:', statuses);
    // MyConsole.debug('this.systemMessageTemplate:', this.systemMessageTemplate);
    // MyConsole.debug('this.userMessageTemplate:', this.userMessageTemplate);

    let messages2send: ChatRequestMessage[] = [];

    const sysContent = renderSysTemplate(snippet, statuses);
    MyConsole.debug('sysContent:', sysContent);

    const usrContent = renderUserTemplate(snippet, statuses);
    MyConsole.debug('usrContent:', usrContent);

    if ((sysContent + usrContent).trim() === '') {
      return { messages2send, usrContent };
    }

    if (IOMessage.withMemory(snippet)) {
      if (IOMessage.global_newSession[snippet.name] === false) {
        messages2send = IOMessage.getSessionHistory(
          snippet,
          usrContent.length * 2
        ); // for temporation estimation of prompt tokens
      } else {
        // this.newSession = false; //Maybe only when request succeeds, we make it flase
      }
    }

    const msg2send: ChatRequestMessage = {
      name: '',
      role: 'user',
      content: sysContent + '\n' + usrContent
    };
    messages2send.push(msg2send);
    return { messages2send, usrContent };
  }
  //Prompt templates are NOT managed here.

  // static _global_templates: { [id: string]: IOMessage } = {};
  // static _initialized = false;
  // static get_global_templates(): { [id: string]: IOMessage } {
  //   if (!IOMessage._initialized) {
  //     // to make sure it is initialized
  //     IOMessage.addDefaultTemplates();
  //     IOMessage._initialized = true;
  //   }
  //   return this._global_templates;
  // }

  // static AddTemplate(
  //   roleID: string,
  //   roleDefine: string,
  //   displayName: string,
  //   // withMemory: boolean,
  //   iconURL?: string
  // ): ICodeSnippet | undefined {
  //   try {
  //     const newSnippet: ICodeSnippet = {
  //       name: roleID,
  //       description: displayName,
  //       language: 'Markdown',
  //       code: '{{self_introduction}}\n' + roleDefine,
  //       id: CodeSnippetService.snippets.length,
  //       tags: [],
  //       templateEngine: 'Handlebars',
  //       voiceName: '',
  //       iconURL: iconURL
  //     };

  //     // if (Handlebars) {
  //     //   try {
  //     //     template.f_sysTemplate = Handlebars.compile(template.code);
  //     //   } catch {
  //     //     template.f_sysTemplate = undefined;
  //     //   }

  //     // try {
  //     //   template.f_userTemplate = Handlebars.compile(
  //     //     template.userMessageTemplate
  //     //   );
  //     // } catch {
  //     //   template.f_userTemplate = undefined;
  //     // }
  //     // }

  //     // MyConsole.debug('new template:', template);

  //     // promptTemplate._global_templates[roleID] = template;

  //     // MyConsole.table(promptTemplate._global_templates);
  //     CodeSnippetService.addSnippet(newSnippet);
  //     return newSnippet;
  //   } catch (error: any) {
  //     return undefined;
  //   }
  // }

  // static addDefaultTemplates(): void {
  //   // To avoid duplicate
  //   if (IOMessage._initialized) {
  //     return;
  //   }
  //   const aiPrompt = `
  //   **Your name is AI and you are a good tutor. You are helping the user with their task.**
  //   Here is the task or question that the user is asking you:
  //   `;

  //   let newTemplte = IOMessage.AddTemplate('/ai', aiPrompt, 'AI');
  //   if (!newTemplte) {
  //     console.error('The define of prompt template' + 'AI' + ' failed.');
  //   }

  //   const chatPrompt = `
  //   **Your name is AI and you are a good tutor. You are helping the user with their task.**
  //   `;
  //   newTemplte = IOMessage.AddTemplate('@chat', chatPrompt, 'Chat');
  //   if (!newTemplte) {
  //     console.error('The define of prompt template' + 'Chat' + ' failed.');
  //   }
  //   // const all2EnglishPrompt = `
  //   // I want you to act as an English translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language,
  //   // translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentenceswith more
  //   // beautiful and elegant, upper level English words and sentences.
  //   // Keep the meaning same, but make them more literary.
  //   // I want you to only reply the correction, the improvements and nothing else, do not write explanations.
  //   // Here is the sentence for you:
  //   // `;
  //   // newTemplte = IOMessage.AddTemplate('/2e', all2EnglishPrompt, 'to English');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + '2e' + ' failed.');
  //   // }

  //   // const all2ChinesePrompt = `
  //   // I want you to act as an Chinese translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language,
  //   // translate it and answer in the corrected and improved version of my text, in Chinese. I want you to replace my simplified A0-level words and sentenceswith more
  //   // beautiful and elegant, upper level Chinese words and sentences.
  //   // Keep the meaning same, but make them more literary.
  //   // I want you to only reply the correction, the improvements and nothing else, do not write explanations.
  //   // Here is the sentence for you:
  //   // `;
  //   // newTemplte = IOMessage.AddTemplate('/2c', all2ChinesePrompt, 'to Chinese');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + '2c' + ' failed.');
  //   // }

  //   // const all2MotherLanguagePrompt = `
  //   // I want you to act as an translator,spelling corrector and improver. I will speak to you in any languageand you will detect the language,
  //   // translate it and answer in the corrected and improved version of my text, in MY MOTHERLANGURAGE. I want you to replace my simplified A0-level words and sentenceswith more
  //   // beautiful and elegant, upper level words and sentences.
  //   // Keep the meaning same, but make them more literary.
  //   // I want you to only reply the correction, the improvements and nothing else, do not write explanations.
  //   // Here is the sentence for you:
  //   // `;
  //   // newTemplte = IOMessage.AddTemplate(
  //   //   '/2m',
  //   //   all2MotherLanguagePrompt,
  //   //   'to my mother language'
  //   // );
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + '2m' + ' failed.');
  //   // }

  //   // const refineryPrompt = `
  //   // I want you to act as an spelling/syntax corrector and improver. I will speak to you in any languageand you will detect the language,
  //   // correct it and explain the mistakes I made.
  //   // Here is the sentence for you:
  //   // `;
  //   // newTemplte = IOMessage.AddTemplate('/refine', refineryPrompt, 'Refine');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + 'Refine' + ' failed.');
  //   // }

  //   // const NewYorkGirlPrompt = `
  //   // I want you to act as Ana, a loverly girl. You are 10 years old. You stay in New York. You are friendly to everyone.`;
  //   // newTemplte = IOMessage.AddTemplate('@Ana', NewYorkGirlPrompt, 'Ana(US)');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + 'Ana(US)' + ' failed.');
  //   // }

  //   // const LondonGirlPrompt = `
  //   // I want you to act as Maisie, a loverly girl. You are 10 years old. You stay in London. You are friendly to everyone.`;
  //   // newTemplte = IOMessage.AddTemplate(
  //   //   '@Maisie',
  //   //   LondonGirlPrompt,
  //   //   'Maisie(UK)'
  //   // );
  //   // if (!newTemplte) {
  //   //   console.error(
  //   //     'The define of prompt template' + 'Maisie(UK)' + ' failed.'
  //   //   );
  //   // }

  //   // const HongKongBoyPrompt = `
  //   // I want you to act as Max, a loverly boy. You are 10 years old. You stay in Hong Kong. You are friendly to everyone.`;
  //   // newTemplte = IOMessage.AddTemplate('@Max', HongKongBoyPrompt, 'Max(HK)');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + 'Max(HK)' + ' failed.');
  //   // }

  //   // const ZhuGeLiangPrompt = `
  //   // 我希望你扮演中國名著《三國演義》中的足智多謀的諸葛亮。請以他的身份用繁體中文和我對話。`;
  //   // newTemplte = IOMessage.AddTemplate('@諸葛亮', ZhuGeLiangPrompt, '諸葛亮');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + '諸葛亮' + ' failed.');
  //   // }

  //   // const SunWuKongPrompt = `
  //   // 我希望你扮演中國名著《西遊記》中的勇敢的孫悟空。請以他的身份用繁體中文和我對話。`;
  //   // newTemplte = IOMessage.AddTemplate('@孫悟空', SunWuKongPrompt, '孫悟空');
  //   // if (!newTemplte) {
  //   //   console.error('The define of prompt template' + '孫悟空' + ' failed.');
  //   // }
  // }
}
// }
export { ChatRequestMessage, IOMessage as promptTemplate };
