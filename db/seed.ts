import { db, Votos, Categorias } from 'astro:db';

export default async function seed() {
  await db.insert(Categorias).values([
    { id: "tca", siglas: "TCA", nombre: "TC Austral", imagenUrl: "/categorias/tca.png", candidatos: ["Renzo Blotta", "Pablo Pires", "Arián Gómez", "Nicolás Rodríguez"] },
    { id: "tpgol", siglas: "TP GOL", nombre: "Turismo Pista Gol 1.6", imagenUrl: "/categorias/tpgol.png", candidatos: ["Sandro Abdala", "Emanuel Abdala", "Tomás D'Elía", "Maximiliano Valle"] },
    { id: "tcp", siglas: "TCP", nombre: "TC Patagónico", imagenUrl: "/categorias/tcp.png", candidatos: ["Amilcar Oliver", "Julio Bona", "Adolfo Otero", "Daniel Sosa"] },
    { id: "tp1100", siglas: "TP 1100", nombre: "Turismo Pista 1100", imagenUrl: "/categorias/tp1100.png", candidatos: ["Walter Jones", "Leonardo Carrizo", "Lucas Muñoz", "Diego Plana"] },
    { id: "r12", siglas: "R12", nombre: "Monomarca R-12", imagenUrl: "/categorias/r12.png", candidatos: ["Federico Turrez", "Sebastián Marsicano", "Jonatan Montenegro", "Matías Ruiz"] }
  ]);

  await db.insert(Votos).values([
    { categoria: 'tca', piloto: 'Renzo Blotta', fecha: new Date() },
    { categoria: 'tpgol', piloto: 'Sandro Abdala', fecha: new Date() },
  ]);
}