// import { PageConfig } from '@jupyterlab/coreutils';

// import { KernelMessage } from '@jupyterlab/services';

// import { BaseKernel, IKernel } from '@jupyterlite/kernel';

// import { PromiseDelegate } from '@lumino/coreutils';

// import { wrap } from 'comlink';

// import { IRemoteAIWorkerKernel } from './tokens';

import { KernelMessage } from '@jupyterlab/services';

import { IKernel } from '@jupyterlite/kernel';

import { extractPersonAndMessage } from './chatSyntax';

import { backOff } from 'exponential-backoff';
import { OpenAIDriver } from './driver_azure';
// import { ChatMessage } from 'openai';
import { ChatMessage } from '@azure/openai';

import {
  globalCodeActions,
  inChainedCodeAction,
  IActionResult
} from './codeActions';
import { promptTemplate } from './promptTemplate';
import { MyConsole } from './controlMode';
import { JavaScriptKernel } from '@jupyterlite/javascript-kernel';
/**
 * A kernel that executes code in an IFrame.
 */
export class AIKernel extends JavaScriptKernel implements IKernel {
  /**
   * Instantiate a new AIKernel
   *
   * @param options The instantiation options for a new AIKernel
   */
  constructor(options: IOptions) {
    super(options);
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
  }

  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'AI',
      implementation_version: '1.0.0',
      language_info: {
        codemirror_mode: {
          name: 'markdown' //javascript' //, //'text/plain'-- To make sure wordwrap is enabled
          // lineWrapping: true,
          // spellcheck: true
        },
        file_extension: '.js',
        mimetype: 'text/x-markdown',
        name: 'AI',
        nbconvert_exporter: 'AI',
        pygments_lexer: 'AI',
        version: 'es2017'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'An AI kernel running in the browser',
      help_links: [
        {
          text: 'AI Kernel',
          url: 'https://github.com/MRYingLEE/ai-kernel/'
        }
      ]
    };
    return content;
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    return await this.remoteKernel.complete(content, this.parent);
  }

  /**
   * Handle an `inspect_request` message.
   *
   * @param _content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async inspectRequest(
    _content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle an `is_complete_request` message.
   *
   * @param _content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async isCompleteRequest(
    _content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Handle a `comm_info_request` message.
   *
   * @param _content - The content of the request.
   *
   * @returns A promise that resolves with the response message.
   */
  async commInfoRequest(
    _content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `input_reply` message.
   *
   * @param _content - The content of the reply.
   */
  inputReply(_content: KernelMessage.IInputReplyMsg['content']): void {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_open` message.
   *
   * @param _msg - The comm_open message.
   */
  async commOpen(_msg: KernelMessage.ICommOpenMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_msg` message.
   *
   * @param _msg - The comm_msg message.
   */
  async commMsg(_msg: KernelMessage.ICommMsgMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Send an `comm_close` message.
   *
   * @param close - The comm_close message.
   */
  async commClose(_msg: KernelMessage.ICommCloseMsg): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Load the worker.
   *
   * ### Note
   *
   * Subclasses must implement this typographically almost _exactly_ for
   * webpack to find it.
   */
  protected initWorker(_options: IOptions): Worker {
    return new Worker(new URL('./comlink.worker.js', import.meta.url), {
      type: 'module'
    });
  }

  // /**
  //  * Initialize the remote kernel.
  //  *
  //  * @param _options The options for the remote kernel.
  //  * @returns The initialized remote kernel.
  //  */
  // protected initRemote(_options: AIKernel.IOptions): IRemoteAIWorkerKernel {
  //   const remote: IRemoteAIWorkerKernel = wrap(this._worker);
  //   remote.initialize({ baseUrl: PageConfig.getBaseUrl() });
  //   return remote;
  // }

  // /**
  //  * Process a message coming from the AI web worker.
  //  *
  //  * @param msg The worker message to process.
  //  */
  // private _processWorkerMessage(msg: any): void {
  //   if (!msg.type) {
  //     return;
  //   }

  //   const parentHeader = msg.parentHeader || this.parentHeader;

  //   switch (msg.type) {
  //     case 'stream': {
  //       const bundle = msg.bundle ?? { name: 'stdout', text: '' };
  //       this.stream(bundle, parentHeader);
  //       break;
  //     }
  //     case 'input_request': {
  //       const bundle = msg.content ?? { prompt: '', password: false };
  //       this.inputRequest(bundle, parentHeader);
  //       break;
  //     }
  //     case 'display_data': {
  //       const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
  //       this.displayData(bundle, parentHeader);
  //       break;
  //     }
  //     case 'update_display_data': {
  //       const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
  //       this.updateDisplayData(bundle, parentHeader);
  //       break;
  //     }
  //     case 'clear_output': {
  //       const bundle = msg.bundle ?? { wait: false };
  //       this.clearOutput(bundle, parentHeader);
  //       break;
  //     }
  //     case 'execute_result': {
  //       const bundle = msg.bundle ?? {
  //         execution_count: 0,
  //         data: {},
  //         metadata: {}
  //       };
  //       this.publishExecuteResult(bundle, parentHeader);
  //       break;
  //     }
  //     case 'execute_error': {
  //       const bundle = msg.bundle ?? { ename: '', evalue: '', traceback: [] };
  //       this.publishExecuteError(bundle, parentHeader);
  //       break;
  //     }
  //     case 'comm_msg':
  //     case 'comm_open':
  //     case 'comm_close': {
  //       this.handleComm(
  //         msg.type,
  //         msg.content,
  //         msg.metadata,
  //         msg.buffers,
  //         msg.parentHeader
  //       );
  //       break;
  //     }
  //   }
  // }

  // protected remoteKernel: IRemoteAIWorkerKernel;

  // private _worker: Worker;
  // private _ready = new PromiseDelegate<void>();

  private publishMarkDownMessage(
    msg: string,
    status: 'error' | 'ok' | 'abort'
  ): KernelMessage.IExecuteReplyMsg['content'] {
    return this.publishMessage(msg, status, 'text/markdown');
  }

  private publishMessage(
    msg: string,
    _status: 'error' | 'ok' | 'abort',
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
      status: 'ok', //todo: to improve
      execution_count: this.executionCount,
      user_expressions: {}
    };
  }

  // async streamSync(ch: string, delay: number): Promise<void> {
  //   await new Promise(resolve => setTimeout(resolve, delay));

  //   await this.stream({ name: 'stdout', text: ch }, this.parentHeader);
  // }

  async process_actions(cell_text: string): Promise<IActionResult> {
    //To process in chaned actions in turn, ususally non-AI actions

    for (let i = 0; i < globalCodeActions.length; i++) {
      const result = await globalCodeActions[i].execute(cell_text);
      if (result.isProcessed) {
        return result;
      }
    }

    return inChainedCodeAction.notProcessed();
  }

  // async chatCompletion_sync(cell_text: string) {
  //   const [actions, pureMessage] = extractPersonAndMessage(cell_text);

  //   if (actions.length > 1) {
  //     return this.publishMarkDownMessage(
  //       '@ 2 or more actions are not supported so far!',
  //       'error'
  //     ); // We support this feature in the long future.
  //   } else if (actions.length === 1) {
  //     const theTemplateName = actions[0].substring(1);

  //     if (!promptTemplate.get_global_templates()[theTemplateName]) {
  //       let errorMsg =
  //         'The action ' +
  //         theTemplateName +
  //         ' is not defined! Please check. \n FYI: The current list is as the following:';

  //       for (const key in promptTemplate.get_global_templates()) {
  //         if (promptTemplate.get_global_templates()[key] === undefined) {
  //           continue;
  //         }
  //         errorMsg += '\n' + key;
  //       }
  //       return this.publishMarkDownMessage(errorMsg, 'error');
  //     } else {
  //       if (pureMessage.trim().length === 0) {
  //         promptTemplate
  //           .get_global_templates()
  //           [theTemplateName].startNewSession();
  //         return this.publishMarkDownMessage(
  //           'The chat history with ' +
  //             theTemplateName +
  //             ' has been cleared. Now you have a new session with it.',
  //           'ok'
  //         );
  //       }
  //     }
  //   }

  //   if (pureMessage.length * 2 > promptTemplate.MaxTokenLimit) {
  //     return this.publishMarkDownMessage(
  //       'The maxinum of input should be half of ' +
  //         promptTemplate.MaxTokenLimit,
  //       'error'
  //     );
  //   }

  //   let theTemplateName = 'ai';
  //   if (actions[0]) {
  //     theTemplateName = actions[0].substring(1);
  //   }

  //   let messages2send: ChatMessage[] = [];
  //   let usrContent = '';
  //   const statuses: { [key: string]: string } = { cell_text: pureMessage };

  //   if (actions.length === 0) {
  //     //No actions are mentioned
  //     messages2send.push({ role: 'user', content: pureMessage });
  //   } else {
  //     // The mentioned actions, which are critical to the following processing
  //     MyConsole.table(actions);
  //     const p = promptTemplate
  //       .get_global_templates()
  //       [theTemplateName].buildMessages2send(statuses);
  //     messages2send = messages2send.concat(p.messages2send);
  //     usrContent = p.usrContent;
  //   }
  //   if (messages2send.length === 0) {
  //     // if some exception happened, we may give some default but simple processing
  //     messages2send.push({ role: 'user', content: usrContent });
  //   }
  //   MyConsole.table(messages2send);

  //   const startTime = performance.now();

  //   try {
  //     let completion: any = null;
  //     if (MyConsole.inDebug) {
  //       completion = await OpenAIDriver.get_globalOpenAI().getChatCompletions(
  //         'gpt-35-turbo',
  //         messages2send
  //       );
  //     } else {
  //       //Todo: 1. To add delay at the 1st fail.
  //       //Todo: 2. extend the delay when the code is too old
  //       //Todo: 3. log the retry times
  //       //Todo: 4. extend delay after too much consumption
  //       completion = await backOff(() =>
  //         OpenAIDriver.get_globalOpenAI().getChatCompletions(
  //           'gpt-35-turbo',
  //           messages2send
  //         )
  //       );
  //     }

  //     MyConsole.table('completion.choices', completion.choices);

  //     const response = completion.choices[0].message?.content ?? '';
  //     //Todo: We should check the response carefully

  //     let theTemplate = promptTemplate.get_global_templates()['ai'];

  //     if (promptTemplate.get_global_templates()[theTemplateName]) {
  //       theTemplate = promptTemplate.get_global_templates()[theTemplateName];
  //     }
  //     //To add the prompt message here
  //     theTemplate.addMessage(
  //       'user',
  //       usrContent,
  //       '',
  //       completion.usage?.prompt_tokens || 0
  //     );
  //     //To add the completion message here
  //     theTemplate.addMessage(
  //       'assistant',
  //       response || '',
  //       '',
  //       completion.usage?.completion_tokens || 0
  //     );
  //     if (theTemplate.withMemory) {
  //       theTemplate.newSession = false;
  //     }

  //     // To process error in completion
  //     const error = completion.choices[0].finishReason;

  //     if (error === 'tokenLimitReached') {
  //       return this.publishMarkDownMessage(
  //         'The token Limit Reached error happened. You may wait for a few seconds and try again.',
  //         'error'
  //       );
  //     } else if (error === 'contentFiltered') {
  //       return this.publishMarkDownMessage(
  //         'The Content Filtered error happened in your input or the generated response. You may change your input and try again.',
  //         'error'
  //       );
  //     }

  //     // const md_iconURL = theTemplate.get_Markdown_iconURL();

  //     // const md_displayName = theTemplate.get_Markdown_DisplayName();

  //     // // debugger();
  //     let json_request = '';

  //     if (MyConsole.inDebug) {
  //       json_request =
  //         '**Prompt in JSON:**</p><p>' +
  //         '```json\n' +
  //         JSON.stringify(messages2send, null, 2) +
  //         '\n```';
  //     }

  //     const endTime = performance.now();
  //     const executionTime = endTime - startTime;

  //     let timepassed = '';
  //     if (MyConsole.inDebug) {
  //       timepassed = '\n(Execution time: ' + executionTime + ' milliseconds)';
  //     }

  //     return this.publishMarkDownMessage(
  //       json_request +
  //         //   '</p><p>' +
  //         //   '<table><tbody><tr><td align="left"><p><b>' +
  //         //   md_displayName +
  //         //   '</b>' +
  //         //   md_iconURL +
  //         //   '</p></td>' +
  //         //   '<td align="left">' +
  //         //   response || '' + '</td>' + '</tr></tbody></table>' +
  //         timepassed,
  //       'ok'
  //     );
  //   } catch (error: any) {
  //     return this.publishMarkDownMessage(
  //       '<p>**Error during getChatCompletions**:' +
  //         error.message +
  //         '</p><p>**Stack trace**:' +
  //         error.stack +
  //         '</p><p>' +
  //         // AIKernel.api_errors +
  //         '</p>',
  //       'error'
  //     );
  //   }
  // }
  stream_inline(text: string): void {
    const parentHeader = this.parentHeader;
    const bundle = {
      name: 'stdout' as const,
      text: text || ''
    };
    this.stream(bundle, parentHeader);
  }

  clearOutputNow(): void {
    const bundle = { wait: false };
    this.clearOutput(bundle, this.parentHeader);
  }

  async chatCompletion_async(cell_text: string) {
    const [actions, pureMessage] = extractPersonAndMessage(cell_text);

    if (actions.length > 1) {
      return this.publishMarkDownMessage(
        '@ 2 or more actions are not supported so far!',
        'error'
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
        return this.publishMarkDownMessage(errorMsg, 'error');
      } else {
        if (pureMessage.trim().length === 0) {
          promptTemplate
            .get_global_templates()
            [theTemplateName].startNewSession();
          return this.publishMarkDownMessage(
            'The chat history with ' +
              theTemplateName +
              ' has been cleared. Now you have a new session with it.',
            'ok'
          );
        }
      }
    }

    if (pureMessage.length * 2 > promptTemplate.MaxTokenLimit) {
      return this.publishMarkDownMessage(
        'The maxinum of input should be half of ' +
          promptTemplate.MaxTokenLimit,
        'error'
      );
    }

    let theTemplateName = 'ai';
    if (actions[0]) {
      theTemplateName = actions[0].substring(1);
    }

    let messages2send: ChatMessage[] = [];
    let usrContent = '';
    const statuses: { [key: string]: string } = { cell_text: pureMessage };

    this.stream_inline('**' + theTemplateName + '**' + ' is typing ...\n');
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

    const startTime = performance.now();
    let firstTokenTime = startTime;

    // try {
    //   let completion: any = null;
    //   if (MyConsole.inDebug) {
    //     completion = await OpenAIDriver.get_globalOpenAI().getChatCompletions(
    //       'gpt-35-turbo',
    //       messages2send
    //     );
    //   } else {
    //     //Todo: 1. To add delay at the 1st fail.
    //     //Todo: 2. extend the delay when the code is too old
    //     //Todo: 3. log the retry times
    //     //Todo: 4. extend delay after too much consumption
    //     completion = await backOff(() =>
    //       OpenAIDriver.get_globalOpenAI().getChatCompletions(
    //         'gpt-35-turbo',
    //         messages2send
    //       )
    //     );
    //   }
    let response = '';
    let tokens = 0;
    let last_finishReason = '';

    try {
      const deploymentId = 'gpt-35-turbo';
      let events;

      if (MyConsole.inDebug) {
        events = await OpenAIDriver.get_globalOpenAI().listChatCompletions(
          deploymentId,
          messages2send,
          {
            maxTokens: 1280
          }
        );
      } else {
        events = await backOff(() =>
          OpenAIDriver.get_globalOpenAI().listChatCompletions(
            deploymentId,
            messages2send,
            {
              maxTokens: 1280
            }
          )
        );
      }

      for await (const event of events) {
        tokens += 1;
        for (const choice of event.choices) {
          //console.log(choice.delta?.content);
          if (firstTokenTime === startTime) {
            firstTokenTime = performance.now();
            // this.clearOutputNow();
          }
          this.stream_inline(choice.delta?.content || '');
          response += choice?.delta?.content || '';
          last_finishReason = choice.finishReason || '';
          // console.log('The whole tokens is:', tokens, '. The whole response is :');
          // console.log(last_finishedReason);
          // console.log(response);
        }
      }
    } catch (err) {
      console.error('The AI Kernel encountered an error:', err);
    }

    this.clearOutputNow();
    this.stream_inline('**' + theTemplateName + '**' + ':\n' + response);
    // MyConsole.table('completion.choices', completion.choices);

    // const response = completion.choices[0].message?.content ?? '';
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
      tokens || 0 // Neee to recalculate
    );
    //To add the completion message here
    theTemplate.addMessage('assistant', response || '', '', tokens || 0);
    if (theTemplate.withMemory) {
      theTemplate.newSession = false;
    }

    // To process error in completion
    const error = last_finishReason;

    if (error === 'tokenLimitReached') {
      return this.publishMarkDownMessage(
        'The token Limit Reached error happened. You may wait for a few seconds and try again.',
        'error'
      );
    } else if (error === 'contentFiltered') {
      return this.publishMarkDownMessage(
        'The Content Filtered error happened in your input or the generated response. You may change your input and try again.',
        'error'
      );
    }

    // const md_iconURL = theTemplate.get_Markdown_iconURL();

    // const md_displayName = theTemplate.get_Markdown_DisplayName();

    // debugger();
    let json_request = '';

    if (MyConsole.inDebug) {
      json_request =
        '**Prompt in JSON:**</p><p>' +
        '```json\n' +
        JSON.stringify(messages2send, null, 2) +
        '\n```';
    }

    const endTime = performance.now();
    const firstTokenLag = firstTokenTime - startTime;
    const executionTime = endTime - startTime;

    let timepassed = '';
    if (MyConsole.inDebug) {
      timepassed =
        '\n(First Token lag: ' +
        firstTokenLag +
        ' milliseconds)' +
        '\n(Execution time: ' +
        executionTime +
        ' milliseconds)';
    }

    return this.publishMarkDownMessage(
      json_request +
        //   '</p><p>' +
        //   '<table><tbody><tr><td align="left"><p><b>' +
        //   md_displayName +
        //   '</b>' +
        //   md_iconURL +
        //   '</p></td>' +
        //   '<td align="left">' +
        //   response || '' + '</td>' + '</tr></tbody></table>' +
        timepassed,
      'ok'
    );
    // } catch(error: any) {
    //   return this.publishMarkDownMessage(
    //     '<p>**Error during getChatCompletions**:' +
    //     error.message +
    //     '</p><p>**Stack trace**:' +
    //     error.stack +
    //     '</p><p>' +
    //     // AIKernel.api_errors +
    //     '</p>',
    //     'error'
    //   );
    // }
  }
  /**
   * Handle an `execute_request` message
   *
   * @param msg The parent message.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const cell_text = content.code;
    const action_result = await this.process_actions(cell_text);

    if (action_result.isProcessed) {
      return this.publishMessage(
        action_result.outputResult,
        'ok',
        action_result.outputFormat
      );
    }

    const js_prefix = '%%js';

    if (cell_text.startsWith(js_prefix)) {
      const js_code = cell_text.slice(js_prefix.length);
      content.code = js_code;
      return super.executeRequest(content);
    } else {
      const result = await this.chatCompletion_async(cell_text);
      return result;
    }
  }
}

/**
 * A namespace for AIKernel statics
 */
export type IOptions = IKernel.IOptions;

// export namespace AIKernel {
//   /**
//    * The instantiation options for a AI kernel.
//    */
//   export type IOptions = IKernel.IOptions;
// }
