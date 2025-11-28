"use strict";
import { createVisitaService, updateDuracionVisitaService } from "../services/visita.service.js";

export async function createVisita(req, res) {
    try {
        const { id_usuario, id_exhibicion } = req.body;

        const [visita, error] = await createVisitaService(id_usuario, id_exhibicion);

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(201).json({
            message: "Visita registrada exitosamente",
            data: {
                id_visita: visita.id_visita,
                id_usuario: visita.id_usuario,
                id_exhibicion: visita.id_exhibicion,
                fecha_visita: visita.fecha_visita,
                duracion_segundos: visita.duracion_segundos
            }
        });
    } catch (error) {
        console.error("Error en createVisita:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

export async function updateDuracionVisita(req, res) {
    try {
        const { id } = req.params;
        const { duracion_segundos } = req.body;

        const [visita, error] = await updateDuracionVisitaService(parseInt(id), duracion_segundos);

        if (error) {
            const statusCode = error === "Visita no encontrada" ? 404 : 500;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Duración de visita actualizada exitosamente",
            data: {
                id_visita: visita.id_visita,
                duracion_segundos: visita.duracion_segundos
            }
        });
    } catch (error) {
        console.error("Error en updateDuracionVisita:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
