import { defineDb, defineTable, column } from 'astro:db';

const Votos = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    categoria: column.text(),
    piloto: column.text(),
    fecha: column.date(), 
  }
});

const Categorias = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    siglas: column.text(),
    nombre: column.text(),
    imagenUrl: column.text({ default: '' }),
    candidatos: column.json(),
  }
});

const Noticias = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    titulo: column.text(),
    bajada: column.text(),
    fecha: column.text(),
    autor: column.text({ default: 'Redacción CV77' }),
    categorias: column.json(),
    tipo: column.text({ default: 'Noticia general' }),
    imagenUrl: column.text({ default: '' }),       
    audioUrl: column.text({ default: '' }),        
    galeriaUrls: column.json(), 
    destacada: column.boolean({ default: false }),
    mostrarInicio: column.boolean({ default: true }),
    cuerpo: column.text(),
  }
});

export default defineDb({
  tables: { Votos, Categorias, Noticias },
});