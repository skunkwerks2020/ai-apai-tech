// const http = require('http');
const cors = require('cors');
const dotenv = require("dotenv");
const express = require('express');
const bodyParser = require('body-parser');
const {ChatOpenAI} = require ("langchain/chat_models/openai");

const {ConversationChain} = require ("langchain/chains")
const {  ChatPromptTemplate,
      HumanMessagePromptTemplate,
        SystemMessagePromptTemplate,
        MessagesPlaceholder} = require ("langchain/prompts");
const {BufferMemory} = require ("langchain/memory");

const app = express();


const HOSTNAME = process.env.HOSTNAME || '127.0.0.1';
const PORT = process.env.PORT || 5101;

// setup & config
dotenv.config();
var corsOptions = {
    origin: "http://"+HOSTNAME+":"+PORT,
  };

app.use(cors(corsOptions));

 // parse requests of content-type - application/json
 app.use(bodyParser.json());

 // parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT3 = "gpt-3.5-turbo";
const GPT4 = "gpt-4";

console.log("## Initialize LangChainBot Bots.... ")

const chat = new ChatOpenAI({
    modelName: GPT4,
    temperature: 0.7
});
console.log(" -> langChatBot Bot [ " + chat.modelName + " ] done.")

const chat2 = new ChatOpenAI({
    modelName: GPT3,
    temperature: 0.7
});
console.log(" -> langChatBot Bot [ " + chat2.modelName + " ] done.")


// init chatPrompt config
console.log("### GPT4-BotBot - Setting up chatPromptTemplate, MessagePlaceHolder, HumanMessagePromptTemplate, ConversationChain ### ... Done");

// You can change these prompts
// These are System prompts for bots

const systemChatPrompt_Bot1 = "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.";
const systemChatPrompt_Bot2 = "You are the best Translation Service on this planet. Act like it.";


// Try not to mess too much with Chat Prompts
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      systemChatPrompt_Bot1
    ),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);

  // define chains
  const chain = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
    prompt: chatPrompt,
    llm: chat,
  });

  console.log("### GPT3-BotBot - Setting up chatPromptTemplate, MessagePlaceHolder, HumanMessagePromptTemplate, ConversationChain ### ... Done");

  const chatPrompt2 = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      systemChatPrompt_Bot2
    ),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);

  const chain2 = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
    prompt: chatPrompt2,
    llm: chat2,
  });

  // ==== END Config & Setup =========================

  // ===== METHODS START HERE ========================

// GET /  ============================================
// Example: http://localhost:5101
// Example Result: > Hello LangChain server on port:5101
const instructions = "<br/> > Commands Available:<br/> > /botChat ==> Example: http://localhost:5101/botChat<br/> > /botHumanChat ==> Example: http://localhost:5101/botHumanChat?usertext=Apples";
app.get('/', (req, res) => {
  res.send('> Hello LangChain server on port:' + PORT + "<br/>" + instructions);
});

// GET /botChat ======================================
// Example: http://localhost:5101/botChat
// Example Result: Your name is Cosmos. The French phrase "J'aime programmer" translates to "I like programming" in English.
app.get('/botChat', async (req, res) => {

        // ########## THE CHAT starts here ##############
        console.log("==> Called BotChat - start")
        let od1 = Date.now();
        const response1 = await chain.call({input: "hi! I am Cosmos."});

        console.log("GPT4 answered --> 1st question - od1 langchain returned in : " + (Date.now()-od1)/1000);
        console.log("GPT4 - od1 response1 = \n\t>> " + response1.response);

        let od2 = Date.now();
        const response2 = await chain2.call({input: "Translate this sentence from English to French. I love programming."});

        console.log("GPT3 answered---> od2 langchain returned in : " + (Date.now()-od2)/1000);
        console.log("GPT3 - od2 response1 \n\t>> " + response2.response);
        // console.log(response2.response);

        let od3 = Date.now();
        const response3 = await chain.call({ input: "What's my name? Also can you translate this from French to English: " + response2.response});

        console.log("GPT4 answered again --> od3 langchain returned in : " + (Date.now()-od3)/1000);
        console.log("GPT4 response2 = \n\t>> " + response3.response);

        let deltaDate = Date.now() - od1;
        console.log("ending call... " + deltaDate/1000);
        console.log("Called botChat... ending\n================\n" );

  res.send(response3.response);
});//end GET -> /botChat ========================

// GET http://localhost:5101/botHumanChat?usertext=<user-text>
// Example: http://localhost:5101/botHumanChat?usertext=Apples
// Or use PostMan or Rested (for MacOS) to type longer text with spaces...
app.get('/botHumanChat', async (req, res) => {
  const userText = req.query.usertext;
  // ########## THE CHAT starts here ##############
  const response1 = await chain.call({input: userText});
  // const response2 = await chain3.call({input: "Translate this sentence from English to French. I love programming."});
  // const response3 = await chain.call({input: "Translate this from French to English " + response2.response});
  console.log("botHumanChat: " + response1.response)
  const message = "You called this server with usertext+ " + userText + " and response = " + response1.response;
  res.send(message);
});//end GET-> /botHumanChat =====================


// Start the server ================================
app.listen(PORT, () => {
  console.log(`LangChain Chatbot Server running on port ${PORT}`);
});
// =================================================
