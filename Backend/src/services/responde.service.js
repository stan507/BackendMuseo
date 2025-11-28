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
