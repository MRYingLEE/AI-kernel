import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { extractPersonAndMessage } from './chatSyntax';

import { backOff } from 'exponential-backoff';
import { OpenAIDriver } from './driver_openai';
import { ChatCompletionRequestMessage } from 'openai';
import {
  inChainedCodeAction,
  IActionResult,
  globalCodeActions
} from './codeActions';
import { promptTemplate } from './promptTemplate';
import { MyConsole } from './controlMode';
/*
//Todo: to make sure Handlebars loaded at the beginning
*/
// import Handlebars from 'handlebars/lib/handlebars';

/**
 * A kernel that chats with OpenAI.
 */
export class ChatKernel extends BaseKernel {
  action_debug(code: string): Promise<IActionResult> {
    if (code.trim() === '/debug:AILive.live') {
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
  /**
   * Instantiate a new JavaScriptKernel
   *
   * @param options The instantiation options for a new ChatKernel
   */
  constructor(options: ChatKernel.IOptions) {
    super(options);
    globalCodeActions.push(new inChainedCodeAction(this.action_debug, 999));
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
          name: 'javascript' //, //'text/plain'-- To make sure wordwrap is enabled
          // lineWrapping: true,
          // spellcheck: true
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

  static api_errors_en = `
  | Code                                       | Overview                                                                                                                                                                                                                                                                               |
  |--------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  | 401 - Invalid Authentication               | **Cause:** Invalid Authentication <br> **Solution:** Ensure the correct [API key](/account/api-keys) and requesting organization are being used.                                                                                                                                     |
  | 401 - Incorrect API key provided           | **Cause:** The requesting API key is not correct. <br> **Solution:** Ensure the API key used is correct, clear your browser cache, or [generate a new one](/account/api-keys).                                                                                                       |
  | 401 - You must be a member of an organization to use the API | **Cause:** Your account is not part of an organization. <br> **Solution:** Contact us to get added to a new organization or ask your organization manager to [invite you to an organization](/account/members).                                                                     |
  | 429 - Rate limit reached for requests      | **Cause:** You are sending requests too quickly. <br> **Solution:** Pace your requests. Read the [Rate limit guide](/docs/guides/rate-limits).                                                                                                                                      |
  | 429 - You exceeded your current quota, please check your plan and billing details | **Cause:** You have hit your maximum monthly spend (hard limit) which you can view in the [account billing section](/account/billing/limits). <br> **Solution:** [Apply for a quota increase](/forms/quota-increase).                                                               |
  | 500 - The server had an error while processing your request | **Cause:** Issue on our servers. <br> **Solution:** Retry your request after a brief wait and contact us if the issue persists. Check the [status page](https://status.openai.com/){:target="_blank" rel="noopener noreferrer"}.                                                    |
  | 503 - The engine is currently overloaded, please try again later | **Cause:** Our servers are experiencing high traffic. <br> **Solution:** Please retry your requests after a brief wait.                                                                                                                                                             |
  `;
  static api_errors_cn = `
  | 代码 | 概述 |
  | --- | --- |
  | 401 - 认证无效 | 原因：认证无效 <br> 解决方案：确保使用了正确的API密钥和请求组织。 |
  | 401 - 提供的API密钥不正确 | 原因：请求的API密钥不正确。 <br> 解决方案：确保使用的API密钥正确，清除浏览器缓存或生成一个新的API密钥。 |
  | 401 - 您必须是组织的成员才能使用API | 原因：您的帐户不是组织的一部分。 <br> 解决方案：联系我们以加入新组织，或要求您的组织管理员邀请您加入组织。 |
  | 429 - 请求速度过快 | 原因：您发送请求的速度过快。 <br> 解决方案：放慢请求速度。阅读[速率限制指南](/docs/guides/rate-limits)。 |
  | 429 - 您已超过当前配额，请检查您的计划和账单详情 | 原因：您已达到最大月度支出（硬限制），您可以在[账户计费部分](/account/billing/limits)查看。 <br> 解决方案：[申请配额增加](/forms/quota-increase)。 |
  | 500 - 服务器在处理您的请求时出错 | 原因：我们的服务器出现问题。 <br> 解决方案：稍等片刻后重试您的请求，如果问题仍然存在，请联系我们。查看[状态页面](https://status.openai.com/){:target="_blank" rel="noopener noreferrer"}。 |
  | 503 - 引擎当前过载，请稍后再试 | 原因：我们的服务器正在经历高流量。 <br> 解决方案：请稍等片刻后重试您的请求。 |
  `;
  static api_errors =
    '**The API errors of ChatGPT are listed here for your reference**:\n' +
    ChatKernel.api_errors_en +
    '\n' +
    '**ChatGPT API 错误代码表供您参考**：\n' +
    ChatKernel.api_errors_cn;

  private publishMarkDownMessage(
    msg: string
  ): KernelMessage.IExecuteReplyMsg['content'] {
    return this.publishMessage(msg, 'text/markdown');
  }

  private publishMessage(
    msg: string,
    format: string //limited options later
  ): KernelMessage.IExecuteReplyMsg['content'] {
    this.publishExecuteResult({
      execution_count: this.executionCount,
      data: {
        [format]: msg
      },
      metadata: {}
    });

    return {
      status: 'ok',
      execution_count: this.executionCount,
      user_expressions: {}
    };
  }

  /**
   * Handle an `execute_request` message
   * @param msg The parent message.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const cell_text = content.code;

    //To process in chaned actions in turn, ususally non-AI actions

    for (let i = 0; i < globalCodeActions.length; i++) {
      const result = await globalCodeActions[i].execute(cell_text);
      if (result.isProcessed) {
        return this.publishMessage(result.outputResult, result.outputFormat);
      }
    }

    const [actions, pureMessage] = extractPersonAndMessage(content.code);

    if (actions.length > 1) {
      return this.publishMarkDownMessage(
        '@ 2 or more actions are not supported so far!'
      ); // We support this feature in the long future.
    } else if (actions.length === 1) {
      const theTemplateName = actions[0].substring(1);

      if (!promptTemplate.get_global_templates()[theTemplateName]) {
        let errorMsg =
          'The action ' +
          theTemplateName +
          ' is not defined! Please check. \n FYI: The current list is as the following:';

        for (const key in promptTemplate.get_global_templates()) {
          if (promptTemplate.get_global_templates()[key] === undefined) {
            continue;
          }
          errorMsg += '\n' + key;
        }
        return this.publishMarkDownMessage(errorMsg);
      } else {
        if (pureMessage.trim().length === 0) {
          promptTemplate
            .get_global_templates()
            [theTemplateName].startNewSession();
          return this.publishMarkDownMessage(
            'The chat history with ' +
              theTemplateName +
              ' has been cleared. Now you have a new session with it.'
          );
        }
      }
    }

    if (pureMessage.length * 2 > promptTemplate.MaxTokenLimit) {
      return this.publishMarkDownMessage(
        'The maxinum of input should be half of ' + promptTemplate.MaxTokenLimit
      );
    }

    let theTemplateName = 'ai';
    if (actions[0]) {
      theTemplateName = actions[0].substring(1);
    }

    let messages2send: ChatCompletionRequestMessage[] = [];
    let usrContent = '';
    const statuses: { [key: string]: string } = { cell_text: pureMessage };

    if (actions.length === 0) {
      //No actions are mentioned
      messages2send.push({ role: 'user', content: pureMessage });
    } else {
      // The mentioned actions, which are critical to the following processing
      MyConsole.table(actions);
      const p = promptTemplate
        .get_global_templates()
        [theTemplateName].buildMessages2send(statuses);
      messages2send = messages2send.concat(p.messages2send);
      usrContent = p.usrContent;
    }
    if (messages2send.length === 0) {
      // if some exception happened, we may give some default but simple processing
      messages2send.push({ role: 'user', content: usrContent });
    }
    MyConsole.table(messages2send);

    try {
      let completion: any = null;
      if (MyConsole.inDebug) {
        completion = await OpenAIDriver.globalOpenAI.createChatCompletion({
          model: 'gpt-3.5-turbo-0613',
          messages: messages2send
        });
      } else {
        //Todo: 1. To add delay at the 1st fail.
        //Todo: 2. extend the delay when the code is too old
        //Todo: 3. log the retry times
        //Todo: 4. extend delay after too much consumption
        completion = await backOff(() =>
          OpenAIDriver.globalOpenAI.createChatCompletion({
            model: 'gpt-3.5-turbo-0613',
            messages: messages2send
          })
        );
      }

      MyConsole.debug('completion.data', completion.data);

      const response = completion.data.choices[0].message?.content ?? '';
      //Todo: We should check the response carefully

      let theTemplate = promptTemplate.get_global_templates()['ai'];

      if (promptTemplate.get_global_templates()[theTemplateName]) {
        theTemplate = promptTemplate.get_global_templates()[theTemplateName];
      }
      //To add the prompt message here
      theTemplate.addMessage(
        'user',
        usrContent,
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
      if (theTemplate.withMemory) {
        theTemplate.newSession = false;
      }

      const md_iconURL = theTemplate.get_Markdown_iconURL();

      const md_displayName = theTemplate.get_Markdown_DisplayName();

      // debugger();
      let json_request = '';

      if (MyConsole.inDebug) {
        json_request =
          '**Prompt in JSON:**</p><p>' +
          '```json\n' +
          JSON.stringify(messages2send, null, 2) +
          '\n```';
      }

      return this.publishMarkDownMessage(
        json_request +
          '</p><p>' +
          '<table><tbody><tr><td align="left"><p><b>' +
          md_displayName +
          '</b>' +
          md_iconURL +
          '</p></td>' +
          '<td align="left">' +
          response || '' + '</td>' + '</tr></tbody></table>'
      );
    } catch (error: any) {
      return this.publishMarkDownMessage(
        '<p>**Error during createChatCompletion**:' +
          error.message +
          '</p><p>**Stack trace**:' +
          error.stack +
          '</p><p>' +
          ChatKernel.api_errors +
          '</p>'
      );
    }
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
