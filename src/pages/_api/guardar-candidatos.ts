export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Categorias, eq } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json(); // Recibe los nombres editados desde el admin

    for (const item of data) {
      await db.update(Categorias)
        .set({ candidatos: item.candidatos })
        .where(eq(Categorias.id, item.id));
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al guardar candidatos:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar candidatos' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};