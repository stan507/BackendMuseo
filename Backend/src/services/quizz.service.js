"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Quizz } from "../entity/Quizz.entity.js";
import { Pregunta } from "../entity/Pregunta.entity.js";
import { Respuesta } from "../entity/Respuesta.entity.js";

export async function getQuizzByIdService(id) {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const preguntaRepo = AppDataSource.getRepository(Pregunta);
        const respuestaRepo = AppDataSource.getRepository(Respuesta);

        // Obtener el quiz
        const quizz = await quizzRepo.findOne({
            where: { id_quizz: parseInt(id) }
        });

        if (!quizz) {
            return [null, "Quiz no encontrado"];
        }

        // Obtener preguntas del quiz
        const preguntas = await preguntaRepo.find({
            where: { id_quizz: quizz.id_quizz }
        });

        // Para cada pregunta, obtener sus respuestas
        const preguntasConRespuestas = await Promise.all(
            preguntas.map(async (pregunta) => {
                const respuestas = await respuestaRepo.find({
                    where: { id_pregunta: pregunta.id_pregunta }
                });

                return {
                    id_pregunta: pregunta.id_pregunta,
                    titulo: pregunta.titulo,
                    texto: pregunta.texto,
                    respuestas: respuestas.map(r => ({
                        id_respuesta: r.id_respuesta,
                        texto: r.texto,
                        es_correcta: r.es_correcta
                    }))
                };
            })
        );

        // Construir respuesta completa
        const quizzCompleto = {
            id_quizz: quizz.id_quizz,
            id_usuario: quizz.id_usuario,
            titulo: quizz.titulo,
            cant_preguntas: quizz.cant_preguntas,
            fecha_creacion: quizz.fecha_creacion,
            preguntas: preguntasConRespuestas
        };

        return [quizzCompleto, null];
    } catch (error) {
        console.error("Error en getQuizzByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}
