"use strict";

import { AppDataSource } from "../config/configDb.js";
import { Exhibicion } from "../entity/Exhibicion.entity.js";

export async function obtenerExhibicionCompletaPorId(idExhibicion) {
    try {
        const exhibicionRepo = AppDataSource.getRepository(Exhibicion);
        const exhibicion = await exhibicionRepo.findOne({
            where: {
                id_exhibicion: idExhibicion,
            }
        });
        
        return exhibicion;

    } catch (error) {
        console.error("Error en el servicio al obtener la exhibicion por ID:", error);
        throw error; 
    }
}

export async function obtenerExhibicionPorNombre(nombre) {
    try {
        const exhibicionRepo = AppDataSource.getRepository(Exhibicion);
        
        
        const exhibicion = await exhibicionRepo.findOne({
            where: {
                nombre: nombre, 
            }
        });
        return exhibicion;

    } catch (error) {
        console.error("Error en el servicio al obtener exhibicion por Nombre:", error);
        throw error; 
    }
}


export async function actualizarExhibicion(idExhibicion, body) {
    try {
        const exhibicionRepo = AppDataSource.getRepository(Exhibicion);
        
        const exhibicionFound = await exhibicionRepo.findOne({
            where: { id_exhibicion: idExhibicion }
        });

        if (!exhibicionFound) {
            return null; 
        }


        const datosUpdate = {};
        if (body.nombre) {
            datosUpdate.nombre = body.nombre;
        }
        if (body.relato_escrito) {
            datosUpdate.relato_escrito = body.relato_escrito;
        }

        await exhibicionRepo.update({ id_exhibicion: idExhibicion }, datosUpdate);

        const updatedExhibicion = await exhibicionRepo.findOne({
            where: { id_exhibicion: idExhibicion }
        });

        return updatedExhibicion;

    } catch (error) {
        console.error("Error en el servicio al actualizar exhibicion:", error);
        throw error; 
    }
}