"use strict";
import { generarInformePDFService } from "../services/pdf.service.js";

/**
 * GET /api/informe/pdf - Generar PDF con estadísticas
 * Query params: desde, hasta, preset (dia|semana|mes|anio)
 */
export async function generarInformePDF(req, res) {
    try {
        console.log('\n=== GENERAR PDF ===');
        console.log('Query params:', req.query);
        const { desde, hasta, preset, quizzes } = req.query;
        const userId = req.user?.id_usuario; // Usuario autenticado
        console.log('Usuario ID:', userId);
        
        // Convertir string de quizzes a array de números
        const quizzesIds = quizzes ? quizzes.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        console.log('Quizzes IDs:', quizzesIds);
        console.log('Rango de fechas:', { desde, hasta, preset });

        const [pdfBuffer, error] = await generarInformePDFService(desde, hasta, preset, quizzesIds, userId);

        if (error) {
            console.error('Error al generar PDF:', error);
            return res.status(500).json({ message: error });
        }

        console.log('PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
        // Enviar PDF como descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=informe-museo-${Date.now()}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error en generarInformePDF:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
