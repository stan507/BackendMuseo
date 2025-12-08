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
import { minioClient, bucketName } from "./minio.config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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


const adminPassword = "admin123";

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
                    cant_preguntas: 3,
                    es_activo: true
                });

                const p1 = await preguntaRepo.save({
                    id_quizz: quizHuemul.id_quizz,
                    titulo: "Hábitat del huemul",
                    texto: "¿En qué región habita principalmente el huemul?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p1.id_pregunta, texto: "Patagonia andina", es_correcta: true },
                    { id_pregunta: p1.id_pregunta, texto: "Desierto de Atacama", es_correcta: false },
                    { id_pregunta: p1.id_pregunta, texto: "Isla de Pascua", es_correcta: false }
                ]);

                const p2 = await preguntaRepo.save({
                    id_quizz: quizHuemul.id_quizz,
                    titulo: "Estado de conservación",
                    texto: "¿Cuál es el estado de conservación del huemul?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p2.id_pregunta, texto: "En peligro de extinción", es_correcta: true },
                    { id_pregunta: p2.id_pregunta, texto: "Preocupación menor", es_correcta: false },
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
                    titulo: "Quiz sobre la helice",
                    cant_preguntas: 2,
                    es_activo: true
                });

                const p4 = await preguntaRepo.save({
                    id_quizz: quizHelice.id_quizz,
                    titulo: "Material de la helice",
                    texto: "De que material esta fabricada la helice?"
                });
                await respuestaRepo.save([
                    { id_pregunta: p4.id_pregunta, texto: "Madera laminada", es_correcta: true },
                    { id_pregunta: p4.id_pregunta, texto: "Aluminio", es_correcta: false },
                    { id_pregunta: p4.id_pregunta, texto: "Plástico", es_correcta: false }
                ]);

                const p5 = await preguntaRepo.save({
                    id_quizz: quizHelice.id_quizz,
                    titulo: "Época de la hélice",
                    texto: "¿A qué época pertenece esta hélice?"
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
                    cant_preguntas: 2,
                    es_activo: true
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
                    titulo: "Quiz del Cocodrilo",
                    cant_preguntas: 2,
                    es_activo: true
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

        // Recalcular quizzCount después de insertar
        const quizzCountActual = await quizzRepo.count();

        // 4. VISITAS DE EJEMPLO con diferentes escenarios de quiz y horarios variados
        const visitaRepo = AppDataSource.getRepository("Visita");
        const visitaCount = await visitaRepo.count();
        if (visitaCount === 0 && admin) {
            console.log("Insertando visitas de ejemplo con escenarios de quiz y horarios variados...");
            
            const quizzHuemul = await quizzRepo.findOne({ where: { id_exhibicion: "huemul" } });
            const quizzHelice = await quizzRepo.findOne({ where: { id_exhibicion: "helice" } });
            const quizzChemamull = await quizzRepo.findOne({ where: { id_exhibicion: "chemomul" } });
            const quizzCocodrilo = await quizzRepo.findOne({ where: { id_exhibicion: "cocodrilo" } });
            
            // Obtener preguntas de todos los quizzes para usar en las respuestas
            const preguntasHuemul = quizzHuemul ? await preguntaRepo.find({ where: { id_quizz: quizzHuemul.id_quizz } }) : [];
            const preguntasHelice = quizzHelice ? await preguntaRepo.find({ where: { id_quizz: quizzHelice.id_quizz } }) : [];
            const preguntasChemamull = quizzChemamull ? await preguntaRepo.find({ where: { id_quizz: quizzChemamull.id_quizz } }) : [];
            const preguntasCocodrilo = quizzCocodrilo ? await preguntaRepo.find({ where: { id_quizz: quizzCocodrilo.id_quizz } }) : [];
            
            const crearFecha = (diasAtras, hora, minutos = 0) => {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - diasAtras);
                fecha.setHours(hora, minutos, 0, 0);
                return fecha;
            };

            const visitasAInsertar = [];

            // Día 1: Alta concentración a las 14:00 (hora punta)
            if (preguntasHuemul.length >= 3) {
                visitasAInsertar.push({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "huemul",
                    fecha_visita: crearFecha(1, 14, 10),
                    duracion_segundos: 420,
                    quiz_iniciado: true,
                    puntaje_quiz: 3,
                    respuestas_quiz: [
                        { id_pregunta: preguntasHuemul[0].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true },
                        { id_pregunta: preguntasHuemul[1].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true },
                        { id_pregunta: preguntasHuemul[2].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true }
                    ]
                });
            }
            
            if (preguntasCocodrilo.length >= 2) {
                visitasAInsertar.push({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "cocodrilo",
                    fecha_visita: crearFecha(1, 14, 20),
                    duracion_segundos: 280,
                    quiz_iniciado: true,
                    puntaje_quiz: 2,
                    respuestas_quiz: [
                        { id_pregunta: preguntasCocodrilo[0].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true },
                        { id_pregunta: preguntasCocodrilo[1].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true }
                    ]
                });
            }
            
            if (preguntasChemamull.length >= 2) {
                visitasAInsertar.push({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "chemomul",
                    fecha_visita: crearFecha(1, 14, 35),
                    duracion_segundos: 360,
                    quiz_iniciado: true,
                    puntaje_quiz: 1,
                    respuestas_quiz: [
                        { id_pregunta: preguntasChemamull[0].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true },
                        { id_pregunta: preguntasChemamull[1].id_pregunta, id_respuesta_seleccionada: 2, es_correcta: false }
                    ]
                });
            }
            
            if (preguntasHelice.length >= 2) {
                visitasAInsertar.push({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "helice",
                    fecha_visita: crearFecha(1, 14, 45),
                    duracion_segundos: 300,
                    quiz_iniciado: true,
                    puntaje_quiz: 2,
                    respuestas_quiz: [
                        { id_pregunta: preguntasHelice[0].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true },
                        { id_pregunta: preguntasHelice[1].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true }
                    ]
                });
            }
            
            // Más visitas a las 14:00
            if (preguntasHuemul.length >= 3) {
                visitasAInsertar.push({
                    id_usuario: admin.id_usuario,
                    id_exhibicion: "huemul",
                    fecha_visita: crearFecha(1, 14, 50),
                    duracion_segundos: 450,
                    quiz_iniciado: true,
                    puntaje_quiz: 2,
                    respuestas_quiz: [
                        { id_pregunta: preguntasHuemul[0].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true },
                        { id_pregunta: preguntasHuemul[1].id_pregunta, id_respuesta_seleccionada: 2, es_correcta: false },
                        { id_pregunta: preguntasHuemul[2].id_pregunta, id_respuesta_seleccionada: 1, es_correcta: true }
                    ]
                });
            }

            // Día 2: Algunas visitas dispersas
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "helice",
                fecha_visita: crearFecha(2, 11, 30),
                duracion_segundos: 300,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });
            
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "cocodrilo",
                fecha_visita: crearFecha(2, 15, 20),
                duracion_segundos: 280,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });

            // Día 3: Sin visitas (para mostrar dinamismo)
            
            // Día 4: Más visitas a las 14:00
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "huemul",
                fecha_visita: crearFecha(4, 14, 5),
                duracion_segundos: 400,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });
            
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "cocodrilo",
                fecha_visita: crearFecha(4, 14, 15),
                duracion_segundos: 280,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });

            // Día 5: Sin visitas
            
            // Día 6-10: Algunas visitas dispersas en diferentes horarios
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "huemul",
                fecha_visita: crearFecha(10, 11, 0),
                duracion_segundos: 400,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });
            
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "chemomul",
                fecha_visita: crearFecha(8, 15, 30),
                duracion_segundos: 350,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });
            
            visitasAInsertar.push({
                id_usuario: admin.id_usuario,
                id_exhibicion: "helice",
                fecha_visita: crearFecha(6, 12, 15),
                duracion_segundos: 300,
                quiz_iniciado: false,
                puntaje_quiz: null,
                respuestas_quiz: null
            });

            await visitaRepo.save(visitasAInsertar);
            
            console.log(`  Se insertaron ${visitasAInsertar.length} visitas de ejemplo con patrón realista:`);
            console.log("    - Día 1: Alta concentración a las 14:00 (5 visitas = HORA PUNTA)");
            console.log("    - Día 2: 2 visitas dispersas");
            console.log("    - Días 3, 5, 7, 9: Sin visitas (dinamismo)");
            console.log("    - Otros días: 1-2 visitas en horarios variados");
        } else {
            console.log(`  Ya existen ${visitaCount} visita(s).`);
        }

        // 5. RESPUESTAS DE EJEMPLO (admin responde cada quiz)
        const respondeRepo = AppDataSource.getRepository("Responde");
        const respondeCount = await respondeRepo.count();
        if (respondeCount === 0 && quizzCountActual > 0 && admin) {
            console.log("Insertando respuestas de ejemplo...");
            
            // Obtener preguntas de cada quiz para generar respuestas_detalle realistas
            const quizzes = await quizzRepo.find({ relations: ["preguntas", "preguntas.respuestas"] });
            
            const respuestasEjemplo = [];
            
            for (const quiz of quizzes) {
                if (quiz.preguntas && quiz.preguntas.length > 0) {
                    const respuestasDetalle = quiz.preguntas.map((pregunta, index) => {
                        // Simular que acierta 2-3 de cada quiz
                        const respuestaCorrecta = pregunta.respuestas.find(r => r.es_correcta);
                        const respuestaIncorrecta = pregunta.respuestas.find(r => !r.es_correcta);
                        const esCorrecta = index < 2; // Primeras 2 correctas
                        const respuestaSeleccionada = esCorrecta ? respuestaCorrecta : respuestaIncorrecta;
                        
                        return {
                            id_pregunta: pregunta.id_pregunta,
                            id_respuesta_seleccionada: respuestaSeleccionada?.id_respuesta || 0,
                            es_correcta: esCorrecta,
                            texto_pregunta: pregunta.titulo,
                            texto_respuesta: respuestaSeleccionada?.texto || "Sin respuesta"
                        };
                    });
                    
                    const correctas = respuestasDetalle.filter(r => r.es_correcta).length;
                    
                    respuestasEjemplo.push({
                        id_usuario: admin.id_usuario,
                        id_quizz: quiz.id_quizz,
                        correctas: correctas,
                        tiempo_segundos: 30 + (quiz.cant_preguntas * 10),
                        respuestas_detalle: respuestasDetalle
                    });
                }
            }
            
            if (respuestasEjemplo.length > 0) {
                await respondeRepo.save(respuestasEjemplo);
                console.log(`  Se insertaron ${respuestasEjemplo.length} respuestas de ejemplo con detalles completos.`);
            }
        } else {
            console.log(`  Ya existen ${respondeCount} respuesta(s).`);
        }

        // 6. VALIDACION DE ARCHIVOS EN MINIO
        console.log("Verificando archivos en MinIO...");
        await verificarArchivosMinIO();

        console.log("Inicializacion completada.");
    } catch (error) {
        console.error("Error al poblar la base de datos:", error);
        throw error;
    }
}


