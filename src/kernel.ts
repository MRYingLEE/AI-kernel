import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel } from '@jupyterlite/kernel';

import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: 'AILearn.live'
});

delete configuration.baseOptions.headers['User-Agent'];
let myOpenAI = new OpenAIApi(configuration);
/**
 * Test Handlebars
 */

const Handlebars = await import('handlebars');
const template = Handlebars.compile('Name: {{name}}');
console.log(template({ name: 'Nils' }));
/**
 * A kernel that chats content back.
 */
export class ChatKernel extends BaseKernel {
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
   *
   * @param msg The parent message.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    if (content.code.trim().toLowerCase().startsWith('key=')) {
      const configuration2 = new Configuration({
        apiKey: content.code.trim().slice('key='.length)
      });
      delete configuration2.baseOptions.headers['User-Agent'];
      myOpenAI = new OpenAIApi(configuration2);

      this.publishExecuteResult({
        execution_count: this.executionCount,
        data: {
          'text/plain':
            'OpenAI API Key (' +
            configuration.apiKey +
            ') has been assigned. Try now!'
        },
        metadata: {}
      });

      return {
        status: 'ok',
        execution_count: this.executionCount,
        user_expressions: {}
      };
    }
    const completion = await myOpenAI.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: content.code }]
    });

    const response = completion.data.choices[0].message?.content;

    this.publishExecuteResult({
      execution_count: this.executionCount,
      data: {
        'text/plain': response || ''
      },
      metadata: {}
    });

    // const { code } = content;

    // this.publishExecuteResult({
    //   execution_count: this.executionCount,
    //   data: {
    //     'text/plain': code + ' (powered by ChatGPT)'
    //   },
    //   metadata: {}
    // });

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
