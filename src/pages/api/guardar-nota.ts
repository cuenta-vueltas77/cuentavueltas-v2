export const prerender = false;

import type { APIRoute } from 'astro';
import { db, Noticias, eq } from 'astro:db';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const guardarArchivo = async (file: File | null): Promise<string> => {
      if (!file || file.size === 0 || !file.name) return '';
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const nombreLimpio = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = path.join(uploadsDir, nombreLimpio);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      return `/uploads/${nombreLimpio}`;
    };

    // Recibimos archivos o mantenemos los actuales si es una edición
    const portadaFile = formData.get('portada') as File | null;
    const imagenActual = formData.get('imagenActual')?.toString() || '';
    const imagenUrl = (await guardarArchivo(portadaFile)) || imagenActual;

    const audioFile = formData.get('audio') as File | null;
    const audioActual = formData.get('audioActual')?.toString() || '';
    const audioUrl = (await guardarArchivo(audioFile)) || audioActual;

    const galeriaFiles = formData.getAll('galeria') as File[];
    const galeriaUrls: string[] = [];
    for (const gFile of galeriaFiles) {
      if (gFile && gFile.size > 0) {
        const url = await guardarArchivo(gFile);
        if (url) galeriaUrls.push(url);
      }
    }

    const idRaw = formData.get('id')?.toString();
    const id = idRaw ? Number(idRaw) : null;

    const titulo = formData.get('titulo')?.toString() || '';
    const bajada = formData.get('bajada')?.toString() || '';
    const fecha = formData.get('fecha')?.toString() || new Date().toISOString().split('T')[0];
    const autor = formData.get('autor')?.toString() || 'Redacción CV77';
    const tipo = formData.get('tipo')?.toString() || 'Noticia general';
    const cuerpo = formData.get('cuerpo')?.toString() || '';
    const destacada = formData.get('destacada') === 'true';
    const mostrarInicio = formData.get('mostrarInicio') === 'true';

    let categorias = ['General'];
    const catRaw = formData.get('categorias')?.toString();
    if (catRaw) {
      try { categorias = JSON.parse(catRaw); } catch(e){}
    }

    // 👇 SI VINO UN ID, ACTUALIZAMOS LA NOTA EXISTENTE; SI NO, CREAMOS UNA NUEVA
    if (id) {
      await db.update(Noticias)
        .set({
          titulo,
          bajada,
          fecha,
          autor,
          categorias,
          tipo,
          imagenUrl,
          audioUrl,
          destacada,
          mostrarInicio,
          cuerpo,
        })
        .where(eq(Noticias.id, id));
    } else {
      await db.insert(Noticias).values({
        titulo,
        bajada,
        fecha,
        autor,
        categorias,
        tipo,
        imagenUrl,
        audioUrl,
        galeriaUrls,
        destacada,
        mostrarInicio,
        cuerpo,
      });
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al guardar noticia:', error);
    return new Response(JSON.stringify({ error: 'Error al procesar la nota' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};