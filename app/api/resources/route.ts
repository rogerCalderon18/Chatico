import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { nanoid } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    // Procesar multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file");
    const resourceName = formData.get("resourceName");

    if (!file || typeof resourceName !== "string") {
      return NextResponse.json({ error: "Faltan campos obligatorios (file, resourceName)" }, { status: 400 });
    }

    // Leer el archivo como texto
    let content = "";
    if (file instanceof Blob) {
      content = await file.text();
    } else {
      return NextResponse.json({ error: "El archivo no es válido" }, { status: 400 });
    }

    // 1. Crear el recurso
    const resourceId = nanoid();
    await db.insert(resources).values({
      id: resourceId,
      content,
    });

    // 2. Generar embeddings por fragmento
    const embeddings = await generateEmbeddings(content);

    // 3. Guardar cada embedding asociado al recurso
    for (const { embedding, content: chunk } of embeddings) {
      await db.insert(embeddingsTable).values({
        id: nanoid(),
        resourceId,
        content: chunk,
        embedding,
      });
    }

    return NextResponse.json({ resourceId, fragments: embeddings.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
