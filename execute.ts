import { ChatOpenAI } from "@langchain/openai";
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { DATASET_LIMIT, TRAINING_DATA_SET } from "./constants";
import {
    SystemMessage,
    AIMessage,
    HumanMessage,
    MessageContent,
  } from "@langchain/core/messages";
import { basePrompt } from "./constants/prompts";

interface GraphState {
    url: string;
}

const graphState = {
    url: null,
    postContent: null,
  };
  
const graph = new StateGraph<GraphState>({ channels: graphState })
    .addNode("few_shot_learning", execute)
    .addEdge(START, "few_shot_learning")
    .addEdge("few_shot_learning", END);

const app = graph.compile({
    checkpointer: new MemorySaver(),
});

async function execute(args: GraphState) {
    const messages = [];
    let totalDataSetUsed = 0;

    const systemInstruction = new SystemMessage({
        content: basePrompt()
    });
    messages.push(systemInstruction);

    for(const doc of TRAINING_DATA_SET.URLS) {
        if(totalDataSetUsed >= DATASET_LIMIT) {
            console.log('Data set limit reached');
            break;
        }

        const urlContent = await loadUrlAndExtractURLContent(doc);
        messages.push(new HumanMessage({
            content: urlContent,
        }));

        console.log("Article content pulled ====================== \n\n")

        totalDataSetUsed++;
    }

    // Load source article content from the URL

    const sourceURLContent = await loadUrlAndExtractURLContent(args.url);
    console.log({ sourceURLContent})
    messages.push(new HumanMessage({
        content: sourceURLContent,
    }));

    const model = await initModel();

    const response = await model.invoke(messages);

    return { content: response.content };
}

async function loadUrlAndExtractURLContent(url: string) {
    const docs = await new CheerioWebBaseLoader(url).load();

    return docs.map(doc => doc.pageContent).join('\n\n');
}

async function initModel() {
    const model = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o',
        temperature: 0
    });

    return model;
}

const init = async (inputUrl: string) => {
    const graphResponse: { content: string } = await app.invoke({ url: inputUrl }, { configurable: {
        thread_id: '1'
    }});

    return graphResponse;
}       

export {
    init, app
}