async function verificarArchivosMinIO() {
    const exhibiciones = ['huemul', 'helice', 'chemomul', 'cocodrilo'];
    const carpetas = ['videos', 'fotos', 'audios', 'modelo3D', 'textura'];
    
    let totalArchivos = 0;
    let carpetasVacias = 0;
    let archivosSubidos = 0;
    const assetsPath = path.join(__dirname, '../../assets');

    try {
        // Verificar que el bucket exista
        const bucketExists = await minioClient.bucketExists(bucketName);
        if (!bucketExists) {
            console.log(` Bucket '${bucketName}' no existe en MinIO. Creando...`);
            await minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(` Bucket '${bucketName}' creado exitosamente.`);
        }

        for (const exhibicion of exhibiciones) {
            for (const carpeta of carpetas) {
                const prefix = `${exhibicion}/${carpeta}/`;
                
                try {
                    const stream = minioClient.listObjects(bucketName, prefix, false);
                    let archivosEnCarpeta = 0;

                    await new Promise((resolve, reject) => {
                        stream.on('data', (obj) => {
                            if (!obj.name.endsWith('/')) {
                                archivosEnCarpeta++;
                                totalArchivos++;
                            }
                        });
                        stream.on('error', reject);
                        stream.on('end', resolve);
                    });

                    if (archivosEnCarpeta === 0) {
                        carpetasVacias++;
                        const carpetaLocal = path.join(assetsPath, exhibicion, carpeta);
                        
                        if (fs.existsSync(carpetaLocal)) {
                            const archivosLocales = fs.readdirSync(carpetaLocal);
                            const archivosValidos = archivosLocales.filter(file => 
                                !file.startsWith('.') && fs.statSync(path.join(carpetaLocal, file)).isFile()
                            );

                            if (archivosValidos.length > 0) {
                                console.log(`Subiendo archivos de respaldo a ${prefix}...`);
                                
                                for (const archivo of archivosValidos) {
                                    try {
                                        const archivoPath = path.join(carpetaLocal, archivo);
                                        const objectName = `${prefix}${archivo}`;
                                        
                                        await minioClient.fPutObject(bucketName, objectName, archivoPath);
                                        archivosSubidos++;
                                        console.log(`    ✓ ${archivo}`);
                                    } catch (uploadError) {
                                        console.error(`    ✗ Error al subir ${archivo}:`, uploadError.message);
                                    }
                                }
                            } else {
                                console.log(`${prefix} vacío (no hay archivos de respaldo en Backend/assets)`);
                            }
                        } else {
                            console.log(`${prefix} vacío (carpeta de respaldo no existe)`);
                        }
                    }
                } catch (error) {
                    console.error(` Error al verificar ${prefix}:`, error.message);
                }
            }
        }

        console.log(`\nResumen de validación MinIO:`);
        console.log(` - Total archivos encontrados: ${totalArchivos}`);
        if (archivosSubidos > 0) {
            console.log(` - Archivos subidos automáticamente: ${archivosSubidos}`);
        }
        if (carpetasVacias > archivosSubidos) {
            console.log(` - Carpetas vacías sin respaldo: ${carpetasVacias - (archivosSubidos > 0 ? Math.floor(archivosSubidos / 5) : 0)}`);
            console.log(`Coloca archivos en Backend/assets/ para subida automática`);
        }

    } catch (error) {
        console.error(" Error al verificar archivos en MinIO:", error.message);
        console.log("  Verifica que MinIO esté corriendo y las credenciales sean correctas");
    }
}

