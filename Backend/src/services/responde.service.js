"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Responde } from "../entity/Responde.entity.js";

export async function createRespondeService(id_usuario, id_quizz, correctas, tiempo_segundos = null) {
    try {
        const respondeRepo = AppDataSource.getRepository(Responde);

        const nuevoResponde = {
            id_usuario: id_usuario,
            id_quizz: id_quizz,
            correctas: correctas,
            tiempo_segundos: tiempo_segundos
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
