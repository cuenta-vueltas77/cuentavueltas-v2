export const prerender = false; // <-- ESTO RESUELVE EL ERROR 500 EN LA LÍNEA 9

import type { APIRoute } from "astro";
import { db, Noticias, eq } from "astro:db";
import fs from "node:fs/promises";
import path from "node:path";

// 1. CREAR O EDITAR NOTAS (POST)
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    
    const idParam = data.get("id");
    const idNumero = (idParam && String(idParam).trim() !== "") ? Number(idParam) : null;

    const titulo = String(data.get("titulo") || "");
    const bajada = String(data.get("bajada") || "");
    const cuerpo = String(data.get("cuerpo") || "");
    const categorias = String(data.get("categorias") || "general");
    const tipo = String(data.get("tipo") || "nota");
    const autor = String(data.get("autor") || "Redacción CV77");
    const destacada = data.get("destacada") === "true" || data.get("destacada") === "on";
    const mostrarInicio = data.get("mostrarInicio") === "true" || data.get("mostrarInicio") === "on";

   // Tomamos y validamos la fecha para que nunca sea "Invalid Date"
const fechaParam = String(data.get("fecha") || "").trim();
let fecha = new Date();

if (fechaParam) {
  const intento = new Date(fechaParam);
  if (!isNaN(intento.getTime())) {
    fecha = intento;
  }
}
    // Si estamos editando y no subieron foto nueva, mantenemos la que ya estaba en DB
    let imagenUrl = String(data.get("imagen_actual") || "");
    const imagen = data.get("imagen") as File | null;

    if (imagen && imagen.size > 0 && imagen.name) {
      const buffer = Buffer.from(await imagen.arrayBuffer());
      const nombreLimpio = `${Date.now()}-${imagen.name.replace(/\s+/g, "-")}`;
      const rutaGuardado = path.join(process.cwd(), "public", "uploads", nombreLimpio);
      await fs.mkdir(path.dirname(rutaGuardado), { recursive: true });
      await fs.writeFile(rutaGuardado, buffer);
      imagenUrl = `/uploads/${nombreLimpio}`;
    }

    let audioUrl = String(data.get("audio_actual") || "");
    const audio = data.get("audio") as File | null;

    if (audio && audio.size > 0 && audio.name) {
      const buffer = Buffer.from(await audio.arrayBuffer());
      const nombreLimpio = `audio-${Date.now()}-${audio.name.replace(/\s+/g, "-")}`;
      const rutaGuardado = path.join(process.cwd(), "public", "uploads", nombreLimpio);
      await fs.mkdir(path.dirname(rutaGuardado), { recursive: true });
      await fs.writeFile(rutaGuardado, buffer);
      audioUrl = `/uploads/${nombreLimpio}`;
    }

    let idFinal = idNumero;

    if (idNumero && !isNaN(idNumero)) {
      // MODO EDICIÓN: Actualizamos la nota existente
      await db.update(Noticias).set({
        titulo,
        bajada,
        cuerpo,
        categorias,
        tipo,
        autor,
        fecha,
        imagenUrl,
        audioUrl,
        destacada,
        mostrarInicio,
      }).where(eq(Noticias.id, idNumero));
    } else {
      // MODO CREACIÓN: Insertamos nueva nota y capturamos su ID
      const resultado = await db.insert(Noticias).values({
        titulo,
        bajada,
        cuerpo,
        categorias,
        tipo,
        autor,
        fecha,
        imagenUrl,
        audioUrl,
        destacada,
        mostrarInicio,
      }).returning();
      
      idFinal = resultado[0]?.id || Date.now();
    }

    return new Response(JSON.stringify({ success: true, id: idFinal }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en API POST noticias:", error);
    return new Response(JSON.stringify({ error: "No se pudo guardar la nota." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 2. BORRAR NOTAS (DELETE)
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Falta el ID de la nota" }), { status: 400 });
    }
    await db.delete(Noticias).where(eq(Noticias.id, Number(id)));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en API DELETE noticias:", error);
    return new Response(JSON.stringify({ error: "No se pudo borrar la nota." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};