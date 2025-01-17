import { IAIWorkerKernel } from './common/tokens';
// import { extractPersonAndMessage } from './worker_AI/chatSyntax';

// import { backOff } from 'exponential-backoff';
// import { OpenAIDriver } from './worker_AI/driver_azure';
// // import { ChatMessage } from 'openai';
import { ChatRequestMessage } from '@azure/openai';

// import { promptTemplate } from './worker_AI/promptTemplate';
// import { MyConsole } from './worker_AI/controlMode_Worker';

// import {
//   globalCodeActions,
//   inChainedCodeAction,
//   IActionResult
// } from './worker_AI/codeActions';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

export class AIRemoteKernel {
  private _executionCount = 0;
  // private openai_client: OpenAIClient;

  // constructor() {
  // client setup
  // const endpoint = 'https://ailearn-live.openai.azure.com/';
  // const azureApiKey = '644f0583d9464db18a2539ee9683a111';

  // this.openai_client = new OpenAIClient(
  //   endpoint,
  //   azureApiKey
  //   // new AzureKeyCredential(azureApiKey)
  // );
  // }
  /**
   * Initialize the remote kernel.
   *
   * @param options The options for the kernel.
   */
  async initialize(options: IAIWorkerKernel.IOptions): Promise<void> {
    console.log = function (...args) {
      const bundle = {
        name: 'stdout',
        text: args.join(' ') + '\n'
      };
      postMessage({
        type: 'stream',
        bundle
      });
    };
    console.info = console.log;

    console.error = function (...args) {
      const bundle = {
        name: 'stderr',
        text: args.join(' ') + '\n'
      };
      postMessage({
        type: 'stream',
        bundle
      });
    };
    console.warn = console.error;

    self.onerror = function (message, source, lineno, colno, error) {
      console.error(message);
    };
    self.onmessageerror = function (e) {
      console.error('Message error: ', e);
    };
  }

  // async process_actions(cell_text: string): Promise<IActionResult> {
  //   // The stream test failed!

  //   // // action_stream(cell_text: string): Promise < IActionResult > {
  //   // if (cell_text.trim().toLowerCase().startsWith('/stream')) {
  //   //   const value = cell_text.trim().slice('/stream'.length);
  //   //   const delay = 5000;
  //   //   for (const ch of value) {
  //   //     await this.streamSync(ch, delay);
  //   //   }

  //   //   return Promise.resolve({
  //   //     outputResult: '<p>FYI: Stream is over.</p><p>',
  //   //     outputFormat: 'text/markdown',
  //   //     isProcessed: true
  //   //   });
  //   // }

  //   //To process in chaned actions in turn, ususally non-AI actions

  //   for (let i = 0; i < globalCodeActions.length; i++) {
  //     const result = await globalCodeActions[i].execute(cell_text);
  //     if (result.isProcessed) {
  //       return result;
  //     }
  //   }

  //   return inChainedCodeAction.notProcessed();
  // }

  // private publish_execute_result(result: string) {
  //   const bundle = {
  //     data: {
  //       'text/plain': result
  //     },
  //     metadata: {},
  //     execution_count: this._executionCount
  //   };

  //   postMessage({
  //     bundle,
  //     type: 'execute_result'
  //   });

  //   return {
  //     status: 'ok',
  //     user_expressions: {}
  //   };
  // }
  private stream_inline(...args: string[]): void {
    const bundle = {
      name: 'stdout',
      text: args.join(' ')
    };
    postMessage({
      type: 'stream',
      bundle
    });
  }

