"use strict";
import { 
    generarVisitasCSVService, 
    generarQuizzesCSVService, 
    generarEstadisticasCSVService 
} from "../services/csv.service.js";

/**
 * GET /api/informe/csv/visitas - Exportar visitas a CSV
 */
export async function exportarVisitasCSV(req, res) {
    try {
        console.log('\n=== EXPORTAR CSV VISITAS ===');
        console.log('Query params:', req.query);
        const { desde, hasta, preset } = req.query;
        console.log('Rango de fechas:', { desde, hasta, preset });

        const [csv, error] = await generarVisitasCSVService(desde, hasta, preset);

        if (error) {
            console.error('Error al generar CSV visitas:', error);
            return res.status(500).json({ message: error });
        }

        console.log('CSV Visitas generado, tamaño:', csv.length, 'caracteres');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=visitas-${Date.now()}.csv`);
        res.send('\uFEFF' + csv); // BOM para UTF-8
    } catch (error) {
        console.error("Error en exportarVisitasCSV:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/informe/csv/quizzes - Exportar respuestas de quiz a CSV
 */
export async function exportarQuizzesCSV(req, res) {
    try {
        console.log('\n=== EXPORTAR CSV QUIZZES ===');
        console.log('Query params:', req.query);
        const { desde, hasta, preset } = req.query;
        console.log('Rango de fechas:', { desde, hasta, preset });

        const [csv, error] = await generarQuizzesCSVService(desde, hasta, preset);

        if (error) {
            console.error('Error al generar CSV quizzes:', error);
            return res.status(500).json({ message: error });
        }

        console.log('CSV Quizzes generado, tamaño:', csv.length, 'caracteres');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=quizzes-${Date.now()}.csv`);
        res.send('\uFEFF' + csv); // BOM para UTF-8
    } catch (error) {
        console.error("Error en exportarQuizzesCSV:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

/**
 * GET /api/informe/csv/estadisticas - Exportar estadísticas generales a CSV
 */
export async function exportarEstadisticasCSV(req, res) {
    try {
        const { desde, hasta, preset } = req.query;

        const [csv, error] = await generarEstadisticasCSVService(desde, hasta, preset);

        if (error) {
            return res.status(500).json({ message: error });
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=estadisticas-${Date.now()}.csv`);
        res.send('\uFEFF' + csv); // BOM para UTF-8
    } catch (error) {
        console.error("Error en exportarEstadisticasCSV:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
