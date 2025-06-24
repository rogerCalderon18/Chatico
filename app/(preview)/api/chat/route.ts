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
      If the user presents information about themselves, use the addResource tool to store it.
      If the user asks for a 'bomba', 'bomba guanacasteca', or similar requests, use the reciteBomba tool to search for bombas in the knowledge base.
      If a response requires multiple tools, call one tool after another without responding to the user.
      If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
      if no relevant information is found in the tool calls, respond, "Sorry, I don't know."
      Be sure to adhere to any instructions in tool calls ie. if they say to respond like "...", do exactly that.
      If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
      Keep responses short and concise. Answer in a single sentence where possible.
      If you are unsure, use the getInformation tool and you can use common sense to reason based on the information you do have.
      Use your abilities as a reasoning machine to answer questions based on the information you do have.
      When the reciteBomba tool is used, return exactly what the tool returns without modification.
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
              prompt: `Analyze this query: "${query}". Provide the following:\n3 similar questions that could help answer the user's query`,
            });
            console.log("Resultado understandQuery:", object.questions);
            return object.questions;
          },
        }),
        reciteBomba: tool({
          description: `recite a bomba guanacasteca when the user asks for one. Search the knowledge base for bombas first.`,
          parameters: z.object({
            requestType: z.string().describe("type of bomba request"),
          }),
          execute: async ({ requestType }) => {
            console.log("🎵 BOMBA REQUESTED - Starting execution...");
            
            try {
              // Buscar bombas específicas en la base de conocimientos con más variedad
              const bombaQueries = [
                "bomba guanacasteca",
                "bomba sabanero", 
                "bomba tradicional",
                "bomba costarricense",
                "bomba limonense",
                "bomba gavilán",
                "bomba cocina",
                "bomba negro",
                "bomba morenita",
                "bomba cartago",
                "bomba puntarenas"
              ];
              
              const allResults = await Promise.all(
                bombaQueries.map(query => findRelevantContent(query))
              );
              const bombaResults = allResults.flat();
              
              console.log("Bombas encontradas:", bombaResults);
              
              // Filtrar mejor los resultados para encontrar bombas reales
              const realBombas = bombaResults.filter(item => {
                if (!item?.name) return false;
                
                const content = item.name.toLowerCase();
                
                // Detectar el formato exacto de tus bombas: "Bomba X: "¡Bomba! [contenido] uyuyuy [palabra]""
                const isBombaFormat = 
                  content.match(/bomba\s+\d+:\s*["']¡bomba!/i) ||  // Formato exacto "Bomba X: "¡Bomba!"
                  (content.includes('bomba') && content.includes('uyuyuy') && content.length < 400);
                
                // Excluir definiciones o información sobre bombas
                const isNotBomba = 
                  content.includes('elementos clave') ||
                  content.includes('son poemas breves') ||
                  content.includes('entonación de bombas') ||
                  content.includes('típico grito') ||
                  content.includes('güipipía') ||
                  content.includes('manifestaciones culturales') ||
                  content.includes('tradición folclórica') ||
                  content.includes('cerámica') ||
                  content.includes('olla de carne') ||
                  content.includes('casona') ||
                  content.includes('marimbero') ||
                  content.includes('puentes suspendidos') ||
                  content.length > 500;
                
                return isBombaFormat && !isNotBomba;
              });
              
              // Remover duplicados basándose en el número de bomba
              const uniqueBombas = [];
              const seenNumbers = new Set();
              
              for (const bomba of realBombas) {
                // Extraer el número de la bomba
                const bombaNumber = bomba.name.match(/bomba\s+(\d+):/i);
                const number = bombaNumber ? bombaNumber[1] : bomba.name.substring(0, 30);
                
                // Solo agregar si no hemos visto este número de bomba
                if (!seenNumbers.has(number)) {
                  seenNumbers.add(number);
                  uniqueBombas.push(bomba);
                }
              }
              
              console.log("Bombas reales filtradas:", uniqueBombas);
              
              let result;
              if (uniqueBombas.length > 0) {
                // Seleccionar una bomba aleatoria de las reales
                const randomBomba = uniqueBombas[Math.floor(Math.random() * uniqueBombas.length)];
                console.log("Bomba seleccionada:", randomBomba.name);
                
                // Limpiar el texto de la bomba según tu formato específico
                let bombaText = randomBomba.name;
                
                // Extraer contenido del formato: Bomba X: "¡Bomba! [contenido] uyuyuy [palabra]"
                const bombaMatch = bombaText.match(/bomba\s+\d+:\s*["']¡bomba!\s*(.*?)\s*uyuyuy\s+\w+["']?$/i);
                if (bombaMatch) {
                  bombaText = bombaMatch[1].trim();
                } else {
                  // Fallback: quitar "Bomba X:" y comillas
                  bombaText = bombaText
                    .replace(/bomba\s+\d+:\s*/i, '')
                    .replace(/^["']|["']$/g, '')
                    .replace(/¡bomba!\s*/i, '')
                    .replace(/\s*uyuyuy\s+\w+.*$/i, '')
                    .trim();
                }
                
                result = `🎵 **Bomba Guanacasteca** 🎶\n\n¡Bomba! ${bombaText}, ¡uyuyuy!\n\n*Bomba tradicional de Costa Rica*`;
              } else {
                // Si no hay bombas reales, usar una por defecto
                console.log("No se encontraron bombas reales, usando bomba por defecto");
                const defaultBomba = "Esta bomba viene de Guanacaste, tierra de sol y tradición, donde el sabanero canta, con mucha inspiración!";
                result = `🎵 **Bomba Guanacasteca** 🎶\n\n${defaultBomba}\n\n*Bomba tradicional de Costa Rica*`;
              }
              
              console.log("✅ BOMBA TOOL FINISHED - Returning result");
              return result;
              
            } catch (error) {
              console.error("❌ Error en reciteBomba:", error);
              return "🎵 **Bomba Guanacasteca** 🎶\n\nEsta bomba viene de Guanacaste, tierra de sol y tradición, donde el sabanero canta, con mucha inspiración!\n\n*Bomba tradicional de Costa Rica*";
            }
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
