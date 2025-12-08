"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Visita } from "../entity/Visita.entity.js";

export async function createVisitaService(id_usuario, id_exhibicion) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);

        const nuevaVisita = {
            id_usuario: id_usuario,
            id_exhibicion: id_exhibicion
            // fecha_visita se genera automáticamente con CURRENT_TIMESTAMP
            // duracion_segundos null hasta que se actualice
        };

        const visitaCreada = await visitaRepo.save(nuevaVisita);

        return [visitaCreada, null];
    } catch (error) {
        console.error("Error en createVisitaService:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function updateDuracionVisitaService(id_visita, duracion_segundos) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);

        const visita = await visitaRepo.findOne({ where: { id_visita } });

        if (!visita) {
            return [null, "Visita no encontrada"];
        }

        visita.duracion_segundos = duracion_segundos;
        const visitaActualizada = await visitaRepo.save(visita);

        return [visitaActualizada, null];
    } catch (error) {
        console.error("Error en updateDuracionVisitaService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener todas las visitas
 */
export async function getAllVisitasService() {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);
        
        const visitas = await visitaRepo.find({
            relations: ["usuario", "exhibicion"],
            order: { fecha_visita: "DESC" }
        });

        return [visitas, null];
    } catch (error) {
        console.error("Error en getAllVisitasService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener una visita por ID
 */
export async function getVisitaByIdService(id_visita) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);
        
        const visita = await visitaRepo.findOne({
            where: { id_visita },
            relations: ["usuario", "exhibicion"]
        });

        if (!visita) {
            return [null, "Visita no encontrada"];
        }

        return [visita, null];
    } catch (error) {
        console.error("Error en getVisitaByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener todas las visitas de una exhibición
 */
export async function getVisitasByExhibicionService(id_exhibicion) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);
        
        const visitas = await visitaRepo.find({
            where: { id_exhibicion },
            relations: ["usuario", "exhibicion"],
            order: { fecha_visita: "DESC" }
        });

        return [visitas, null];
    } catch (error) {
        console.error("Error en getVisitasByExhibicionService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener estadísticas de visitas y quizzes en un rango de fechas
 */
export async function getEstadisticasService(desde, hasta) {
    try {
        // Query para obtener visitas en el rango de fechas
        const queryVisitas = `
            SELECT 
                v.id_visita,
                v.fecha_visita,
                v.duracion_segundos,
                v.id_exhibicion,
                e.nombre as exhibicion_nombre
            FROM visita v
            LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
            WHERE v.fecha_visita >= $1 AND v.fecha_visita <= $2
            ORDER BY v.fecha_visita DESC
        `;

        const visitas = await AppDataSource.query(queryVisitas, [desde, hasta + ' 23:59:59']);

        // Query para obtener respuestas de quizzes en el mismo rango
        const queryResponde = `
            SELECT 
                r.id_responde,
                r.id_usuario,
                r.id_quizz,
                r.correctas,
                r.tiempo_segundos,
                r.respuestas_detalle,
                r.fecha_responde,
                q.cant_preguntas,
                q.titulo as quiz_titulo
            FROM responde r
            LEFT JOIN quizz q ON r.id_quizz = q.id_quizz
            WHERE r.fecha_responde >= $1 AND r.fecha_responde <= $2
            ORDER BY r.fecha_responde DESC
        `;

        const respuestas = await AppDataSource.query(queryResponde, [desde, hasta + ' 23:59:59']);

        // Calcular estadísticas generales
        const totalVisitas = visitas.length;
        const visitasConQuiz = respuestas.length;
        
        // Estadísticas por exhibición
        const visitasPorExhibicion = {};
        visitas.forEach(v => {
            if (!visitasPorExhibicion[v.id_exhibicion]) {
                visitasPorExhibicion[v.id_exhibicion] = {
                    nombre: v.exhibicion_nombre,
                    cantidad: 0,
                    duracion_promedio: 0,
                    duraciones: []
                };
            }
            visitasPorExhibicion[v.id_exhibicion].cantidad++;
            if (v.duracion_segundos) {
                visitasPorExhibicion[v.id_exhibicion].duraciones.push(v.duracion_segundos);
            }
        });

        // Calcular promedios de duración
        Object.keys(visitasPorExhibicion).forEach(key => {
            const duraciones = visitasPorExhibicion[key].duraciones;
            if (duraciones.length > 0) {
                const suma = duraciones.reduce((a, b) => a + b, 0);
                visitasPorExhibicion[key].duracion_promedio = Math.round(suma / duraciones.length);
            }
            delete visitasPorExhibicion[key].duraciones;
        });

        // Distribución de puntajes de quizzes (cuántos usuarios obtuvieron X/Y)
        const distribucionPuntajes = {};
        respuestas.forEach(r => {
            if (r.correctas !== null && r.correctas >= 0 && r.cant_preguntas > 0) {
                const key = `${r.correctas}/${r.cant_preguntas}`;
                distribucionPuntajes[key] = (distribucionPuntajes[key] || 0) + 1;
            }
        });

        // Visitas por día
        const visitasPorDia = {};
        visitas.forEach(v => {
            const fecha = v.fecha_visita.toISOString().split('T')[0];
            visitasPorDia[fecha] = (visitasPorDia[fecha] || 0) + 1;
        });

        // Análisis de rangos horarios de mayor tráfico
        const visitasPorHora = {};
        visitas.forEach(v => {
            const hora = v.fecha_visita.getHours();
            visitasPorHora[hora] = (visitasPorHora[hora] || 0) + 1;
        });

        // Encontrar la hora individual con más visitas (hora punta)
        let maxVisitas = 0;
        let horaPunta = 0;
        
        Object.keys(visitasPorHora).forEach(hora => {
            if (visitasPorHora[hora] > maxVisitas) {
                maxVisitas = visitasPorHora[hora];
                horaPunta = parseInt(hora);
            }
        });
        
        // Crear rango de 1 hora para la hora punta
        const rangoHorarioPico = {
            inicio: horaPunta,
            fin: horaPunta + 1,
            visitas: maxVisitas,
            descripcion: `${String(horaPunta).padStart(2, '0')}:00 - ${String(horaPunta + 1).padStart(2, '0')}:00`
        };

        // Distribución completa por hora
        const distribucionHoraria = Object.keys(visitasPorHora)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(hora => ({
                hora: parseInt(hora),
                horaFormato: `${String(hora).padStart(2, '0')}:00`,
                visitas: visitasPorHora[hora]
            }));

        // Analizar preguntas más difíciles (más errores) desde responde
        const preguntasDificiles = {};
        const preguntasCache = {};
        
        for (const r of respuestas) {
            if (r.respuestas_detalle && Array.isArray(r.respuestas_detalle) && r.respuestas_detalle.length > 0) {
                for (const respuesta of r.respuestas_detalle) {
                    if (!respuesta.es_correcta && respuesta.id_pregunta) {
                        const key = `${r.id_quizz}_${respuesta.id_pregunta}`;
                        
                        if (!preguntasDificiles[key]) {
                            let preguntaInfo = preguntasCache[respuesta.id_pregunta];
                            
                            if (!preguntaInfo) {
                                const queryPregunta = `
                                    SELECT p.titulo, p.texto, q.titulo as quiz_titulo, q.id_exhibicion, e.nombre as exhibicion_nombre
                                    FROM pregunta p
                                    JOIN quizz q ON p.id_quizz = q.id_quizz
                                    JOIN exhibicion e ON q.id_exhibicion = e.id_exhibicion
                                    WHERE p.id_pregunta = $1
                                `;
                                const [preguntaData] = await AppDataSource.query(queryPregunta, [respuesta.id_pregunta]);
                                preguntaInfo = preguntaData || { 
                                    titulo: 'Sin título', 
                                    texto: 'Pregunta desconocida', 
                                    quiz_titulo: 'Quiz desconocido',
                                    exhibicion_nombre: 'Desconocida'
                                };
                                preguntasCache[respuesta.id_pregunta] = preguntaInfo;
                            }
                            
                            preguntasDificiles[key] = {
                                exhibicion: preguntaInfo.exhibicion_nombre,
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

        return [{
            totalVisitas,
            visitasConQuiz,
            visitasSinQuiz: totalVisitas - visitasConQuiz,
            visitasPorExhibicion: Object.keys(visitasPorExhibicion).map(key => ({
                id: key,
                ...visitasPorExhibicion[key]
            })),
            distribucionPuntajes: Object.keys(distribucionPuntajes).map(key => ({
                puntaje: key,
                cantidad: distribucionPuntajes[key]
            })).sort((a, b) => b.cantidad - a.cantidad),
            visitasPorDia: Object.keys(visitasPorDia).sort().map(fecha => ({
                fecha,
                cantidad: visitasPorDia[fecha]
            })),
            rangoHorarioPico,
            distribucionHoraria,
            preguntasDificiles: Object.values(preguntasDificiles)
                .sort((a, b) => b.errores - a.errores)
                .slice(0, 10) // Top 10 preguntas con más errores
        }, null];
    } catch (error) {
        console.error("Error en getEstadisticasService:", error);
        return [null, "Error al obtener estadísticas"];
    }
}

/**
 * Obtener embudo de conversión (funnel)
 * Muestra el recorrido: visitaron → respondieron quiz
 */
export async function getEmbudoConversionService(desde, hasta) {
    try {
        // Contar total de visitas
        const queryVisitas = `
            SELECT COUNT(*) as total_visitas
            FROM visita
            WHERE fecha_visita >= $1 AND fecha_visita <= $2
        `;
        
        // Contar quizzes completados desde responde
        const queryResponde = `
            SELECT COUNT(*) as quiz_completados
            FROM responde
            WHERE fecha_responde >= $1 AND fecha_responde <= $2
        `;
        
        const resultadoVisitas = await AppDataSource.query(queryVisitas, [desde, hasta + ' 23:59:59']);
        const resultadoResponde = await AppDataSource.query(queryResponde, [desde, hasta + ' 23:59:59']);
        
        const totalVisitas = parseInt(resultadoVisitas[0].total_visitas);
        const quizCompletados = parseInt(resultadoResponde[0].quiz_completados);
        
        // Calcular tasa de conversión
        const tasaComplecion = totalVisitas > 0 ? ((quizCompletados / totalVisitas) * 100).toFixed(2) : 0;
        
        return [{
            embudo: [
                {
                    etapa: 'Visitaron exhibición',
                    cantidad: totalVisitas,
                    porcentaje: 100,
                    descripcion: 'Usuarios que accedieron a alguna exhibición'
                },
                {
                    etapa: 'Completaron quiz',
                    cantidad: quizCompletados,
                    porcentaje: parseFloat(tasaComplecion),
                    descripcion: 'Usuarios que respondieron y enviaron el quiz'
                }
            ],
            metricas: {
                totalVisitas,
                quizCompletados,
                tasaComplecion: parseFloat(tasaComplecion)
            }
        }, null];
    } catch (error) {
        console.error("Error en getEmbudoConversionService:", error);
        return [null, "Error al obtener embudo de conversión"];
    }
}

/**
 * Obtener análisis detallado de un quiz específico
 * Devuelve estadísticas de cada pregunta con el porcentaje de cada respuesta
 */
export async function getAnalisisQuizService(id_quiz) {
    try {
        // Obtener información del quiz con sus preguntas y respuestas
        const queryQuiz = `
            SELECT 
                q.id_quizz,
                q.cant_preguntas,
                q.id_exhibicion,
                e.nombre as exhibicion_nombre
            FROM quizz q
            LEFT JOIN exhibicion e ON q.id_exhibicion = e.id_exhibicion
            WHERE q.id_quizz = $1
        `;
        
        const quiz = await AppDataSource.query(queryQuiz, [id_quiz]);
        
        if (!quiz || quiz.length === 0) {
            return [null, "Quiz no encontrado"];
        }

        // Obtener todas las preguntas del quiz con sus respuestas
        const queryPreguntas = `
            SELECT 
                p.id_pregunta,
                p.texto as enunciado,
                p.id_quizz,
                r.id_respuesta,
                r.texto as texto_respuesta,
                r.es_correcta
            FROM pregunta p
            LEFT JOIN respuesta r ON p.id_pregunta = r.id_pregunta
            WHERE p.id_quizz = $1
            ORDER BY p.id_pregunta, r.id_respuesta
        `;
        
        const preguntasRaw = await AppDataSource.query(queryPreguntas, [id_quiz]);

        // Organizar preguntas con sus respuestas
        const preguntasMap = {};
        preguntasRaw.forEach(row => {
            if (!preguntasMap[row.id_pregunta]) {
                preguntasMap[row.id_pregunta] = {
                    id_pregunta: row.id_pregunta,
                    enunciado: row.enunciado,
                    respuestas: []
                };
            }
            if (row.id_respuesta) {
                preguntasMap[row.id_pregunta].respuestas.push({
                    id_respuesta: row.id_respuesta,
                    texto: row.texto_respuesta,
                    es_correcta: row.es_correcta
                });
            }
        });

        // Obtener todas las respuestas de este quiz desde tabla responde
        const queryResponde = `
            SELECT 
                r.id_responde,
                r.correctas,
                r.respuestas_detalle,
                r.fecha_responde
            FROM responde r
            WHERE r.id_quizz = $1 
            AND r.respuestas_detalle IS NOT NULL
        `;

        const respuestas = await AppDataSource.query(queryResponde, [id_quiz]);

        // Contar respuestas por pregunta
        const estadisticasPorPregunta = {};
        
        // Inicializar contadores para cada pregunta
        Object.keys(preguntasMap).forEach(idPregunta => {
            estadisticasPorPregunta[idPregunta] = {
                total_respuestas: 0,
                respuestas_conteo: {}
            };
            
            // Inicializar contadores para cada respuesta posible
            preguntasMap[idPregunta].respuestas.forEach(respuesta => {
                estadisticasPorPregunta[idPregunta].respuestas_conteo[respuesta.id_respuesta] = 0;
            });
        });

        // Contar las respuestas de los usuarios desde responde
        respuestas.forEach(responde => {
            if (responde.respuestas_detalle && Array.isArray(responde.respuestas_detalle)) {
                responde.respuestas_detalle.forEach(respuesta => {
                    const idPregunta = respuesta.id_pregunta;
                    const idRespuestaSeleccionada = respuesta.id_respuesta_seleccionada;
                    
                    if (estadisticasPorPregunta[idPregunta]) {
                        estadisticasPorPregunta[idPregunta].total_respuestas++;
                        
                        if (estadisticasPorPregunta[idPregunta].respuestas_conteo[idRespuestaSeleccionada] !== undefined) {
                            estadisticasPorPregunta[idPregunta].respuestas_conteo[idRespuestaSeleccionada]++;
                        }
                    }
                });
            }
        });

        // Calcular porcentajes y construir respuesta final
        const analisis = Object.keys(preguntasMap).map(idPregunta => {
            const pregunta = preguntasMap[idPregunta];
            const stats = estadisticasPorPregunta[idPregunta];
            const totalRespuestas = stats.total_respuestas;

            const respuestasConPorcentaje = pregunta.respuestas.map(respuesta => {
                const conteo = stats.respuestas_conteo[respuesta.id_respuesta] || 0;
                const porcentaje = totalRespuestas > 0 
                    ? Math.round((conteo / totalRespuestas) * 100) 
                    : 0;

                return {
                    id_respuesta: respuesta.id_respuesta,
                    texto: respuesta.texto,
                    es_correcta: respuesta.es_correcta,
                    cantidad: conteo,
                    porcentaje: porcentaje
                };
            });

            return {
                id_pregunta: pregunta.id_pregunta,
                enunciado: pregunta.enunciado,
                total_respuestas: totalRespuestas,
                respuestas: respuestasConPorcentaje.sort((a, b) => b.porcentaje - a.porcentaje)
            };
        }).filter(pregunta => pregunta.total_respuestas > 0); // Filtrar preguntas sin respuestas

        return [{
            quiz: {
                id_quizz: quiz[0].id_quizz,
                cant_preguntas: quiz[0].cant_preguntas,
                exhibicion: quiz[0].exhibicion_nombre
            },
            total_participantes: respuestas.length,
            analisis_preguntas: analisis
        }, null];

    } catch (error) {
        console.error("Error en getAnalisisQuizService:", error);
        return [null, "Error al obtener análisis del quiz"];
    }
}
