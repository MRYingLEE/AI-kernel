//const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
import { OpenAIClient, AzureKeyCredential } from '@azure/openai'

// client setup 
const endpoint = "https://ailearn-live.openai.azure.com/";
const azureApiKey = "644f0583d9464db18a2539ee9683a111";

const messages = [
  { role: "user", content: "Do you know YAML?" },
];

const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
const deploymentId = "gpt-35-turbo";
let response = '';
let tokens = 0;
let last_finishReason = '';
async function getChatCompletions() {
  const events = await client.listChatCompletions(deploymentId, messages);

  try {
    for await (const event of events) {
      for (const choice of event.choices) {
        //process.stdout.write(choice.delta.content);
        tokens += 1;
        if (choice.delta.content) {
          response += choice.delta.content;
        } else {
          console.log('The current token:', tokens, ' choice:', choice);
        }

        last_finishReason = choice.finishReason;
      }
    }
    console.log('The whole tokens is:', tokens, '. The whole response is :');
    console.log(last_finishedReason);
    console.log(response);
    //process.stdout.write('\n');
  } catch (error) {
    console.error(error);
  }
}

getChatCompletions();