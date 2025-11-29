"use strict";
import {
    createRespondeService,
    getAllRespondesService,
    getRespondesByQuizzService
} from "../services/responde.service.js";

export async function createResponde(req, res) {
    try {
        const { id_usuario, id_quizz, correctas, tiempo_segundos } = req.body;

        const [responde, error] = await createRespondeService(id_usuario, id_quizz, correctas, tiempo_segundos);

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(201).json({
            message: "Respuesta de quiz registrada exitosamente",
            data: {
                id_responder: responde.id_responder,
                id_usuario: responde.id_usuario,
                id_quizz: responde.id_quizz,
                correctas: responde.correctas,
                tiempo_segundos: responde.tiempo_segundos,
                fecha_responde: responde.fecha_responde
            }
        });
    } catch (error) {
        console.error("Error en createResponde:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

/**
 * GET /api/responde - Obtener todas las respuestas
 */
export async function getAllRespondes(req, res) {
    try {
        const [respuestas, error] = await getAllRespondesService();

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.status(200).json(respuestas);
    } catch (error) {
        console.error("Error en getAllRespondes:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/responde/quizz/:id_quizz - Obtener respuestas por quiz
 */
export async function getRespondesByQuizz(req, res) {
    try {
        const { id_quizz } = req.params;

        const [respuestas, error] = await getRespondesByQuizzService(parseInt(id_quizz));

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.status(200).json(respuestas);
    } catch (error) {
        console.error("Error en getRespondesByQuizz:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
