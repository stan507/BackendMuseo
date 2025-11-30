"use strict";
import {
    createVisitaService,
    updateDuracionVisitaService,
    getAllVisitasService,
    getVisitaByIdService,
    getVisitasByExhibicionService,
    getEstadisticasService,
    getAnalisisQuizService,
    updateQuizEstadoService
} from "../services/visita.service.js";

export async function createVisita(req, res) {
    try {
        const { id_usuario, id_exhibicion } = req.body;

        const [visita, error] = await createVisitaService(id_usuario, id_exhibicion);

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(201).json({
            message: "Visita registrada exitosamente",
            data: {
                id_visita: visita.id_visita,
                id_usuario: visita.id_usuario,
                id_exhibicion: visita.id_exhibicion,
                fecha_visita: visita.fecha_visita,
                duracion_segundos: visita.duracion_segundos
            }
        });
    } catch (error) {
        console.error("Error en createVisita:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

export async function updateDuracionVisita(req, res) {
    try {
        const { id } = req.params;
        const { duracion_segundos, puntaje_quiz, respuestas_quiz } = req.body;

        const [visita, error] = await updateDuracionVisitaService(
            parseInt(id), 
            duracion_segundos,
            puntaje_quiz,
            respuestas_quiz
        );

        if (error) {
            const statusCode = error === "Visita no encontrada" ? 404 : 500;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Visita actualizada exitosamente",
            data: {
                id_visita: visita.id_visita,
                duracion_segundos: visita.duracion_segundos,
                puntaje_quiz: visita.puntaje_quiz,
                respuestas_guardadas: visita.respuestas_quiz ? visita.respuestas_quiz.length : 0
            }
        });
    } catch (error) {
        console.error("Error en updateDuracionVisita:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

/**
 * GET /api/visita - Obtener todas las visitas
 */
export async function getAllVisitas(req, res) {
    try {
        const [visitas, error] = await getAllVisitasService();

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.status(200).json(visitas);
    } catch (error) {
        console.error("Error en getAllVisitas:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/visita/:id - Obtener una visita por ID
 */
export async function getVisitaById(req, res) {
    try {
        const { id } = req.params;

        const [visita, error] = await getVisitaByIdService(parseInt(id));

        if (error) {
            return res.status(404).json({ message: error });
        }

        res.status(200).json(visita);
    } catch (error) {
        console.error("Error en getVisitaById:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/visita/exhibicion/:id_exhibicion - Obtener visitas por exhibición
 */
export async function getVisitasByExhibicion(req, res) {
    try {
        const { id_exhibicion } = req.params;

        const [visitas, error] = await getVisitasByExhibicionService(id_exhibicion);

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.status(200).json(visitas);
    } catch (error) {
        console.error("Error en getVisitasByExhibicion:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/visita/estadisticas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Obtener estadísticas de visitas y quizzes
 */
export async function getEstadisticas(req, res) {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({ 
                message: "Los parámetros 'desde' y 'hasta' son requeridos" 
            });
        }

        const [estadisticas, error] = await getEstadisticasService(desde, hasta);

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.status(200).json({
            message: "Estadísticas obtenidas exitosamente",
            data: estadisticas
        });
    } catch (error) {
        console.error("Error en getEstadisticas:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/visita/analisis-quiz/:id
 * Obtener análisis detallado de un quiz con porcentajes por respuesta
 */
export async function getAnalisisQuiz(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ 
                message: "El ID del quiz es requerido" 
            });
        }

        const [analisis, error] = await getAnalisisQuizService(parseInt(id));

        if (error) {
            const statusCode = error === "Quiz no encontrado" ? 404 : 500;
            return res.status(statusCode).json({ message: error });
        }

        res.status(200).json({
            message: "Análisis del quiz obtenido exitosamente",
            data: analisis
        });
    } catch (error) {
        console.error("Error en getAnalisisQuiz:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * PATCH /api/visita/:id/quiz-estado - Actualizar estado del quiz (iniciado/abandonado)
 */
export async function updateQuizEstado(req, res) {
    try {
        const { id } = req.params;
        const { quiz_iniciado } = req.body;

        if (quiz_iniciado === undefined) {
            return res.status(400).json({ 
                message: "El campo quiz_iniciado es requerido" 
            });
        }

        const [visita, error] = await updateQuizEstadoService(parseInt(id), quiz_iniciado);

        if (error) {
            const statusCode = error === "Visita no encontrada" ? 404 : 500;
            return res.status(statusCode).json({ message: error });
        }

        res.status(200).json({
            message: "Estado del quiz actualizado exitosamente",
            data: visita
        });
    } catch (error) {
        console.error("Error en updateQuizEstado:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
