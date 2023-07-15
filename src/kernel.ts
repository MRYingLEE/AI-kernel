import { PageConfig } from '@jupyterlab/coreutils';

import { PromiseDelegate } from '@lumino/coreutils';

import { wrap } from 'comlink';

import { IRemoteAIWorkerKernel } from './tokens';

import { KernelMessage } from '@jupyterlab/services';

import { IKernel } from '@jupyterlite/kernel';

import {
  globalCodeActions,
  inChainedCodeAction,
  IActionResult
} from './codeActions';
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
    this._worker_AI = this.initWorker(options); // We may support many workers!
    this._worker_AI.onmessage = e => this._processWorkerMessage_AI(e.data);
    this.remoteKernel_AI = this.initRemote(options);
    this._ready_AI.resolve();
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._worker_AI.terminate();
    (this._worker_AI as any) = null;
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
    return await this.remoteKernel_AI.complete(content, this.parent);
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

  /**
   * Initialize the remote kernel.
   *
   * @param _options The options for the remote kernel.
   * @returns The initialized remote kernel.
   */
  protected initRemote(_options: IOptions): IRemoteAIWorkerKernel {
    const remote: IRemoteAIWorkerKernel = wrap(this._worker_AI);
    remote.initialize({ baseUrl: PageConfig.getBaseUrl() });
    return remote;
  }

  /**
   * Process a message coming from the AI web worker.
   *
   * @param msg The worker message to process.
   */
  private _processWorkerMessage_AI(msg: any): void {
    if (!msg.type) {
      return;
    }

    const parentHeader = msg.parentHeader || this.parentHeader;

    switch (msg.type) {
      case 'stream': {
        const bundle = msg.bundle ?? { name: 'stdout', text: '' };
        this.stream(bundle, parentHeader);
        break;
      }
      case 'input_request': {
        const bundle = msg.content ?? { prompt: '', password: false };
        this.inputRequest(bundle, parentHeader);
        break;
      }
      case 'display_data': {
        const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
        this.displayData(bundle, parentHeader);
        break;
      }
      case 'update_display_data': {
        const bundle = msg.bundle ?? { data: {}, metadata: {}, transient: {} };
        this.updateDisplayData(bundle, parentHeader);
        break;
      }
      case 'clear_output': {
        const bundle = msg.bundle ?? { wait: false };
        this.clearOutput(bundle, parentHeader);
        break;
      }
      case 'execute_result': {
        const bundle = msg.bundle ?? {
          execution_count: 0,
          data: {},
          metadata: {}
        };
        this.publishExecuteResult(bundle, parentHeader);
        break;
      }
      case 'execute_error': {
        const bundle = msg.bundle ?? { ename: '', evalue: '', traceback: [] };
        this.publishExecuteError(bundle, parentHeader);
        break;
      }
      case 'comm_msg':
      case 'comm_open':
      case 'comm_close': {
        this.handleComm(
          msg.type,
          msg.content,
          msg.metadata,
          msg.buffers,
          msg.parentHeader
        );
        break;
      }
    }
  }

  protected remoteKernel_AI: IRemoteAIWorkerKernel;

  private _worker_AI: Worker;
  private _ready_AI = new PromiseDelegate<void>();

  private publishMessage(
    msg: string,
    // _status: 'error' | 'ok' | 'abort',
    format: string //limited options later
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    this.publishExecuteResult({
      execution_count: this.executionCount,
      data: {
        [format]: msg
      },
      metadata: {}
    });

    return Promise.resolve({
      status: 'ok',
      execution_count: this.executionCount,
      user_expressions: {}
    });
  }

  async streamSync(ch: string, delay: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));

    await this.stream({ name: 'stdout', text: ch }, this.parentHeader);
  }

  async process_actions(cell_text: string): Promise<IActionResult> {
    // The stream test failed!

    // action_stream(cell_text: string): Promise < IActionResult > {
    if (cell_text.trim().toLowerCase().startsWith('/stream')) {
      const value = cell_text.trim().slice('/stream'.length);
      const delay = 5000;
      for (const ch of value) {
        await this.streamSync(ch, delay);
      }

      return Promise.resolve({
        outputResult: '<p>FYI: Stream is over.</p><p>',
        outputFormat: 'text/markdown',
        isProcessed: true
      });
    }

    //To process in chaned actions in turn, ususally non-AI actions

    for (let i = 0; i < globalCodeActions.length; i++) {
      const result = await globalCodeActions[i].execute(cell_text);
      if (result.isProcessed) {
        return result;
      }
    }

    return inChainedCodeAction.notProcessed();
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
        // 'ok',
        action_result.outputFormat
      );
    }

    const js_prefix = '%%js';

    if (cell_text.startsWith(js_prefix)) {
      const js_code = cell_text.slice(js_prefix.length);
      content.code = js_code;
      return super.executeRequest(content);
    } else {
      // // const result = await this.RemoteKernel_AI.execute(content, this.parent);
      // const result = await this.chatCompletion_sync(cell_text);
      // result.execution_count = this.executionCount;
      // return result;

      const result = await this.remoteKernel_AI.execute(content, this.parent);
      result.execution_count = this.executionCount;
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
