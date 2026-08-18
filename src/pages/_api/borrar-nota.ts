export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Noticias, eq } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Falta el ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminamos la nota de Astro DB por su ID
    await db.delete(Noticias).where(eq(Noticias.id, Number(id)));

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al borrar nota:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar la nota' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};