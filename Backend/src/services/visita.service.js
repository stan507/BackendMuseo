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

export async function updateDuracionVisitaService(id_visita, duracion_segundos, puntaje_quiz = null, respuestas_quiz = null) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);

        const visita = await visitaRepo.findOne({ where: { id_visita } });

        if (!visita) {
            return [null, "Visita no encontrada"];
        }

        visita.duracion_segundos = duracion_segundos;
        
        // Actualizar puntaje y respuestas del quiz si se proporcionan
        if (puntaje_quiz !== null) {
            visita.puntaje_quiz = puntaje_quiz;
        }
        if (respuestas_quiz !== null) {
            visita.respuestas_quiz = respuestas_quiz;
        }
        
        const visitaActualizada = await visitaRepo.save(visita);

        return [visitaActualizada, null];
    } catch (error) {
        console.error("Error en updateDuracionVisitaService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Marcar que el quiz fue iniciado o abandonado
 */
export async function updateQuizEstadoService(id_visita, quiz_iniciado) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);

        const visita = await visitaRepo.findOne({ where: { id_visita } });

        if (!visita) {
            return [null, "Visita no encontrada"];
        }

        visita.quiz_iniciado = quiz_iniciado;
        const visitaActualizada = await visitaRepo.save(visita);

        return [visitaActualizada, null];
    } catch (error) {
        console.error("Error en updateQuizEstadoService:", error);
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
        // Query para obtener visitas en el rango de fechas con puntajes de quizzes
        const queryVisitas = `
            SELECT 
                v.id_visita,
                v.fecha_visita,
                v.duracion_segundos,
                v.id_exhibicion,
                e.nombre as exhibicion_nombre,
                COALESCE(v.puntaje_quiz, 0) as puntaje_quiz,
                COALESCE(q.cant_preguntas, 0) as preguntas_totales,
                v.respuestas_quiz,
                q.titulo as quiz_titulo
            FROM visita v
            LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
            LEFT JOIN quizz q ON v.id_exhibicion = q.id_exhibicion AND q.es_activo = true
            WHERE v.fecha_visita >= $1 AND v.fecha_visita <= $2
            ORDER BY v.fecha_visita DESC
        `;

        const visitas = await AppDataSource.query(queryVisitas, [desde, hasta + ' 23:59:59']);

        // Calcular estadísticas generales
        const totalVisitas = visitas.length;
        const visitasConQuiz = visitas.filter(v => v.puntaje_quiz !== null && v.puntaje_quiz > 0).length;
        
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
        visitas.forEach(v => {
            if (v.puntaje_quiz !== null && v.puntaje_quiz > 0 && v.preguntas_totales > 0) {
                const key = `${v.puntaje_quiz}/${v.preguntas_totales}`;
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

        // Encontrar el rango horario pico (2 horas consecutivas con más visitas)
        let maxVisitas = 0;
        let rangoHorarioPico = { inicio: 0, fin: 0, visitas: 0 };
        
        // Buscar ventanas de 1, 2 y 3 horas
        for (let ventana = 1; ventana <= 3; ventana++) {
            for (let horaInicio = 0; horaInicio <= 23 - ventana; horaInicio++) {
                let visitasEnVentana = 0;
                for (let i = 0; i < ventana; i++) {
                    visitasEnVentana += (visitasPorHora[horaInicio + i] || 0);
                }
                
                if (visitasEnVentana > maxVisitas) {
                    maxVisitas = visitasEnVentana;
                    rangoHorarioPico = {
                        inicio: horaInicio,
                        fin: horaInicio + ventana,
                        visitas: visitasEnVentana,
                        descripcion: `${String(horaInicio).padStart(2, '0')}:00 - ${String(horaInicio + ventana).padStart(2, '0')}:00`
                    };
                }
            }
        }

        // Distribución completa por hora
        const distribucionHoraria = Object.keys(visitasPorHora)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(hora => ({
                hora: parseInt(hora),
                horaFormato: `${String(hora).padStart(2, '0')}:00`,
                visitas: visitasPorHora[hora]
            }));

        // Analizar preguntas más difíciles (más errores)
        const preguntasDificiles = {};
        const preguntasCache = {}; // Cache para no consultar la misma pregunta múltiples veces
        
        for (const v of visitas) {
            if (v.respuestas_quiz && Array.isArray(v.respuestas_quiz)) {
                for (const respuesta of v.respuestas_quiz) {
                    if (!respuesta.es_correcta && respuesta.id_pregunta) {
                        const key = `${v.id_exhibicion}_${respuesta.id_pregunta}`;
                        
                        if (!preguntasDificiles[key]) {
                            // Obtener información de la pregunta desde la base de datos
                            let preguntaInfo = preguntasCache[respuesta.id_pregunta];
                            
                            if (!preguntaInfo) {
                                const queryPregunta = `
                                    SELECT p.titulo, p.texto, q.titulo as quiz_titulo
                                    FROM pregunta p
                                    JOIN quizz q ON p.id_quizz = q.id_quizz
                                    WHERE p.id_pregunta = $1
                                `;
                                const [preguntaData] = await AppDataSource.query(queryPregunta, [respuesta.id_pregunta]);
                                preguntaInfo = preguntaData || { titulo: 'Sin título', texto: 'Pregunta desconocida', quiz_titulo: 'Quiz desconocido' };
                                preguntasCache[respuesta.id_pregunta] = preguntaInfo;
                            }
                            
                            preguntasDificiles[key] = {
                                exhibicion: v.exhibicion_nombre || v.id_exhibicion,
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
 * Muestra el recorrido: visitaron → abrieron quiz → completaron quiz
 */
export async function getEmbudoConversionService(desde, hasta) {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_visitas,
                COUNT(CASE WHEN quiz_iniciado = true THEN 1 END) as quiz_abiertos,
                COUNT(CASE WHEN puntaje_quiz IS NOT NULL THEN 1 END) as quiz_completados,
                COUNT(CASE WHEN quiz_iniciado = true AND puntaje_quiz IS NULL THEN 1 END) as quiz_abandonados
            FROM visita
            WHERE fecha_visita >= $1 AND fecha_visita <= $2
        `;
        
        const resultado = await AppDataSource.query(query, [desde, hasta + ' 23:59:59']);
        const datos = resultado[0];
        
        const totalVisitas = parseInt(datos.total_visitas);
        const quizAbiertos = parseInt(datos.quiz_abiertos);
        const quizCompletados = parseInt(datos.quiz_completados);
        const quizAbandonados = parseInt(datos.quiz_abandonados);
        
        // Calcular tasas de conversión
        const tasaApertura = totalVisitas > 0 ? ((quizAbiertos / totalVisitas) * 100).toFixed(2) : 0;
        const tasaComplecion = quizAbiertos > 0 ? ((quizCompletados / quizAbiertos) * 100).toFixed(2) : 0;
        const tasaAbandonoGeneral = totalVisitas > 0 ? ((quizAbandonados / totalVisitas) * 100).toFixed(2) : 0;
        
        return [{
            embudo: [
                {
                    etapa: 'Visitaron exhibición',
                    cantidad: totalVisitas,
                    porcentaje: 100,
                    descripcion: 'Usuarios que accedieron a alguna exhibición'
                },
                {
                    etapa: 'Abrieron quiz',
                    cantidad: quizAbiertos,
                    porcentaje: parseFloat(tasaApertura),
                    descripcion: 'Usuarios que hicieron clic en el botón del quiz'
                },
                {
                    etapa: 'Completaron quiz',
                    cantidad: quizCompletados,
                    porcentaje: totalVisitas > 0 ? ((quizCompletados / totalVisitas) * 100).toFixed(2) : 0,
                    descripcion: 'Usuarios que terminaron y enviaron el quiz'
                }
            ],
            metricas: {
                totalVisitas,
                quizAbiertos,
                quizCompletados,
                quizAbandonados,
                tasaApertura: parseFloat(tasaApertura),
                tasaComplecion: parseFloat(tasaComplecion),
                tasaAbandonoGeneral: parseFloat(tasaAbandonoGeneral)
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

        // Obtener todas las visitas que respondieron este quiz
        const queryVisitas = `
            SELECT 
                v.id_visita,
                v.puntaje_quiz,
                v.respuestas_quiz,
                v.fecha_visita
            FROM visita v
            LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
            LEFT JOIN quizz q ON e.id_exhibicion = q.id_exhibicion
            WHERE q.id_quizz = $1 
            AND v.respuestas_quiz IS NOT NULL
            AND v.puntaje_quiz IS NOT NULL
        `;

        const visitas = await AppDataSource.query(queryVisitas, [id_quiz]);

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

        // Contar las respuestas de los usuarios
        visitas.forEach(visita => {
            if (visita.respuestas_quiz && Array.isArray(visita.respuestas_quiz)) {
                visita.respuestas_quiz.forEach(respuesta => {
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
        });

        return [{
            quiz: {
                id_quizz: quiz[0].id_quizz,
                cant_preguntas: quiz[0].cant_preguntas,
                exhibicion: quiz[0].exhibicion_nombre
            },
            total_participantes: visitas.length,
            analisis_preguntas: analisis
        }, null];

    } catch (error) {
        console.error("Error en getAnalisisQuizService:", error);
        return [null, "Error al obtener análisis del quiz"];
    }
}
