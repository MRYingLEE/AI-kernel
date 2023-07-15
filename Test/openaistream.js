import OpenAI from 'openai@4.0.0-beta.4';

// gets API Key from environment variable OPENAI_API_KEY
const client = new OpenAI({apiKey: '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'});

async function main() {
  // Streaming:
  const stream = await client.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
    {
      "role": "user",
      "content": "What is streaming in computer?"
    }
  ],
    stream: true,
  });
  for await (const part of stream) {
    process.stdout.write(part.choices[0].text);}
  process.stdout.write('\n');
}

main().catch(console.error);