  async charbychar(char: string, delay: number): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          this.stream_inline(char);
          resolve(1);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }
  /**
   * Execute code in the worker kernel.
   */
  async execute(content: any, parent: any) {
    // function publish_execute_error(result: string, executionCount: number) {
    //   const bundle = {
    //     data: {
    //       'text/plain': result
    //     },
    //     metadata: {},
    //     execution_count: executionCount
    //   };

    //   postMessage({
    //     bundle,
    //     type: 'execute_error'
    //   });

    //   return {
    //     status: 'error',
    //     user_expressions: {}
    //   };
    // }

    // function publishMessage(
    //   msg: string,
    //   // _status: 'error' | 'ok' | 'abort',
    //   format: string //limited options later
    // ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    //   this.publishExecuteResult({
    //     execution_count: this.executionCount,
    //     data: {
    //       [format]: msg
    //     },
    //     metadata: {}
    //   });

    //   return Promise.resolve({
    //     status: 'ok',
    //     execution_count: this.executionCount,
    //     user_expressions: {}
    //   });
    // }

    // async function chatCompletion_sync(
    //   cell_text: string,
    //   executionCount: number
    // ) {
    //   return cell_text;

    //   // if (MyConsole.inDebug) {
    //   //   return cell_text;
    //   // }
    //   // const [actions, pureMessage] = extractPersonAndMessage(cell_text);

    //   // MyConsole.debug('actions:', actions);
    //   // MyConsole.debug('actions:', pureMessage);
    //   // if (actions.length > 1) {
    //   //   return publish_execute_error(
    //   //     '@ 2 or more actions are not supported so far!',
    //   //     executionCount
    //   //   ); // We support this feature in the long future.
    //   // } else if (actions.length === 1) {
    //   //   const theTemplateName = actions[0].substring(1);

    //   //   if (!promptTemplate.get_global_templates()[theTemplateName]) {
    //   //     let errorMsg =
    //   //       'The action ' +
    //   //       theTemplateName +
    //   //       ' is not defined! Please check. \n FYI: The current list is as the following:';

    //   //     for (const key in promptTemplate.get_global_templates()) {
    //   //       if (promptTemplate.get_global_templates()[key] === undefined) {
    //   //         continue;
    //   //       }
    //   //       errorMsg += '\n' + key;
    //   //     }
    //   //     return publish_execute_error(errorMsg, executionCount);
    //   //   } else {
    //   //     if (pureMessage.trim().length === 0) {
    //   //       promptTemplate
    //   //         .get_global_templates()
    //   //         [theTemplateName].startNewSession();
    //   //       return publish_execute_result(
    //   //         'The chat history with ' +
    //   //           theTemplateName +
    //   //           ' has been cleared. Now you have a new session with it.',
    //   //         executionCount
    //   //       );
    //   //     }
    //   //   }
    //   // }

    //   // if (pureMessage.length * 2 > promptTemplate.MaxTokenLimit) {
    //   //   return publish_execute_error(
    //   //     'The maxinum of input should be half of ' +
    //   //       promptTemplate.MaxTokenLimit,
    //   //     executionCount
    //   //   );
    //   // }

    //   // let theTemplateName = 'ai';
    //   // if (actions[0]) {
    //   //   theTemplateName = actions[0].substring(1);
    //   // }

    //   // let messages2send: ChatMessage[] = [];
    //   // let usrContent = '';
    //   // const statuses: { [key: string]: string } = { cell_text: pureMessage };

    //   // if (actions.length === 0) {
    //   //   //No actions are mentioned
    //   //   messages2send.push({ role: 'user', content: pureMessage });
    //   // } else {
    //   //   // The mentioned actions, which are critical to the following processing
    //   //   MyConsole.table(actions);
    //   //   const p = promptTemplate
    //   //     .get_global_templates()
    //   //     [theTemplateName].buildMessages2send(statuses);
    //   //   messages2send = messages2send.concat(p.messages2send);
    //   //   usrContent = p.usrContent;
    //   // }
    //   // if (messages2send.length === 0) {
    //   //   // if some exception happened, we may give some default but simple processing
    //   //   messages2send.push({ role: 'user', content: usrContent });
    //   // }
    //   // MyConsole.table(messages2send);

    //   // const startTime = performance.now();

    //   // try {
    //   //   let completion: any = null;
    //   //   if (MyConsole.inDebug) {
    //   //     completion = await OpenAIDriver.get_globalOpenAI().getChatCompletions(
    //   //       'gpt-35-turbo',
    //   //       messages2send
    //   //     );
    //   //   } else {
    //   //     //Todo: 1. To add delay at the 1st fail.
    //   //     //Todo: 2. extend the delay when the code is too old
    //   //     //Todo: 3. log the retry times
    //   //     //Todo: 4. extend delay after too much consumption
    //   //     completion = await backOff(() =>
    //   //       OpenAIDriver.get_globalOpenAI().getChatCompletions(
    //   //         'gpt-35-turbo',
    //   //         messages2send
    //   //       )
    //   //     );
    //   //   }

    //   //   MyConsole.table('completion.choices', completion.choices);

    //   //   const response = completion.choices[0].message?.content ?? '';
    //   //   //Todo: We should check the response carefully

    //   //   let theTemplate = promptTemplate.get_global_templates()['ai'];

    //   //   if (promptTemplate.get_global_templates()[theTemplateName]) {
    //   //     theTemplate = promptTemplate.get_global_templates()[theTemplateName];
    //   //   }
    //   //   //To add the prompt message here
    //   //   theTemplate.addMessage(
    //   //     'user',
    //   //     usrContent,
    //   //     '',
    //   //     completion.usage?.prompt_tokens || 0
    //   //   );
    //   //   //To add the completion message here
    //   //   theTemplate.addMessage(
    //   //     'assistant',
    //   //     response || '',
    //   //     '',
    //   //     completion.usage?.completion_tokens || 0
    //   //   );
    //   //   if (theTemplate.withMemory) {
    //   //     theTemplate.newSession = false;
    //   //   }

    //   //   // To process error in completion
    //   //   const error = completion.choices[0].finishReason;

    //   //   if (error === 'tokenLimitReached') {
    //   //     return publish_execute_error(
    //   //       'The token Limit Reached error happened. You may wait for a few seconds and try again.',
    //   //       executionCount
    //   //     );
    //   //   } else if (error === 'contentFiltered') {
    //   //     return publish_execute_error(
    //   //       'The Content Filtered error happened in your input or the generated response. You may change your input and try again.',
    //   //       executionCount
    //   //     );
    //   //   }

    //   //   const md_iconURL = theTemplate.get_Markdown_iconURL();

    //   //   const md_displayName = theTemplate.get_Markdown_DisplayName();

    //   //   // debugger();
    //   //   let json_request = '';

    //   //   if (MyConsole.inDebug) {
    //   //     json_request =
    //   //       '**Prompt in JSON:**</p><p>' +
    //   //       '```json\n' +
    //   //       JSON.stringify(messages2send, null, 2) +
    //   //       '\n```';
    //   //   }

    //   //   const endTime = performance.now();
    //   //   const executionTime = endTime - startTime;

    //   //   let timepassed = '';
    //   //   if (MyConsole.inDebug) {
    //   //     timepassed = '\n(Execution time: ' + executionTime + ' milliseconds)';
    //   //   }

    //   //   return publish_execute_result(
    //   //     json_request +
    //   //       '</p><p>' +
    //   //       '<table><tbody><tr><td align="left"><p><b>' +
    //   //       md_displayName +
    //   //       '</b>' +
    //   //       md_iconURL +
    //   //       '</p></td>' +
    //   //       '<td align="left">' +
    //   //       response || '' + '</td>' + '</tr></tbody></table>' + timepassed,
    //   //     executionCount
    //   //   );
    //   // } catch (error: any) {
    //   //   return publish_execute_error(
    //   //     '<p>**Error during getChatCompletions**:' +
    //   //       error.message +
    //   //       '</p><p>**Stack trace**:' +
    //   //       error.stack +
    //   //       '</p><p>' +
    //   //       // AIKernel.api_errors +
    //   //       '</p>',
    //   //     executionCount
    //   //   );
    //   // }
    // }

    const { code } = content;

    this._executionCount++;

    try {
      // const result = await self.eval(code);

      const js_prefix = '%%js';

      let result;
      if (code.startsWith(js_prefix)) {
        const js_code = code.slice(js_prefix.length);
        // MyConsole.log('js_code', js_code);
        result = await self.eval(js_code);
      } else {
        // MyConsole.log('chat:', code);
        const cell_text = content.code;

        const delay = 1000; // Delay in milliseconds between each character

        for (const char of cell_text) {
          try {
            await this.charbychar(char, delay);
          } catch (error) {
            console.error(error);
          }
        }

        // const deploymentId = 'gpt-35-turbo';
        // let response = '';
        // let tokens = 0;
        // let last_finishReason = '';
        // const messages = [{ role: 'user', content: cell_text }];
        // const events = await this.openai_client.listChatCompletions(
        //   deploymentId,
        //   messages
        // );

        // try {
        //   for await (const event of events) {
        //     for (const choice of event.choices) {
        //       //process.stdout.write(choice.delta.content);
        //       tokens += 1;
        //       if (choice?.delta?.content || '') {
        //         response += choice?.delta?.content || '';
        //       } else {
        //         console.log('The current token:', tokens, ' choice:', choice);
        //       }

        //       last_finishReason = choice.finishReason || '';
        //     }
        //   }
        //   console.log(
        //     'The whole tokens is:',
        //     tokens,
        //     '. The whole response is :'
        //   );
        //   console.log(last_finishReason);
        //   console.log(response);
        //   //process.stdout.write('\n');
        // } catch (error) {
        //   console.error(error);
        // }

        // Copyright (c) Microsoft Corporation.
        // Licensed under the MIT License.

        /**
         * Demonstrates how to list chat completions for a chat context.
         *
         * @summary list chat completions.
         */

        // You will need to set these environment variables or edit the following values
        const endpoint = 'https://ailearn-live.openai.azure.com/';
        const azureApiKey = '644f0583d9464db18a2539ee9683a111';

        const messages: ChatRequestMessage[] = [
          {
            name: '',
            role: 'system',
            content: 'You are a helpful assistant. You will talk like a pirate.'
          },
          { name: '', role: 'user', content: 'Can you help me?' },
          {
            name: '',
            role: 'assistant',
            content: 'Arrrr! Of course, me hearty! What can I do for ye?'
          },
          {
            name: '',
            role: 'user',
            content: "What's the best way to train a parrot?"
          }
        ];

        console.log('== Streaming Chat Completions Sample ==');

        try {
          const client = new OpenAIClient(
            endpoint,
            new AzureKeyCredential(azureApiKey)
          );
          const deploymentId = 'gpt-35-turbo';
          const events = await client.listChatCompletions(
            deploymentId,
            messages,
            { maxTokens: 128 }
          );

          for await (const event of events) {
            for (const choice of event.choices) {
              //console.log(choice.delta?.content);
              this.stream_inline(choice.delta?.content || '');
            }
          }
        } catch (err) {
          console.error('The sample encountered an error:', err);
        }
        result = 'Done.';
        // const action_result = await this.process_actions(cell_text);

        // if (!action_result.isProcessed) {
        //   // const result = await this.remoteKernel.execute(content, this.parent);
        //   // result = await chatCompletion_sync(content, this._executionCount);
        //   result = cell_text;
        //   if (!(typeof result === 'string')) {
        //     return result;
        //   }
        // } else {
        //   return this.publish_execute_result(action_result.outputResult);
        //   // 'ok',
        //   // action_result.outputFormat
        //   // );
        // }

        // result = code;
      }

      // return this.publish_execute_result(result);
      const bundle = {
        data: {
          'text/plain': result
        },
        metadata: {},
        execution_count: this._executionCount
      };
      postMessage({
        bundle,
        type: 'execute_result'
      });

      return {
        status: 'ok',
        user_expressions: {}
      };
    } catch (e) {
      const { name, stack, message } = e as any as Error;
      const bundle = {
        ename: name,
        evalue: message,
        traceback: [`${stack}`]
      };

      postMessage({
        bundle,
        type: 'execute_error'
      });

      return {
        status: 'error',
        ename: name,
        evalue: message,
        traceback: [`${stack}`]
      };
    }
  }

  /**
   * Handle the complete message
   */
  async complete(content: any, parent: any) {
    // naive completion on window names only
    // TODO: improve and move logic to the iframe
    const vars = Object.getOwnPropertyNames(self);
    const { code, cursor_pos } = content;
    const words = code.slice(0, cursor_pos).match(/(\w+)$/) ?? [];
    const word = words[0] ?? '';
    const matches = vars.filter(v => v.startsWith(word));

    return {
      matches,
      cursor_start: cursor_pos - word.length,
      cursor_end: cursor_pos,
      metadata: {},
      status: 'ok'
    };
  }
}
