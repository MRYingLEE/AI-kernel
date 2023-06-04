/*
The following prompt didn't generate perfect solution.
Later we my imporve the generated code.

Please create a Typescript function to extract person name and  core message from a typical Whatsapp chat message.
1. The "@" is the symbol of a person, the following alphabets numbers are the name of a person.
2. The "@" in a quoted subtext will be ignored.
3. Please use regular expression

For example,
Input:“@Jack @2Tom Please give me suggestions"
Output: ["@Jack","@2Tom"], "Please give me suggestions"

Input:“@Jack Please give me suggestions @2Tom "
Output: ["@Jack","@2Tom"], "Please give me suggestions"

Input:“@Jack @2Tom Please give me suggestions"
Output: ["@Jack","@2Tom"], "Please give me suggestions"

Input:“"@Jack @2Tom Don't say ‘I like @Linda’ ""
Output: ["@Jack","@2Tom"], "Don't say ‘I like @Linda’"
*/

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
