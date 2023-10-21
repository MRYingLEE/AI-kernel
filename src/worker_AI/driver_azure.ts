import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

class OpenAIDriver {
  /*
  We try to init OpenAIApi at the beginning
  */
  static globalOpenAI: OpenAIClient;
  // constructor(apiKey = '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') {
  //   OpenAIDriver.refreshAPIKey(apiKey); // A bug! It is not called.
  // }
  static initialized = false;

  static get_globalOpenAI(): OpenAIClient {
    if (!OpenAIDriver.initialized) {
      OpenAIDriver.refreshAPIKey('554105e9140c448ea4f9eef13b3131f2');
      OpenAIDriver.initialized = true;
    }

    return this.globalOpenAI;
  }

  static refreshAPIKey(apiKey: string): boolean {
    const configuration = new AzureKeyCredential(apiKey);
    // delete configuration.baseOptions.headers['User-Agent'];
    // To make api can be used in browser instead of a server
    const endpoint = 'https://ailearn-live.openai.azure.com/';
    OpenAIDriver.globalOpenAI = new OpenAIClient(endpoint, configuration);
    // Later, we may valid the apiKey
    return true;
  }
}

export { OpenAIDriver };
