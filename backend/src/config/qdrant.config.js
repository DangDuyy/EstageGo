import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "./environment";

export const COLLECTION_NAME = "rasa_knowledge_base";

export const qdrantClient = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY,
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "models/text-embedding-004",
  apiKey: env.GEMINI_API_KEY,
});