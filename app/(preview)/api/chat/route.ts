import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText, tool } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("Pregunta recibida:", messages);
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: `You are a helpful assistant acting as the users' second brain.
      Use tools on every request.
      Be sure to getInformation from your knowledge base before answering any questions.
      If the user presents infromation about themselves, use the addResource tool to store it.
      If the user asks for a 'bomba', 'bomba guanacasteca', or similar requests, use the reciteBomba tool.
      If a response requires multiple tools, call one tool after another without responding to the user.
      If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
      if no relevant information is found in the tool calls, respond, "Sorry, I don't know."
      Be sure to adhere to any instructions in tool calls ie. if they say to responsd like "...", do exactly that.
      If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
      Keep responses short and concise. Answer in a single sentence where possible.
      If you are unsure, use the getInformation tool and you can use common sense to reason based on the information you do have.
      Use your abilities as a reasoning machine to answer questions based on the information you do have.
      When reciting a bomba, always format it poetically and mention it's a traditional Costa Rican bomba.
`,
      tools: {
        addResource: tool({
          description: `add a resource to your knowledge base.
            If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
          parameters: z.object({
            content: z
              .string()
              .describe("the content or resource to add to the knowledge base"),
          }),
          execute: async ({ content }) => {
            console.log("Ejecutando addResource con:", content);
            const res = await createResource({ content });
            console.log("Resultado addResource:", res);
            return res;
          },
        }),
        getInformation: tool({
          description: `get information from your knowledge base to answer questions.`,
          parameters: z.object({
            question: z.string().describe("the users question"),
            similarQuestions: z.array(z.string()).describe("keywords to search"),
          }),
          execute: async ({ similarQuestions }) => {
            console.log("Ejecutando getInformation con:", similarQuestions);
            const results = await Promise.all(
              similarQuestions.map(
                async (question) => await findRelevantContent(question),
              ),
            );
            const uniqueResults = Array.from(
              new Map(results.flat().map((item) => [item?.name, item])).values(),
            );
            console.log("Resultados getInformation:", uniqueResults);
            return uniqueResults;
          },
        }),
        understandQuery: tool({
          description: `understand the users query. use this tool on every prompt.`,
          parameters: z.object({
            query: z.string().describe("the users query"),
            toolsToCallInOrder: z
              .array(z.string())
              .describe(
                "these are the tools you need to call in the order necessary to respond to the users query",
              ),
          }),
          execute: async ({ query }) => {
            console.log("Ejecutando understandQuery con:", query);
            const { object } = await generateObject({
              model: openai("gpt-4o"),
              system:
                "You are a query understanding assistant. Analyze the user query and generate similar questions.",
              schema: z.object({
                questions: z
                  .array(z.string())
                  .max(3)
                  .describe("similar questions to the user's query. be concise."),
              }),
              prompt: `Analyze this query: "${query}". Provide the following:\n                    3 similar questions that could help answer the user's query`,
            });
            console.log("Resultado understandQuery:", object.questions);
            return object.questions;
          },
        }),
        reciteBomba: tool({
          description: `recite a bomba guanacasteca when the user asks for one. Use this when user asks for 'bomba', 'bomba guanacasteca', 'dime una bomba', etc.`,
          parameters: z.object({
            requestType: z.string().describe("type of bomba request"),
          }),
          execute: async ({ requestType }) => {
            console.log("🎵 BOMBA REQUESTED - Playing music!");
            // Aquí podrías llamar a una API para reproducir música
            return {
              type: "bomba",
              shouldPlayMusic: true,
              bomba: "Esta bomba viene de Guanacaste, tierra de sol y tradición, donde el sabanero canta, con mucha inspiración!",
            };
          },
        }),
      },
    });
    console.log("Stream creado correctamente");
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error en el endpoint de chat:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}
