/* A class AI Kernel is to manager the output and input of chats with ChatGPT. 
Every output chat message (prompt) has a template, which could have parameters.
A chat message, output or input, is identified by its name (ID).

The class has the following attributes:
globalHistory: chat history with time stamp

streamHistory: streaming chat history with time stamp. When a streamed messages are finished successfully, 
    it will be added to the globalHistory.
method retry: to resend the last message of the same chat template.
method newCaht: to start a new chat template without history.

*/

// AI Kernel is also a typical Jupyter Kernel with a few AI service provider behind.



