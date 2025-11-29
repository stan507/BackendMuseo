"use strict";
import {
    getAllInformesService,
    getInformeByIdService,
    createInformeService,
    updateInformeService,
    deleteInformeService
} from "../services/informe.service.js";

/**
 * GET /api/informe - Obtener todos los informes
 */
export async function getAllInformes(req, res) {
    try {
        const [informes, error] = await getAllInformesService();

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.status(200).json(informes);
    } catch (error) {
        console.error("Error en getAllInformes:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/informe/:id - Obtener un informe por ID
 */
export async function getInformeById(req, res) {
    try {
        const { id } = req.params;

        const [informe, error] = await getInformeByIdService(parseInt(id));

        if (error) {
            return res.status(404).json({ message: error });
        }

        res.status(200).json(informe);
    } catch (error) {
        console.error("Error en getInformeById:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * POST /api/informe - Crear un nuevo informe
 */
export async function createInforme(req, res) {
    try {
        const { id_usuario, descripcion } = req.body;

        const [informe, error] = await createInformeService(id_usuario, descripcion);

        if (error) {
            return res.status(400).json({ message: error });
        }

        res.status(201).json(informe);
    } catch (error) {
        console.error("Error en createInforme:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * PUT /api/informe/:id - Actualizar un informe
 */
export async function updateInforme(req, res) {
    try {
        const { id } = req.params;
        const { descripcion } = req.body;

        const [informe, error] = await updateInformeService(parseInt(id), descripcion);

        if (error) {
            return res.status(404).json({ message: error });
        }

        res.status(200).json(informe);
    } catch (error) {
        console.error("Error en updateInforme:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * DELETE /api/informe/:id - Eliminar un informe
 */
export async function deleteInforme(req, res) {
    try {
        const { id } = req.params;

        const [result, error] = await deleteInformeService(parseInt(id));

        if (error) {
            return res.status(404).json({ message: error });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error en deleteInforme:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
