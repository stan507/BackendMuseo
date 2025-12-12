"use strict";
import {
    getQuizzByIdService,
    getAllQuizzesService,
    getQuizzByExhibicionService,
    createQuizzService,
    updateQuizzService,
    deleteQuizzService,
    activarQuizzService
} from "../services/quizz.service.js";
export async function getAllQuizzes(req, res) {
    try {
        const [quizzes, error] = await getAllQuizzesService();

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Quizzes obtenidos exitosamente",
            data: quizzes
        });
    } catch (error) {
        console.error("Error en getAllQuizzes:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
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
export async function getQuizzByExhibicion(req, res) {
    try {
        const { id_exhibicion } = req.params;

        const [quizzes, error] = await getQuizzByExhibicionService(id_exhibicion);

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Quizzes obtenidos exitosamente",
            data: quizzes
        });
    } catch (error) {
        console.error("Error en getQuizzByExhibicion:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
export async function createQuizz(req, res) {
    try {
        const { id_usuario, id_exhibicion, titulo, preguntas } = req.body;

        const [quizz, error] = await createQuizzService(id_usuario, id_exhibicion, titulo, preguntas);

        if (error) {
            return res.status(400).json({
                message: error,
                data: null
            });
        }

        res.status(201).json({
            message: "Quiz creado exitosamente",
            data: quizz[0]
        });
    } catch (error) {
        console.error("Error en createQuizz:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            message: "Error al crear el quiz: " + error.message,
            data: null
        });
    }
}
export async function updateQuizz(req, res) {
    try {
        const { id } = req.params;
        const { id_exhibicion, titulo, preguntas } = req.body;

        const [quizz, error] = await updateQuizzService(parseInt(id), id_exhibicion, titulo, preguntas);

        if (error) {
            const statusCode = error === "Quiz no encontrado" ? 404 : 500;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Quiz actualizado exitosamente",
            data: quizz[0]
        });
    } catch (error) {
        console.error("Error en updateQuizz:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
export async function deleteQuizz(req, res) {
    try {
        const { id } = req.params;

        const [result, error] = await deleteQuizzService(parseInt(id));

        if (error) {
            const statusCode = error === "Quiz no encontrado" ? 404 : 400;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: result.message,
            data: null
        });
    } catch (error) {
        console.error("Error en deleteQuizz:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

// Activar quiz (desactiva los demás de la misma exhibición)
export async function activarQuizz(req, res) {
    try {
        const { id } = req.params;

        const [result, error] = await activarQuizzService(parseInt(id));

        if (error) {
            const statusCode = error === "Quiz no encontrado" ? 404 : 400;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Quiz activado exitosamente",
            data: result
        });
    } catch (error) {
        console.error("Error en activarQuizz:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
