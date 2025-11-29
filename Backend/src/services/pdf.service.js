"use strict";
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { AppDataSource } from "../config/configDb.js";
import { Visita } from "../entity/Visita.entity.js";
import { Responde } from "../entity/Responde.entity.js";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

/**
 * Calcular rango de fechas según preset o personalizado
 */
function calcularRangoFechas(desde, hasta, preset) {
    const ahora = new Date();
    let fechaInicio, fechaFin;

    if (preset) {
        fechaFin = ahora;
        switch (preset) {
            case "dia":
                fechaInicio = new Date(ahora);
                fechaInicio.setHours(0, 0, 0, 0);
                break;
            case "semana":
                fechaInicio = new Date(ahora);
                fechaInicio.setDate(ahora.getDate() - 7);
                break;
            case "mes":
                fechaInicio = new Date(ahora);
                fechaInicio.setMonth(ahora.getMonth() - 1);
                break;
            case "anio":
                fechaInicio = new Date(ahora);
                fechaInicio.setFullYear(ahora.getFullYear() - 1);
                break;
            default:
                fechaInicio = new Date(ahora);
                fechaInicio.setMonth(ahora.getMonth() - 1);
        }
    } else {
        fechaInicio = desde ? new Date(desde) : new Date(ahora.setMonth(ahora.getMonth() - 1));
        fechaFin = hasta ? new Date(hasta) : new Date();
    }

    return { fechaInicio, fechaFin };
}

/**
 * Obtener estadísticas de visitas
 */
async function obtenerEstadisticasVisitas(fechaInicio, fechaFin) {
    const visitaRepo = AppDataSource.getRepository(Visita);

    const visitas = await visitaRepo.find({
        where: {
            fecha_visita: Between(fechaInicio, fechaFin)
        },
        relations: ["exhibicion"]
    });

    // Total de visitas
    const totalVisitas = visitas.length;

    // Visitas por exhibición
    const visitasPorExhibicion = {};
    const duracionPorExhibicion = {};
    
    visitas.forEach(v => {
        const id_exhibicion = v.id_exhibicion;
        visitasPorExhibicion[id_exhibicion] = (visitasPorExhibicion[id_exhibicion] || 0) + 1;
        
        if (v.duracion_segundos) {
            if (!duracionPorExhibicion[id_exhibicion]) {
                duracionPorExhibicion[id_exhibicion] = [];
            }
            duracionPorExhibicion[id_exhibicion].push(v.duracion_segundos);
        }
    });

    // Calcular promedios de duración
    const promediosPorExhibicion = {};
    Object.keys(duracionPorExhibicion).forEach(id => {
        const duraciones = duracionPorExhibicion[id];
        const promedio = duraciones.reduce((a, b) => a + b, 0) / duraciones.length;
        promediosPorExhibicion[id] = Math.round(promedio);
    });

    // Exhibición más/menos visitada
    const exhibiciones = Object.entries(visitasPorExhibicion).sort((a, b) => b[1] - a[1]);
    const masVisitada = exhibiciones[0] || ["N/A", 0];
    const menosVisitada = exhibiciones[exhibiciones.length - 1] || ["N/A", 0];

    // Visitantes únicos
    const visitantesUnicos = new Set(visitas.map(v => v.id_usuario)).size;

    return {
        totalVisitas,
        visitasPorExhibicion,
        promediosPorExhibicion,
        masVisitada: { nombre: masVisitada[0], cantidad: masVisitada[1] },
        menosVisitada: { nombre: menosVisitada[0], cantidad: menosVisitada[1] },
        visitantesUnicos
    };
}

/**
 * Obtener estadísticas de quizzes
 */
async function obtenerEstadisticasQuizzes(fechaInicio, fechaFin) {
    const respondeRepo = AppDataSource.getRepository(Responde);

    const respuestas = await respondeRepo.find({
        where: {
            fecha_responde: Between(fechaInicio, fechaFin)
        },
        relations: ["quizz"]
    });

    // Total respondidos
    const totalRespondidos = respuestas.length;

    // Promedio de correctas por quiz
    const correctasPorQuizz = {};
    const tiemposPorQuizz = {};

    respuestas.forEach(r => {
        const id_quizz = r.id_quizz;
        
        if (!correctasPorQuizz[id_quizz]) {
            correctasPorQuizz[id_quizz] = [];
        }
        correctasPorQuizz[id_quizz].push(r.correctas);

        if (r.tiempo_segundos) {
            if (!tiemposPorQuizz[id_quizz]) {
                tiemposPorQuizz[id_quizz] = [];
            }
            tiemposPorQuizz[id_quizz].push(r.tiempo_segundos);
        }
    });

    // Calcular promedios
    const promedioCorrectasPorQuizz = {};
    const promedioTiempoPorQuizz = {};

    Object.keys(correctasPorQuizz).forEach(id => {
        const correctas = correctasPorQuizz[id];
        promedioCorrectasPorQuizz[id] = (correctas.reduce((a, b) => a + b, 0) / correctas.length).toFixed(1);
    });

    Object.keys(tiemposPorQuizz).forEach(id => {
        const tiempos = tiemposPorQuizz[id];
        promedioTiempoPorQuizz[id] = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
    });

    // Mejor/peor quiz
    const quizzes = Object.entries(promedioCorrectasPorQuizz).sort((a, b) => b[1] - a[1]);
    const mejorQuizz = quizzes[0] || ["N/A", 0];
    const peorQuizz = quizzes[quizzes.length - 1] || ["N/A", 0];

    return {
        totalRespondidos,
        promedioCorrectasPorQuizz,
        promedioTiempoPorQuizz,
        mejorQuizz: { id: mejorQuizz[0], promedio: mejorQuizz[1] },
        peorQuizz: { id: peorQuizz[0], promedio: peorQuizz[1] }
    };
}

