"use strict";
import { AppDataSource } from "./configDb.js";
import { Exhibicion } from "../entity/Exhibicion.entity.js";
import { Usuario } from "../entity/Usuario.entity.js";
import { Quizz } from "../entity/Quizz.entity.js";
import { Pregunta } from "../entity/Pregunta.entity.js";
import { Respuesta } from "../entity/Respuesta.entity.js";
import { Visita } from "../entity/Visita.entity.js";
import { Responde } from "../entity/Responde.entity.js";
import bcrypt from "bcryptjs";

/**
 * Datos iniciales de las 4 exhibiciones del museo
 */
const exhibicionesIniciales = [
    {
        id_exhibicion: "huemul",
        nombre: "Huemul",
        relato_escrito: "El huemul es un ciervo nativo de los Andes patagónicos, símbolo nacional de Chile. Es una especie en peligro de extinción que habita en zonas montañosas entre Argentina y Chile. Su nombre científico es Hippocamelus bisulcus y se caracteriza por su pelaje café grisáceo y sus astas bifurcadas."
    },
    {
        id_exhibicion: "helice",
        nombre: "Hélice bleirot ix",
        relato_escrito: "Esta hélice perteneció a un avión de principios del siglo XX, utilizado en los albores de la aviación comercial en Chile. Fabricada en madera laminada, representa la ingeniería aeronáutica de la época, donde cada pieza era tallada artesanalmente. Es un testimonio de los pioneros que surcaron los cielos australes."
    },
    {
        id_exhibicion: "chemomul",
        nombre: "Chemamüll",
        relato_escrito: "Los chemamüll son una de las tantas expresiones y tradiciones mortuorias de la cultura mapuche. Los chemamüll son figuras antropomorfas de madera que son esculpidas para ser instaladas sobre la tumba de una persona fallecida. Tanto sus dimensiones como sus características estéticas tienen relación con la persona y su rol en la comunidad. Esto se debe a que el chemamüll representa el adche (forma, aspecto, costumbre) del difunto. A su vez, representa el püllü (espíritu de la persona), lo que se explica por el newen (fuerza) que el difunto le otorga al chemamüll: 'elkefuy tañi püllü pingey, tañi anümka mew elkefuy tañi püllü chewta anümelngey kisu' 'Solía dejar su espíritu, dicen, en el árbol dejaban su espíritu donde se le había plantado' (J. Alcaman). De esta manera, al plantarse el chemamüll después del entierro, éste es habitado intangiblemente por la persona fallecida."
    },
    {
        id_exhibicion: "cocodrilo",
        nombre: "cocodrilo",
        relato_escrito: "Piel de un cocodrilo."
    }
];

/**
 * Usuario admin predefinido (sin ID, lo genera la BD)
 * La contraseña se encriptará antes de insertarse
 */
const adminPassword = "admin123"; // Contraseña en texto plano (se encriptará)

/**
 * Función que verifica si la tabla está vacía y, de ser así, inserta los datos iniciales
 */
