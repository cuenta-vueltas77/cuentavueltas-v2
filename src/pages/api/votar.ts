// Indicamos a Astro que este endpoint no es estático y debe procesar solicitudes POST
export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Votos } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { categoria, piloto } = data;

    if (!categoria || !piloto) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guardamos el voto en la base de datos de Astro DB
    await db.insert(Votos).values({
      categoria,
      piloto,
      fecha: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al votar:', error);
    return new Response(JSON.stringify({ error: 'Error al guardar el voto' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};