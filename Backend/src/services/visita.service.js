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

export async function updateDuracionVisitaService(id_visita, duracion_segundos) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);

        const visita = await visitaRepo.findOne({ where: { id_visita } });

        if (!visita) {
            return [null, "Visita no encontrada"];
        }

        visita.duracion_segundos = duracion_segundos;
        const visitaActualizada = await visitaRepo.save(visita);

        return [visitaActualizada, null];
    } catch (error) {
        console.error("Error en updateDuracionVisitaService:", error);
        return [null, "Error interno del servidor"];
    }
}
