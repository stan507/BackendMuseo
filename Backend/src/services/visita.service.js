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

/**
 * Obtener todas las visitas
 */
export async function getAllVisitasService() {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);
        
        const visitas = await visitaRepo.find({
            relations: ["usuario", "exhibicion"],
            order: { fecha_visita: "DESC" }
        });

        return [visitas, null];
    } catch (error) {
        console.error("Error en getAllVisitasService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener una visita por ID
 */
export async function getVisitaByIdService(id_visita) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);
        
        const visita = await visitaRepo.findOne({
            where: { id_visita },
            relations: ["usuario", "exhibicion"]
        });

        if (!visita) {
            return [null, "Visita no encontrada"];
        }

        return [visita, null];
    } catch (error) {
        console.error("Error en getVisitaByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener todas las visitas de una exhibición
 */
export async function getVisitasByExhibicionService(id_exhibicion) {
    try {
        const visitaRepo = AppDataSource.getRepository(Visita);
        
        const visitas = await visitaRepo.find({
            where: { id_exhibicion },
            relations: ["usuario", "exhibicion"],
            order: { fecha_visita: "DESC" }
        });

        return [visitas, null];
    } catch (error) {
        console.error("Error en getVisitasByExhibicionService:", error);
        return [null, "Error interno del servidor"];
    }
}
