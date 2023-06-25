import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai'; ///* */

import { extractPersonAndMessage } from './chatSyntax';

import { promptTemplate, promptTemplates } from './promptTemplate';

import { user } from './user';

/*
We try to init OpenAIApi at the beginning
*/
const configuration = new Configuration({
  apiKey: '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'
});
delete configuration.baseOptions.headers['User-Agent'];
let globalOpenAI = new OpenAIApi(configuration);

/*
//Todo: to make sure Handlebars loaded at the beginning
*/
import Handlebars from 'handlebars/lib/handlebars';

/**
 * A kernel that chats with OpenAI.
 */
export class ChatKernel extends BaseKernel {
  /**
   * Instantiate a new JavaScriptKernel
   *
   * @param options The instantiation options for a new ChatKernel
   */
  constructor(options: ChatKernel.IOptions) {
    super(options);
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
  }
  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'Text',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'text/plain'
        },
        file_extension: '.txt',
        mimetype: 'text/plain',
        name: 'chat',
        nbconvert_exporter: 'text',
        pygments_lexer: 'text',
        version: 'es2017'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'A chat kernel running in the browser',
      help_links: [
        {
          text: 'Chat Kernel',
          url: 'https://github.com/MRYingLEE/chat-kernel/'
        }
      ]
    };
    return content;
  }

  /**
   * Handle an `execute_request` message
   * @param msg The parent message.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    if (content.code.trim().toLowerCase().startsWith('key=')) {
      const apiKey = content.code.trim().slice('key='.length);
      //The key should have a 20+ length.
      if (apiKey.length > 20) {
        const configuration2 = new Configuration({
          apiKey: apiKey
        });
        delete configuration2.baseOptions.headers['User-Agent'];
        globalOpenAI = new OpenAIApi(configuration2);

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
        let allActions = '';
        for (const key in promptTemplates) {
          if (!promptTemplates[key]) {
            continue;
          }
          allActions += '\n' + key;
        }

        this.publishExecuteResult({
          execution_count: this.executionCount,
          data: {
            'text/markdown':
              welcome +
              ', try now!' +
              '<p>' +
              'OpenAI API Key (' +
              configuration.apiKey +
              ') has been assigned.</p>' +
              '<p>FYI: The current list is as the following:<p/>' +
              allActions +
              '</p>'
          },
          metadata: {}
        });
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
          status: 'ok',
          execution_count: this.executionCount,
          user_expressions: {}
        };
      }
    }

    const [actions, pureMessage] = extractPersonAndMessage(content.code);

    let errorMsg = '';

    if (actions.length > 1) {
      errorMsg = '@ 2 or more actions are not supported so far!'; // We support this feature in the long future.
    } else if (actions.length === 1) {
      if (!promptTemplates[actions[0]]) {
        errorMsg =
          'The action ' +
          actions[0] +
          ' is not defined! Please check. \n FYI: The current list is as the following:';

        for (const key in promptTemplates) {
          if (promptTemplates[key] === undefined) {
            continue;
          }
          errorMsg += '\n' + key;
        }
      }
    }

    if (pureMessage.length * 2 > promptTemplate.MaxTokenLimit) {
      errorMsg =
        'The maxinum of input should be half of ' +
        promptTemplate.MaxTokenLimit;
    }

    if (errorMsg.length > 0) {
      this.publishExecuteResult({
        execution_count: this.executionCount,
        data: {
          'text/markdown': '**' + errorMsg + '**'
        },
        metadata: {}
      });

      return {
        status: 'ok',
        execution_count: this.executionCount,
        user_expressions: {}
      };
    }

    let messages: ChatCompletionRequestMessage[] = [];
    const statuses: { [key: string]: string } = { cell_text: pureMessage };

    if (actions.length === 0) {
      messages.push({ role: 'user', content: pureMessage });
    } else {
      console.log('Action:', actions[0]);
      messages = promptTemplates[actions[0]].buildTemplate(statuses);
    }
    if (messages.length === 0) {
      messages.push({ role: 'user', content: pureMessage });
    }
    console.table(messages);

    try {
      const completion = await globalOpenAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages
      });
      console.log('completion.data', completion.data);

      const response = completion.data.choices[0].message?.content ?? '';

      let theTemplate = promptTemplates['@ai'];

      if (promptTemplates[actions[0]]) {
        theTemplate = promptTemplates[actions[0]];
      }
      //To add the prompt message here
      theTemplate.addMessage(
        'user',
        messages[messages.length - 1]?.content || '',
        '',
        completion.data.usage?.prompt_tokens || 0
      );
      //To add the completion message here
      theTemplate.addMessage(
        'assistant',
        response || '',
        '',
        completion.data.usage?.completion_tokens || 0
      );
      this.publishExecuteResult({
        execution_count: this.executionCount,
        data: {
          'text/markdown':
            '**Prompt in JSON:**' +
              '```json\n' +
              JSON.stringify(messages, null, 2) +
              '\n```' +
              '</p><p>' +
              '**' +
              theTemplate.templateName +
              ':**' +
              '</p><p>' +
              response || ''
        },
        metadata: {}
      });
    } catch (error: any) {
      console.error('Error during createChatCompletion:', error.message);
      console.error('Stack trace:', error.stack);
    }

    return {
      status: 'ok',
      execution_count: this.executionCount,
      user_expressions: {}
    };
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle an `inspect_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle an `is_complete_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle a `comm_info_request` message.
   *
   * @param content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `input_reply` message.
   *
   * @param content - The content of the reply.
   */
  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_open` message.
   *
   * @param msg - The comm_open message.
   */
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param msg - The comm_msg message.
   */
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    throw new Error('Not implemented');
  }
}

/**
 * A namespace for JavaScriptKernel statics
 */
namespace ChatKernel {
  /**
   * The instantiation options for a Chat kernel.
   */
  export type IOptions = IKernel.IOptions;
}
