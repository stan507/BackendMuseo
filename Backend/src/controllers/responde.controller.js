"use strict";
import { createRespondeService } from "../services/responde.service.js";

export async function createResponde(req, res) {
    try {
        const { id_usuario, id_quizz } = req.body;

        const [responde, error] = await createRespondeService(id_usuario, id_quizz);

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
