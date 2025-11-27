"use strict";

import * as RelatoService from "../services/exhibicion.service.js";

export const obtenerExhibicion = async (req, res) => {
    try {
        // El middleware ya validó que idExhibicion existe y no es vacío
        const idExhibicion = req.params.idExhibicion;
        
        const exhibicion = await RelatoService.obtenerExhibicionCompletaPorId(idExhibicion);

        if (exhibicion) {
            res.status(200).json(exhibicion); 
        } else {
            res.status(404).json({ message: "Exhibición no encontrada" });
        }
    } catch (error) {
        console.error("Error en el controlador al obtener relato:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const obtenerExhibicionPorNombre = async (req, res) => {
    try {
        const nombreExhibicion = req.params.nombre; 
        const exhibicion = await RelatoService.obtenerExhibicionPorNombre(nombreExhibicion);
        if (exhibicion) {
            res.status(200).json(exhibicion);
        } else {
            res.status(404).json({ message: "Exhibición no encontrada" });
        }
    } catch (error) {
        console.error("Error en el controlador al obtener relato por Nombre:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const actualizarExhibicion = async (req, res) => {
    try {
        const idExhibicion = req.params.idExhibicion;
        const datosBody = req.body;
        const exhibicionActualizada = await RelatoService.actualizarExhibicion(idExhibicion, datosBody);
        if (exhibicionActualizada) {
            res.status(200).json(exhibicionActualizada);
        } else {
            res.status(404).json({ message: "Exhibición no encontrada, no se pudo actualizar" });
        }
    } catch (error) {
        console.error("Error en el controlador al actualizar relato:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};