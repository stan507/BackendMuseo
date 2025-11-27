"use strict";
import { getQuizzByIdService } from "../services/quizz.service.js";

export async function getQuizzById(req, res) {
    try {
        const { id } = req.params;

        const [quizz, error] = await getQuizzByIdService(id);

        if (error) {
            return res.status(404).json({
                message: error,
                data: null
            });
        }

        res.status(200).json(quizz);
    } catch (error) {
        console.error("Error en getQuizzById:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
