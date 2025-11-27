"use strict";
import { createVisitaService } from "../services/visita.service.js";

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
                fecha_visita: visita.fecha_visita
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
