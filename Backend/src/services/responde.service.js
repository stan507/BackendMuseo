"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Responde } from "../entity/Responde.entity.js";

export async function createRespondeService(id_usuario, id_quizz, correctas, tiempo_segundos = null, respuestas_detalle = null) {
    try {
        const respondeRepo = AppDataSource.getRepository(Responde);
        
        // Si hay respuestas_detalle, verificar si está incompleto y rellenar preguntas faltantes como incorrectas
        let respuestasCompletas = respuestas_detalle;
        
        if (respuestas_detalle && Array.isArray(respuestas_detalle) && respuestas_detalle.length > 0) {
            const queryPreguntas = `
                SELECT p.id_pregunta, p.texto as texto_pregunta
                FROM pregunta p
                WHERE p.id_quizz = $1
                ORDER BY p.id_pregunta
            `;
            const preguntasQuiz = await AppDataSource.query(queryPreguntas, [id_quizz]);
            
            if (preguntasQuiz && preguntasQuiz.length > 0) {
                // IDs de preguntas respondidas
                const preguntasRespondidas = new Set(respuestas_detalle.map(r => r.id_pregunta));
                
                // Rellenar preguntas no respondidas como incorrectas
                const preguntasFaltantes = preguntasQuiz.filter(p => !preguntasRespondidas.has(p.id_pregunta));
                
                if (preguntasFaltantes.length > 0) {
                    console.log(`[Responde Service] Quiz ${id_quizz}: Rellenando ${preguntasFaltantes.length} preguntas no respondidas como incorrectas`);
                    
                    preguntasFaltantes.forEach(pregunta => {
                        respuestasCompletas.push({
                            id_pregunta: pregunta.id_pregunta,
                            id_respuesta_seleccionada: null,
                            es_correcta: false,
                            texto_pregunta: pregunta.texto_pregunta,
                            texto_respuesta: "Sin respuesta (abandonado)"
                        });
                    });
                }
            }
        }

        const nuevoResponde = {
            id_usuario: id_usuario,
            id_quizz: id_quizz,
            correctas: correctas,
            tiempo_segundos: tiempo_segundos,
            respuestas_detalle: respuestasCompletas
            // fecha_responde se genera automáticamente con CURRENT_TIMESTAMP
        };

        const respondeCreado = await respondeRepo.save(nuevoResponde);

        return [respondeCreado, null];
    } catch (error) {
        console.error("Error en createRespondeService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener análisis de preguntas difíciles (más errores)
 */
export async function getPreguntasDificilesService(fechaInicio, fechaFin) {
    try {
        const respondeRepo = AppDataSource.getRepository(Responde);
        
        const respuestas = await respondeRepo.find({
            where: fechaInicio && fechaFin ? {
                fecha_responde: AppDataSource.getRepository(Responde).metadata.connection.driver.constructor.name === 'PostgresDriver' 
                    ? `>= '${fechaInicio}' AND fecha_responde <= '${fechaFin}'`
                    : undefined
            } : {},
            relations: ["quizz", "quizz.exhibicion"]
        });

        const preguntasDificiles = {};
        const preguntasCache = {};

        for (const responde of respuestas) {
            if (responde.respuestas_detalle && Array.isArray(responde.respuestas_detalle) && responde.respuestas_detalle.length > 0) {
                for (const respuesta of responde.respuestas_detalle) {
                    if (!respuesta.es_correcta && respuesta.id_pregunta) {
                        const key = `${responde.id_quizz}_${respuesta.id_pregunta}`;
                        
                        if (!preguntasDificiles[key]) {
                            let preguntaInfo = preguntasCache[respuesta.id_pregunta];
                            
                            if (!preguntaInfo) {
                                const queryPregunta = `
                                    SELECT p.titulo, p.texto, q.titulo as quiz_titulo, q.id_exhibicion
                                    FROM pregunta p
                                    JOIN quizz q ON p.id_quizz = q.id_quizz
                                    WHERE p.id_pregunta = $1
                                `;
                                const [preguntaData] = await AppDataSource.query(queryPregunta, [respuesta.id_pregunta]);
                                preguntaInfo = preguntaData || { 
                                    titulo: 'Sin título', 
                                    texto: 'Pregunta desconocida', 
                                    quiz_titulo: 'Quiz desconocido',
                                    id_exhibicion: 'desconocido'
                                };
                                preguntasCache[respuesta.id_pregunta] = preguntaInfo;
                            }
                            
                            preguntasDificiles[key] = {
                                id_exhibicion: preguntaInfo.id_exhibicion,
                                quiz_titulo: preguntaInfo.quiz_titulo,
                                titulo_pregunta: preguntaInfo.titulo,
                                texto: preguntaInfo.texto,
                                errores: 0
                            };
                        }
                        preguntasDificiles[key].errores++;
                    }
                }
            }
        }

        const preguntasArray = Object.values(preguntasDificiles).sort((a, b) => b.errores - a.errores);

        return [preguntasArray, null];
    } catch (error) {
        console.error("Error en getPreguntasDificilesService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener todas las respuestas
 */
export async function getAllRespondesService() {
    try {
        const respondeRepo = AppDataSource.getRepository(Responde);
        
        const respuestas = await respondeRepo.find({
            relations: ["usuario", "quizz"],
            order: { fecha_responde: "DESC" }
        });

        return [respuestas, null];
    } catch (error) {
        console.error("Error en getAllRespondesService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener todas las respuestas de un quiz específico
 */
export async function getRespondesByQuizzService(id_quizz) {
    try {
        const respondeRepo = AppDataSource.getRepository(Responde);
        
        const respuestas = await respondeRepo.find({
            where: { id_quizz },
            relations: ["usuario", "quizz"],
            order: { fecha_responde: "DESC" }
        });

        return [respuestas, null];
    } catch (error) {
        console.error("Error en getRespondesByQuizzService:", error);
        return [null, "Error interno del servidor"];
    }
}
