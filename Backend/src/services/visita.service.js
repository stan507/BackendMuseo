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
        };

        const visitaCreada = await visitaRepo.save(nuevaVisita);

        return [visitaCreada, null];
    } catch (error) {
        console.error("Error en createVisitaService:", error);
        return [null, "Error interno del servidor"];
    }
}
