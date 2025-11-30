"use strict";
import { generarInformePDFService } from "../services/pdf.service.js";

/**
 * GET /api/informe/pdf - Generar PDF con estadísticas
 * Query params: desde, hasta, preset (dia|semana|mes|anio)
 */
export async function generarInformePDF(req, res) {
    try {
        const { desde, hasta, preset, quizzes } = req.query;
        
        // Convertir string de quizzes a array de números
        const quizzesIds = quizzes ? quizzes.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];

        const [pdfBuffer, error] = await generarInformePDFService(desde, hasta, preset, quizzesIds);

        if (error) {
            return res.status(500).json({ message: error });
        }

        // Enviar PDF como descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=informe-museo-${Date.now()}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error en generarInformePDF:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
