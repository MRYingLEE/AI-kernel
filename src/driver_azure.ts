import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
// import { AutoRefreshTokenCredential } from '@azure/core-auth';
// import { InteractiveBrowserCredential } from '@azure/identity';

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
      OpenAIDriver.refreshAPIKey('b2fa870d377b4b528b508e584' + '4bd105a');
      OpenAIDriver.initialized = true;
    }

    return this.globalOpenAI;
  }

  static refreshAPIKey(apiKey: string): boolean {
    const configuration = new AzureKeyCredential(apiKey);
    // delete configuration.baseOptions.headers['User-Agent'];
    // To make api can be used in browser instead of a server
    const endpoint = 'https://ailearnlive.openai.azure.com/';
    OpenAIDriver.globalOpenAI = new OpenAIClient(endpoint, configuration);
    // Later, we may valid the apiKey
    return true;
  }

  // static refreshToken(credential: InteractiveBrowserCredential): boolean {
  //   // const api_type = 'azure_ad';
  //   // const api_key = token.token;
  //   // const scope = 'https://cognitiveservices.azure.com/.default';
  //   const endpoint = 'https://ailearnlive.openai.azure.com/';
  //   // const api_version = "2023-05-15"

  //   // const configuration = new TokenCredential(token);
  //   OpenAIDriver.globalOpenAI = new OpenAIClient(endpoint, credential);
  //   return true;
  // }
}

export { OpenAIDriver };