/**
 * Generar gráfico de barras
 */
async function generarGraficoBarras(datos, titulo) {
    const width = 600;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const labels = Object.keys(datos);
    const values = Object.values(datos);

    const configuration = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return buffer;
}

/**
 * Generar PDF del informe
 */
export async function generarInformePDFService(desde, hasta, preset) {
    try {
        const { fechaInicio, fechaFin } = calcularRangoFechas(desde, hasta, preset);

        // Obtener estadísticas
        const statsVisitas = await obtenerEstadisticasVisitas(fechaInicio, fechaFin);
        const statsQuizzes = await obtenerEstadisticasQuizzes(fechaInicio, fechaFin);

        // Crear PDF
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // Encabezado
        doc.fontSize(20).text('Informe Museo - Estadísticas', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`, { align: 'center' });
        doc.text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Sección Visitas
        doc.fontSize(16).text('ESTADISTICAS DE VISITAS', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total de visitas: ${statsVisitas.totalVisitas}`);
        doc.text(`Visitantes únicos: ${statsVisitas.visitantesUnicos}`);
        doc.text(`Exhibición más visitada: ${statsVisitas.masVisitada.nombre} (${statsVisitas.masVisitada.cantidad} visitas)`);
        doc.text(`Exhibición menos visitada: ${statsVisitas.menosVisitada.nombre} (${statsVisitas.menosVisitada.cantidad} visitas)`);
        doc.moveDown();

        // Visitas por exhibición
        doc.text('Visitas por exhibición:');
        Object.entries(statsVisitas.visitasPorExhibicion).forEach(([exhibicion, cantidad]) => {
            const promedio = statsVisitas.promediosPorExhibicion[exhibicion] || 0;
            doc.text(`  • ${exhibicion}: ${cantidad} visitas (promedio ${promedio}s)`);
        });
        doc.moveDown(2);

        // Gráfico de visitas
        const graficoVisitas = await generarGraficoBarras(statsVisitas.visitasPorExhibicion, 'Visitas por Exhibición');
        doc.image(graficoVisitas, { width: 500 });
        doc.addPage();

        // Sección Quizzes
        doc.fontSize(16).text('ESTADISTICAS DE QUIZZES', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total de quizzes respondidos: ${statsQuizzes.totalRespondidos}`);
        doc.text(`Mejor desempeño: Quiz ${statsQuizzes.mejorQuizz.id} (${statsQuizzes.mejorQuizz.promedio} correctas promedio)`);
        doc.text(`Menor desempeño: Quiz ${statsQuizzes.peorQuizz.id} (${statsQuizzes.peorQuizz.promedio} correctas promedio)`);
        doc.moveDown();

        // Resultados por quiz
        doc.text('Promedio de respuestas correctas por quiz:');
        Object.entries(statsQuizzes.promedioCorrectasPorQuizz).forEach(([quiz, promedio]) => {
            const tiempo = statsQuizzes.promedioTiempoPorQuizz[quiz] || 0;
            doc.text(`  • Quiz ${quiz}: ${promedio} correctas (${tiempo}s promedio)`);
        });
        doc.moveDown(2);

        // Gráfico de quizzes
        const graficoQuizzes = await generarGraficoBarras(statsQuizzes.promedioCorrectasPorQuizz, 'Promedio Correctas por Quiz');
        doc.image(graficoQuizzes, { width: 500 });

        // Finalizar PDF
        doc.end();

        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve([pdfBuffer, null]);
            });
            doc.on('error', (err) => {
                reject([null, "Error generando PDF"]);
            });
        });

    } catch (error) {
        console.error("Error en generarInformePDFService:", error);
        return [null, "Error interno del servidor"];
    }
}
