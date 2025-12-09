"use strict";
import { AppDataSource } from "../config/configDb.js";

/**
 * Calcular rango de fechas basado en preset o fechas personalizadas
 */
function calcularRangoFechas(desde, hasta, preset) {
    let fechaInicio, fechaFin;

    if (preset) {
        fechaFin = new Date();
        fechaInicio = new Date();

        switch (preset) {
            case 'dia':
                fechaInicio.setDate(fechaFin.getDate() - 1);
                break;
            case 'semana':
                fechaInicio.setDate(fechaFin.getDate() - 7);
                break;
            case 'mes':
                fechaInicio.setMonth(fechaFin.getMonth() - 1);
                break;
            case 'anio':
                fechaInicio.setFullYear(fechaFin.getFullYear() - 1);
                break;
            default:
                fechaInicio.setMonth(fechaFin.getMonth() - 1);
        }
    } else {
        fechaInicio = desde ? new Date(desde) : new Date();
        fechaFin = hasta ? new Date(hasta) : new Date();
    }

    return { fechaInicio, fechaFin };
}

/**
 * Generar CSV con estadísticas de visitas
 */
export async function generarVisitasCSVService(desde, hasta, preset) {
    try {
        console.log('[CSV Service] Generando CSV de visitas...');
        const { fechaInicio, fechaFin } = calcularRangoFechas(desde, hasta, preset);
        console.log('[CSV Service] Fechas:', fechaInicio.toISOString(), '-', fechaFin.toISOString());
        const desdeStr = fechaInicio.toISOString().split('T')[0];
        const hastaStr = fechaFin.toISOString().split('T')[0];

        const query = `
            SELECT 
                v.id_visita,
                v.fecha_visita,
                v.duracion_segundos,
                v.id_exhibicion,
                e.nombre as exhibicion_nombre,
                u.nombre as usuario_nombre,
                u.apellido as usuario_apellido,
                u.correo as usuario_correo
            FROM visita v
            LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE v.fecha_visita >= $1 AND v.fecha_visita <= $2
            ORDER BY v.fecha_visita DESC
        `;

        const visitas = await AppDataSource.query(query, [desdeStr, hastaStr + ' 23:59:59']);
        console.log('[CSV Service] Visitas encontradas:', visitas.length);

        // Generar CSV
        let csv = 'ID Visita,Fecha Visita,Duracion (segundos),Exhibicion,Usuario Nombre,Usuario Apellido,Usuario Correo\n';
        
        visitas.forEach(v => {
            const fecha = new Date(v.fecha_visita).toLocaleString();
            const duracion = v.duracion_segundos || 0;
            const exhibicion = v.exhibicion_nombre || 'Sin exhibicion';
            const nombre = v.usuario_nombre || 'Anonimo';
            const apellido = v.usuario_apellido || '';
            const correo = v.usuario_correo || '';
            
            csv += `"${v.id_visita}","${fecha}","${duracion}","${exhibicion}","${nombre}","${apellido}","${correo}"\n`;
        });

        return [csv, null];
    } catch (error) {
        console.error("Error en generarVisitasCSVService:", error);
        return [null, "Error generando CSV de visitas"];
    }
}

/**
 * Generar CSV con estadísticas de respuestas de quiz
 */