export async function seedDatabase() {
    try {
        // Repositorios
        const exhibicionRepo = AppDataSource.getRepository(Exhibicion);
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const preguntaRepo = AppDataSource.getRepository(Pregunta);
        const respuestaRepo = AppDataSource.getRepository(Respuesta);

        // 1. EXHIBICIONES
        const exhibicionCount = await exhibicionRepo.count();
        if (exhibicionCount === 0) {
            console.log("Insertando exhibiciones iniciales...");
            await exhibicionRepo.save(exhibicionesIniciales);
            console.log(`  Se insertaron ${exhibicionesIniciales.length} exhibiciones.`);
        } else {
            console.log(`  Ya existen ${exhibicionCount} exhibicion(es).`);
        }

        // 2. USUARIO ADMIN
        const usuarioCount = await usuarioRepo.count();
        let admin;
        if (usuarioCount === 0) {
            console.log("Insertando usuario admin...");
            
            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const contrasenaHash = await bcrypt.hash(adminPassword, salt);
            
            const adminUsuario = {
                nombre: "Admin",
                apellido: "Sistema",
                correo: "admin@museo.cl",
                contrasena: contrasenaHash,
                rol: "admin"
            };
            
            admin = await usuarioRepo.save(adminUsuario);
            console.log(`  Usuario admin creado: ${admin.correo} (ID: ${admin.id_usuario})`);
        } else {
            admin = await usuarioRepo.findOne({ where: { correo: "admin@museo.cl" } });
            console.log(`  Ya existen ${usuarioCount} usuario(s). Admin encontrado: ${admin.id_usuario}`);
        }

        // 3. QUIZZES (asignados al admin)
        const quizzCount = await quizzRepo.count();
        if (quizzCount === 0 && admin) {
            console.log("Insertando quizzes iniciales...");
                
                // Quiz 1: Huemul
                const quizHuemul = await quizzRepo.save({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "huemul",
                    titulo: "Quiz sobre el Huemul",
                    cant_preguntas: 3
                });

                const p1 = await preguntaRepo.save({
                    id_quizz: quizHuemul.id_quizz,
                    titulo: "Habitat del Huemul",
                    texto: "En que region habita principalmente el huemul?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p1.id_pregunta, texto: "Patagonia andina", es_correcta: true },
                    { id_pregunta: p1.id_pregunta, texto: "Desierto de Atacama", es_correcta: false },
                    { id_pregunta: p1.id_pregunta, texto: "Isla de Pascua", es_correcta: false }
                ]);

                const p2 = await preguntaRepo.save({
                    id_quizz: quizHuemul.id_quizz,
                    titulo: "Estado de conservacion",
                    texto: "Cual es el estado de conservacion del huemul?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p2.id_pregunta, texto: "En peligro de extincion", es_correcta: true },
                    { id_pregunta: p2.id_pregunta, texto: "Preocupacion menor", es_correcta: false },
                    { id_pregunta: p2.id_pregunta, texto: "Extinto", es_correcta: false }
                ]);

                const p3 = await preguntaRepo.save({
                    id_quizz: quizHuemul.id_quizz,
                    titulo: "Simbolo nacional",
                    texto: "El huemul es simbolo nacional de que pais?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p3.id_pregunta, texto: "Chile", es_correcta: true },
                    { id_pregunta: p3.id_pregunta, texto: "Peru", es_correcta: false },
                    { id_pregunta: p3.id_pregunta, texto: "Bolivia", es_correcta: false }
                ]);

                // Quiz 2: Helice
                const quizHelice = await quizzRepo.save({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "helice",
                    titulo: "Quiz sobre la Helice de Avion",
                    cant_preguntas: 2
                });

                const p4 = await preguntaRepo.save({
                    id_quizz: quizHelice.id_quizz,
                    titulo: "Material de la helice",
                    texto: "De que material esta fabricada la helice?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p4.id_pregunta, texto: "Madera laminada", es_correcta: true },
                    { id_pregunta: p4.id_pregunta, texto: "Aluminio", es_correcta: false },
                    { id_pregunta: p4.id_pregunta, texto: "Plastico", es_correcta: false }
                ]);

                const p5 = await preguntaRepo.save({
                    id_quizz: quizHelice.id_quizz,
                    titulo: "Epoca de la helice",
                    texto: "A que epoca pertenece esta helice?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p5.id_pregunta, texto: "Principios del siglo XX", es_correcta: true },
                    { id_pregunta: p5.id_pregunta, texto: "Siglo XIX", es_correcta: false },
                    { id_pregunta: p5.id_pregunta, texto: "Siglo XXI", es_correcta: false }
                ]);

                // Quiz 3: Chemamull
                const quizChemamull = await quizzRepo.save({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "chemomul",
                    titulo: "Quiz sobre el Chemamull",
                    cant_preguntas: 2
                });

                const p6 = await preguntaRepo.save({
                    id_quizz: quizChemamull.id_quizz,
                    titulo: "Cultura del chemamull",
                    texto: "A que cultura pertenece el chemamull?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p6.id_pregunta, texto: "Mapuche", es_correcta: true },
                    { id_pregunta: p6.id_pregunta, texto: "Inca", es_correcta: false },
                    { id_pregunta: p6.id_pregunta, texto: "Azteca", es_correcta: false }
                ]);

                const p7 = await preguntaRepo.save({
                    id_quizz: quizChemamull.id_quizz,
                    titulo: "Funcion del chemamull",
                    texto: "Para que se utilizaba el chemamull?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p7.id_pregunta, texto: "Tradicion mortuoria sobre tumbas", es_correcta: true },
                    { id_pregunta: p7.id_pregunta, texto: "Decoracion de casas", es_correcta: false },
                    { id_pregunta: p7.id_pregunta, texto: "Herramienta de caza", es_correcta: false }
                ]);

                // Quiz 4: Cocodrilo
                const quizCocodrilo = await quizzRepo.save({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "cocodrilo",
                    titulo: "Quiz sobre el Cocodrilo",
                    cant_preguntas: 2
                });

                const p8 = await preguntaRepo.save({
                    id_quizz: quizCocodrilo.id_quizz,
                    titulo: "Tipo de animal",
                    texto: "Los cocodrilos son:"
                });
                await respuestaRepo.save([
                    { id_pregunta: p8.id_pregunta, texto: "Reptiles", es_correcta: true },
                    { id_pregunta: p8.id_pregunta, texto: "Anfibios", es_correcta: false },
                    { id_pregunta: p8.id_pregunta, texto: "Mamiferos", es_correcta: false }
                ]);

                const p9 = await preguntaRepo.save({
                    id_quizz: quizCocodrilo.id_quizz,
                    titulo: "Habitat del cocodrilo",
                    texto: "Donde habitan los cocodrilos?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p9.id_pregunta, texto: "Rios y pantanos tropicales", es_correcta: true },
                    { id_pregunta: p9.id_pregunta, texto: "Desiertos", es_correcta: false },
                    { id_pregunta: p9.id_pregunta, texto: "Zonas polares", es_correcta: false }
                ]);

                console.log("  Se insertaron 4 quizzes con sus preguntas y respuestas.");
            } else {
                console.log(`  Ya existen ${quizzCount} quiz(zes).`);
            }

        // 4. VISITAS DE EJEMPLO (admin visita cada exhibición)
        const visitaRepo = AppDataSource.getRepository("Visita");
        const visitaCount = await visitaRepo.count();
        if (visitaCount === 0 && admin) {
            console.log("Insertando visitas de ejemplo...");
            
            await visitaRepo.save([
                { id_usuario: admin.id_usuario, id_exhibicion: "huemul", duracion_segundos: 180 },
                { id_usuario: admin.id_usuario, id_exhibicion: "helice", duracion_segundos: 240 },
                { id_usuario: admin.id_usuario, id_exhibicion: "chemomul", duracion_segundos: 300 },
                { id_usuario: admin.id_usuario, id_exhibicion: "cocodrilo", duracion_segundos: 150 }
            ]);
            
            console.log("  Se insertaron 4 visitas de ejemplo.");
        } else {
            console.log(`  Ya existen ${visitaCount} visita(s).`);
        }

        // 5. RESPUESTAS DE EJEMPLO (admin responde cada quiz)
        const respondeRepo = AppDataSource.getRepository("Responde");
        const respondeCount = await respondeRepo.count();
        if (respondeCount === 0 && quizzCount > 0 && admin) {
            console.log("Insertando respuestas de ejemplo...");
            
            await respondeRepo.save([
                { id_usuario: admin.id_usuario, id_quizz: 1, correctas: 3, tiempo_segundos: 45 },
                { id_usuario: admin.id_usuario, id_quizz: 2, correctas: 2, tiempo_segundos: 35 },
                { id_usuario: admin.id_usuario, id_quizz: 3, correctas: 2, tiempo_segundos: 50 },
                { id_usuario: admin.id_usuario, id_quizz: 4, correctas: 2, tiempo_segundos: 30 }
            ]);
            
            console.log("  Se insertaron 4 respuestas de ejemplo.");
        } else {
            console.log(`  Ya existen ${respondeCount} respuesta(s).`);
        }

        console.log("Inicializacion completada.");
    } catch (error) {
        console.error("Error al poblar la base de datos:", error);
        throw error;
    }
}

