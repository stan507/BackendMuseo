"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Informe } from "../entity/Informe.entity.js";

/**
 * Obtener todos los informes
 */
export async function getAllInformesService() {
    try {
        const informeRepo = AppDataSource.getRepository(Informe);
        
        const informes = await informeRepo.find({
            relations: ["usuario"],
            order: { fecha: "DESC" }
        });

        return [informes, null];
    } catch (error) {
        console.error("Error en getAllInformesService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Obtener un informe por ID
 */
export async function getInformeByIdService(id_informe) {
    try {
        const informeRepo = AppDataSource.getRepository(Informe);
        
        const informe = await informeRepo.findOne({
            where: { id_informe },
            relations: ["usuario"]
        });

        if (!informe) {
            return [null, "Informe no encontrado"];
        }

        return [informe, null];
    } catch (error) {
        console.error("Error en getInformeByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Crear un nuevo informe
 */
export async function createInformeService(id_usuario, descripcion) {
    try {
        const informeRepo = AppDataSource.getRepository(Informe);

        const nuevoInforme = {
            id_usuario,
            descripcion
            // fecha se genera automáticamente con CURRENT_TIMESTAMP
        };

        const informeCreado = await informeRepo.save(nuevoInforme);

        // Cargar relaciones para devolver informe completo
        const informeCompleto = await informeRepo.findOne({
            where: { id_informe: informeCreado.id_informe },
            relations: ["usuario"]
        });

        return [informeCompleto, null];
    } catch (error) {
        console.error("Error en createInformeService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Actualizar un informe existente
 */
export async function updateInformeService(id_informe, descripcion) {
    try {
        const informeRepo = AppDataSource.getRepository(Informe);

        const informe = await informeRepo.findOne({ where: { id_informe } });

        if (!informe) {
            return [null, "Informe no encontrado"];
        }

        informe.descripcion = descripcion;
        const informeActualizado = await informeRepo.save(informe);

        // Cargar relaciones
        const informeCompleto = await informeRepo.findOne({
            where: { id_informe: informeActualizado.id_informe },
            relations: ["usuario"]
        });

        return [informeCompleto, null];
    } catch (error) {
        console.error("Error en updateInformeService:", error);
        return [null, "Error interno del servidor"];
    }
}

/**
 * Eliminar un informe
 */
export async function deleteInformeService(id_informe) {
    try {
        const informeRepo = AppDataSource.getRepository(Informe);

        const informe = await informeRepo.findOne({ where: { id_informe } });

        if (!informe) {
            return [null, "Informe no encontrado"];
        }

        await informeRepo.remove(informe);

        return [{ message: "Informe eliminado exitosamente" }, null];
    } catch (error) {
        console.error("Error en deleteInformeService:", error);
        return [null, "Error interno del servidor"];
    }
}
