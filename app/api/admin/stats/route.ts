import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings } from "@/lib/db/schema/embeddings";
import { sql, desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Total de recursos
    const totalResources = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resources);

    // Total de embeddings/fragmentos
    const totalEmbeddings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(embeddings);

    // Recursos recientes (últimos 10)
    const recentResources = await db
      .select({
        id: resources.id,
        content: sql<string>`substr(${resources.content}, 1, 100)`,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .orderBy(desc(resources.createdAt))
      .limit(10);

    // Para cada recurso reciente, contar sus fragmentos
    const recentResourcesWithCounts = await Promise.all(
      recentResources.map(async (resource) => {
        const fragmentCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(embeddings)
          .where(eq(embeddings.resourceId, resource.id));
        
        return {
          ...resource,
          fragmentCount: fragmentCount[0]?.count || 0
        };
      })
    );

    // Estadísticas por día (últimos 7 días)
    const dailyStats = await db
      .select({
        date: sql<string>`date(${resources.createdAt})`,
        count: sql<number>`count(*)::int`
      })
      .from(resources)
      .where(sql`${resources.createdAt} >= current_date - interval '7 days'`)
      .groupBy(sql`date(${resources.createdAt})`)
      .orderBy(sql`date(${resources.createdAt}) desc`);

    // Tamaño promedio de contenido
    const avgContentLength = await db
      .select({
        avg: sql<number>`avg(length(${resources.content}))::int`
      })
      .from(resources);

    return NextResponse.json({
      totalResources: totalResources[0]?.count || 0,
      totalEmbeddings: totalEmbeddings[0]?.count || 0,
      recentResources: recentResourcesWithCounts,
      dailyStats,
      avgContentLength: avgContentLength[0]?.avg || 0,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ 
      error: 'Error al obtener estadísticas',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
