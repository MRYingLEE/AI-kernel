export function extractPersonAndMessage(
  chatMessage: string
): [string[], string] {
  // Regular expression to match '@' followed by alphabets (ignoring '@' in quoted subtext)
  const personRegex = /(^|\s)@[\w]+/g;

  // Extract persons from the chat message
  const persons = chatMessage.match(personRegex) || [];

  // Remove persons from the chat message to get the core message
  const coreMessage = chatMessage.replace(personRegex, '').trim();

  return [persons, coreMessage];
}

//   console.log(extractPersonAndMessage("@Jack @Tom Please give me suggestions"));
//   // Output: ["@Jack","@Tom"], "Please give me suggestions"

//   console.log(extractPersonAndMessage("@Jack Please give me suggestions @Tom "));
//   // Output: ["@Jack","@ Tom"], "Please give me suggestions"

//   console.log(extractPersonAndMessage("@Jack @Tom Please give me suggestions"));
//   // Output: ["@Jack","@ Tom"], "Please give me suggestions"

//   console.log(extractPersonAndMessage("@Jack @Tom Please use ‘@Linda’ to create a sentence"));
//   // Output: ["@Jack","@ Tom"], "Please use ‘@Linda’ to create a sentence"
