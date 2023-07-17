import { IAIWorkerKernel } from './tokens';
// import { extractPersonAndMessage } from './chatSyntax';

// import { backOff } from 'exponential-backoff';
// import { OpenAIDriver } from './driver_azure';
// // import { ChatMessage } from 'openai';
// import { ChatMessage } from '@azure/openai';

// import { promptTemplate } from './promptTemplate';
// import { MyConsole } from './controlMode';

export class AIRemoteKernel {
  /**
   * Initialize the remote kernel.
   *
   * @param options The options for the kernel.
   */
  async initialize(options: IAIWorkerKernel.IOptions) {
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

  /**
   * Execute code in the worker kernel.
   */
  async execute(content: any, parent: any) {
    // function publish_execute_result(result: string, executionCount: number) {
    //   const bundle = {
    //     data: {
    //       'text/plain': result
    //     },
    //     metadata: {},
    //     execution_count: executionCount
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

    // async function chatCompletion_sync(
    //   cell_text: string,
    //   executionCount: number
    // ) {
    //   const [actions, pureMessage] = extractPersonAndMessage(cell_text);

    //   MyConsole.debug('actions:', actions);
    //   MyConsole.debug('actions:', pureMessage);
    //   if (actions.length > 1) {
    //     return publish_execute_error(
    //       '@ 2 or more actions are not supported so far!',
    //       executionCount
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
    //       return publish_execute_error(errorMsg, executionCount);
    //     } else {
    //       if (pureMessage.trim().length === 0) {
    //         promptTemplate
    //           .get_global_templates()
    //           [theTemplateName].startNewSession();
    //         return publish_execute_result(
    //           'The chat history with ' +
    //             theTemplateName +
    //             ' has been cleared. Now you have a new session with it.',
    //           executionCount
    //         );
    //       }
    //     }
    //   }

    //   if (pureMessage.length * 2 > promptTemplate.MaxTokenLimit) {
    //     return publish_execute_error(
    //       'The maxinum of input should be half of ' +
    //         promptTemplate.MaxTokenLimit,
    //       executionCount
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
    //       return publish_execute_error(
    //         'The token Limit Reached error happened. You may wait for a few seconds and try again.',
    //         executionCount
    //       );
    //     } else if (error === 'contentFiltered') {
    //       return publish_execute_error(
    //         'The Content Filtered error happened in your input or the generated response. You may change your input and try again.',
    //         executionCount
    //       );
    //     }

    //     const md_iconURL = theTemplate.get_Markdown_iconURL();

    //     const md_displayName = theTemplate.get_Markdown_DisplayName();

    //     // debugger();
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

    //     return publish_execute_result(
    //       json_request +
    //         '</p><p>' +
    //         '<table><tbody><tr><td align="left"><p><b>' +
    //         md_displayName +
    //         '</b>' +
    //         md_iconURL +
    //         '</p></td>' +
    //         '<td align="left">' +
    //         response || '' + '</td>' + '</tr></tbody></table>' + timepassed,
    //       executionCount
    //     );
    //   } catch (error: any) {
    //     return publish_execute_error(
    //       '<p>**Error during getChatCompletions**:' +
    //         error.message +
    //         '</p><p>**Stack trace**:' +
    //         error.stack +
    //         '</p><p>' +
    //         // AIKernel.api_errors +
    //         '</p>',
    //       executionCount
    //     );
    //   }
    // }

    const { code } = content;
    try {
      // const result = await self.eval(code);

      const js_prefix = '%%js';

      let result;
      if (code.startsWith(js_prefix)) {
        const js_code = code.slice(js_prefix.length);
        // console.log('js_code', js_code);
        result = await self.eval(js_code);
      } else {
        // console.log('chat:', code);
        // result = await chatCompletion_sync(content, this._executionCount);
        result = code;
      }

      this._executionCount++;

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

  private _executionCount = 0;
}