export async function generarQuizzesCSVService(desde, hasta, preset) {
    try {
        console.log('[CSV Service] Generando CSV de quizzes...');
        const { fechaInicio, fechaFin } = calcularRangoFechas(desde, hasta, preset);
        console.log('[CSV Service] Fechas:', fechaInicio.toISOString(), '-', fechaFin.toISOString());
        const desdeStr = fechaInicio.toISOString().split('T')[0];
        const hastaStr = fechaFin.toISOString().split('T')[0];

        const query = `
            SELECT 
                r.id_responde,
                r.fecha_responde,
                r.correctas,
                r.tiempo_segundos,
                q.titulo as quiz_titulo,
                q.cant_preguntas,
                q.id_exhibicion,
                e.nombre as exhibicion_nombre,
                u.nombre as usuario_nombre,
                u.apellido as usuario_apellido,
                u.correo as usuario_correo
            FROM responde r
            LEFT JOIN quizz q ON r.id_quizz = q.id_quizz
            LEFT JOIN exhibicion e ON q.id_exhibicion = e.id_exhibicion
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            WHERE r.fecha_responde >= $1 AND r.fecha_responde <= $2
            ORDER BY r.fecha_responde DESC
        `;

        const respuestas = await AppDataSource.query(query, [desdeStr, hastaStr + ' 23:59:59']);
        console.log('[CSV Service] Respuestas encontradas:', respuestas.length);

        // Generar CSV
        let csv = 'ID Respuesta,Fecha,Quiz,Exhibicion,Correctas,Total Preguntas,Porcentaje,Tiempo (segundos),Usuario Nombre,Usuario Apellido,Usuario Correo\n';
        
        respuestas.forEach(r => {
            const fecha = new Date(r.fecha_responde).toLocaleString();
            const quiz = r.quiz_titulo || 'Quiz desconocido';
            const exhibicion = r.exhibicion_nombre || 'Sin exhibicion';
            const correctas = r.correctas || 0;
            const total = r.cant_preguntas || 0;
            const porcentaje = total > 0 ? ((correctas / total) * 100).toFixed(1) : '0';
            const tiempo = r.tiempo_segundos || 0;
            const nombre = r.usuario_nombre || 'Anonimo';
            const apellido = r.usuario_apellido || '';
            const correo = r.usuario_correo || '';
            
            csv += `"${r.id_responde}","${fecha}","${quiz}","${exhibicion}","${correctas}","${total}","${porcentaje}%","${tiempo}","${nombre}","${apellido}","${correo}"\n`;
        });

        return [csv, null];
    } catch (error) {
        console.error("Error en generarQuizzesCSVService:", error);
        return [null, "Error generando CSV de quizzes"];
    }
}

/**
 * Generar CSV completo con todas las estadísticas
 */
export async function generarEstadisticasCSVService(desde, hasta, preset) {
    try {
        const { fechaInicio, fechaFin } = calcularRangoFechas(desde, hasta, preset);
        const desdeStr = fechaInicio.toISOString().split('T')[0];
        const hastaStr = fechaFin.toISOString().split('T')[0];

        // Estadísticas generales
        const queryVisitas = `SELECT COUNT(*) as total FROM visita WHERE fecha_visita >= $1 AND fecha_visita <= $2`;
        const queryRespuestas = `SELECT COUNT(*) as total FROM responde WHERE fecha_responde >= $1 AND fecha_responde <= $2`;
        
        const [visitasCount] = await AppDataSource.query(queryVisitas, [desdeStr, hastaStr + ' 23:59:59']);
        const [respuestasCount] = await AppDataSource.query(queryRespuestas, [desdeStr, hastaStr + ' 23:59:59']);

        // Visitas por exhibición
        const queryExhibiciones = `
            SELECT 
                e.nombre,
                COUNT(v.id_visita) as cantidad
            FROM visita v
            LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
            WHERE v.fecha_visita >= $1 AND v.fecha_visita <= $2
            GROUP BY e.nombre
            ORDER BY cantidad DESC
        `;
        const exhibiciones = await AppDataSource.query(queryExhibiciones, [desdeStr, hastaStr + ' 23:59:59']);

        // Generar CSV con resumen
        let csv = '=== ESTADISTICAS GENERALES ===\n';
        csv += `Periodo,${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}\n`;
        csv += `Total Visitas,${visitasCount.total}\n`;
        csv += `Total Quizzes Completados,${respuestasCount.total}\n`;
        csv += '\n';
        
        csv += '=== VISITAS POR EXHIBICION ===\n';
        csv += 'Exhibicion,Cantidad,Porcentaje\n';
        exhibiciones.forEach(e => {
            const porcentaje = visitasCount.total > 0 ? ((e.cantidad / visitasCount.total) * 100).toFixed(1) : '0';
            csv += `"${e.nombre || 'Sin exhibicion'}","${e.cantidad}","${porcentaje}%"\n`;
        });

        return [csv, null];
    } catch (error) {
        console.error("Error en generarEstadisticasCSVService:", error);
        return [null, "Error generando CSV de estadísticas"];
    }
}
