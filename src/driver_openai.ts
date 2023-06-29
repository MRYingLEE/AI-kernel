// import { Exception } from 'handlebars';
import { Configuration, OpenAIApi } from 'openai';

class OpenAIDriver {
  /*
  We try to init OpenAIApi at the beginning
  */
  static globalOpenAI: OpenAIApi;
  constructor(apiKey = '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') {
    OpenAIDriver.refreshAPIKey(apiKey);
  }
  static refreshAPIKey(apiKey: string): boolean {
    const configuration = new Configuration({
      apiKey: apiKey
    });
    delete configuration.baseOptions.headers['User-Agent'];
    // To make api can be used in browser instead of a server
    OpenAIDriver.globalOpenAI = new OpenAIApi(configuration);
    // Later, we may valid the apiKey
    return true;
  }
}

export { OpenAIDriver };
