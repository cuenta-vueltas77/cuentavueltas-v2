// src/pages/api/votar.ts
export const prerender = false; // <-- CRUCIAL: Esto le dice a Vercel que trabaje "en vivo"
import { turso } from "../../lib/turso";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { categoria, piloto } = body;

    if (!categoria || !piloto) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400 });
    }

    // El cartero mete el voto en la urna NUEVA de Turso
    await turso.execute({
      sql: "INSERT INTO votos_nuevos (categoria_id, piloto) VALUES (?, ?)",
      args: [categoria, piloto],
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error al guardar el voto:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}