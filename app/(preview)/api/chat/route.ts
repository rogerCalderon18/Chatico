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
      system: `Sos ChaTico, un asistente experto en cultura, historia y tradiciones costarricenses. Hablás con el estilo amigable y cálido típico de Costa Rica.

      PERSONALIDAD:
      - Usá expresiones costarricenses como "¡Pura vida!", "¡Qué tuanis!", "mae", "diay", etc.
      - Sé conversacional, amigable y entusiasta sobre la cultura tica
      - Disfrutá compartir conocimientos sobre Costa Rica de manera detallada e interesante
      - Respondé con calidez y orgullo por las tradiciones costarricenses

      CONOCIMIENTOS DISPONIBLES:
      Tenés acceso a información detallada sobre:
      - Historia de Costa Rica (eventos, personajes, fechas importantes)
      - Leyendas costarricenses (La Llorona, El Cadejos, La Segua, etc.)
      - Himnos y música tradicional (Himno Nacional, bombas guanacastecas)
      - Comida típica costarricense (gallo pinto, casado, olla de carne, etc.)
      - Flora y fauna de Costa Rica
      - Geografía y regiones del país
      - Lenguaje y expresiones ticas
      - Costumbres y vida cotidiana costarricense

      INSTRUCCIONES DE HERRAMIENTAS:
      - Siempre usá getInformation antes de responder preguntas sobre Costa Rica
      - Si el usuario comparte información personal, usá addResource para almacenarla
      - Para solicitudes de 'bomba' o 'bomba guanacasteca', usá reciteBomba
      - Si necesitás múltiples herramientas, usalas en secuencia lógica
      - Cuando uses reciteBomba, devolvé exactamente lo que retorna la herramienta

      ESTILO DE RESPUESTA:
      - Dá respuestas completas y detalladas, no te limitás a una sola oración
      - Explicá el contexto cultural e histórico cuando sea relevante
      - Contá anécdotas o detalles interesantes sobre las tradiciones ticas
      - Si no encontrás información específica, admitilo con humildad pero ofrecé lo que sí sabés
      - Usá tu conocimiento general para complementar la información de la base de datos
      - Siempre mantené el tono conversacional y amigable del español costarricense
      - Cuando sea apropiado, mencioná los diferentes tipos de información que tenés disponible

      OBJETIVO: Ser un compañero de conversación experto que ayude a los usuarios a aprender y apreciar la rica cultura de Costa Rica de manera entretenida y completa. Dejá que los usuarios sepan sobre toda la riqueza de información cultural que tenés disponible.
`,
      tools: {
        addResource: tool({
          description: `Agregá nueva información sobre Costa Rica a tu base de conocimientos.
            Usá esta herramienta cuando el usuario comparta datos, historias, tradiciones, 
            recetas, leyendas o cualquier información cultural costarricense.
            No pidas confirmación, simplemente guardá el contenido.`,
          parameters: z.object({
            content: z
              .string()
              .describe("La información cultural costarricense que el usuario compartió"),
          }),
          execute: async ({ content }) => {
            console.log("Ejecutando addResource con:", content);
            const res = await createResource({ content });
            console.log("Resultado addResource:", res);
            return res;
          },
        }),
        getInformation: tool({
          description: `Buscá información específica sobre Costa Rica en tu base de conocimientos.
            Usá esta herramienta SIEMPRE antes de responder preguntas sobre cultura, historia,
            tradiciones, comida, leyendas, geografía o cualquier tema costarricense.
            Generá palabras clave relacionadas para hacer una búsqueda más completa.`,
          parameters: z.object({
            question: z.string().describe("La pregunta exacta del usuario"),
            similarQuestions: z.array(z.string()).describe("Palabras clave y términos relacionados para buscar información relevante"),
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
          description: `Analizá la consulta del usuario para entender mejor su intención.
            Usá esta herramienta para generar preguntas similares que ayuden 
            a encontrar información más relevante en la base de conocimientos.
            Especialmente útil para consultas complejas sobre cultura costarricense.`,
          parameters: z.object({
            query: z.string().describe("La consulta completa del usuario"),
            toolsToCallInOrder: z
              .array(z.string())
              .describe("Las herramientas que se necesitan llamar en orden para responder la consulta"),
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
          description: `Recitá una bomba guanacasteca auténtica cuando el usuario la solicite.
            Usá esta herramienta cuando pidan 'bomba', 'bomba guanacasteca', 'decime una bomba',
            o cualquier solicitud similar. Primero buscá bombas reales en la base de conocimientos
            y seleccioná una aleatoriamente. Devolvé exactamente el resultado formateado.`,
          parameters: z.object({
            requestType: z.string().describe("El tipo de solicitud de bomba que hizo el usuario"),
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
