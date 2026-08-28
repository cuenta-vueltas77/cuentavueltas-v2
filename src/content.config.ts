import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const noticias = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/noticias",
  }),

  schema: z.object({
    titulo: z.string(),
    bajada: z.string(),
    fecha: z.coerce.date(),
    autor: z.string(),
    categorias: z.array(z.string()),
    tipo: z.string(),
    imagen: z.string(),
    credito_imagen: z.string().optional(),
    audio: z.string().optional(), // 
    galeria: z.any().optional(), // 
    destacada: z.boolean().default(false),
    mostrarEnInicio: z.boolean().default(true),
  }),
});

export const collections = {
  noticias,
};