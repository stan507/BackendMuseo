"use strict";
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { AppDataSource } from "../config/configDb.js";
import { Visita } from "../entity/Visita.entity.js";
import { Responde } from "../entity/Responde.entity.js";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { getAnalisisQuizService } from "./visita.service.js";

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
 * Obtener estadísticas modernas usando la nueva estructura de visitas
 */
async function obtenerEstadisticasModernas(fechaInicio, fechaFin) {
    const desde = fechaInicio.toISOString().split('T')[0];
    const hasta = fechaFin.toISOString().split('T')[0];

    const query = `
        SELECT 
            v.id_visita,
            v.fecha_visita,
            v.duracion_segundos,
            v.id_exhibicion,
            e.nombre as exhibicion_nombre,
            COALESCE(v.puntaje_quiz, 0) as puntaje_quiz,
            COALESCE(q.cant_preguntas, 0) as preguntas_totales,
            v.respuestas_quiz
        FROM visita v
        LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
        LEFT JOIN quizz q ON v.id_exhibicion = q.id_exhibicion AND q.es_activo = true
        WHERE v.fecha_visita >= $1 AND v.fecha_visita <= $2
        ORDER BY v.fecha_visita DESC
    `;

    const visitas = await AppDataSource.query(query, [desde, hasta + ' 23:59:59']);

    const totalVisitas = visitas.length;
    const visitasConQuiz = visitas.filter(v => v.puntaje_quiz !== null && v.puntaje_quiz > 0).length;
    
    // Visitas por exhibición
    const visitasPorExhibicion = {};
    visitas.forEach(v => {
        const nombre = v.exhibicion_nombre || 'Sin Exhibición';
        visitasPorExhibicion[nombre] = (visitasPorExhibicion[nombre] || 0) + 1;
    });

    // Distribución de puntajes
    const distribucionPuntajes = {};
    visitas.forEach(v => {
        if (v.puntaje_quiz !== null && v.puntaje_quiz > 0 && v.preguntas_totales > 0) {
            const key = `${v.puntaje_quiz}/${v.preguntas_totales}`;
            distribucionPuntajes[key] = (distribucionPuntajes[key] || 0) + 1;
        }
    });

    // Análisis de rangos horarios
    const visitasPorHora = {};
    visitas.forEach(v => {
        const hora = new Date(v.fecha_visita).getHours();
        visitasPorHora[hora] = (visitasPorHora[hora] || 0) + 1;
    });

    // Encontrar rango horario pico
    let maxVisitas = 0;
    let rangoHorarioPico = { inicio: 0, fin: 0, visitas: 0, descripcion: 'N/A' };
    
    for (let ventana = 1; ventana <= 3; ventana++) {
        for (let horaInicio = 0; horaInicio <= 23 - ventana; horaInicio++) {
            let visitasEnVentana = 0;
            for (let i = 0; i < ventana; i++) {
                visitasEnVentana += (visitasPorHora[horaInicio + i] || 0);
            }
            
            if (visitasEnVentana > maxVisitas) {
                maxVisitas = visitasEnVentana;
                rangoHorarioPico = {
                    inicio: horaInicio,
                    fin: horaInicio + ventana,
                    visitas: visitasEnVentana,
                    descripcion: `${String(horaInicio).padStart(2, '0')}:00 - ${String(horaInicio + ventana).padStart(2, '0')}:00`
                };
            }
        }
    }

    // Distribución completa por hora
    const distribucionHoraria = Object.keys(visitasPorHora)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(hora => ({
            hora: parseInt(hora),
            horaFormato: `${String(hora).padStart(2, '0')}:00`,
            visitas: visitasPorHora[hora]
        }));

    // Preguntas difíciles
    const preguntasDificiles = {};
    visitas.forEach(v => {
        if (v.respuestas_quiz && Array.isArray(v.respuestas_quiz)) {
            v.respuestas_quiz.forEach(respuesta => {
                if (!respuesta.es_correcta) {
                    const key = `${v.id_exhibicion}_${respuesta.texto_pregunta || 'Pregunta desconocida'}`;
                    if (!preguntasDificiles[key]) {
                        preguntasDificiles[key] = {
                            exhibicion: visitasPorExhibicion[v.id_exhibicion]?.nombre || v.id_exhibicion,
                            texto: respuesta.texto_pregunta || 'Pregunta desconocida',
                            errores: 0
                        };
                    }
                    preguntasDificiles[key].errores++;
                }
            });
        }
    });

    return {
        totalVisitas,
        visitasConQuiz,
        visitasSinQuiz: totalVisitas - visitasConQuiz,
        visitasPorExhibicion,
        distribucionPuntajes,
        rangoHorarioPico,
        distribucionHoraria,
        preguntasDificiles: Object.values(preguntasDificiles)
            .sort((a, b) => b.errores - a.errores)
            .slice(0, 10)
    };
}

/**
 * Generar PDF del informe
 */
export async function generarInformePDFService(desde, hasta, preset, quizzesIds = []) {
    try {
        const { fechaInicio, fechaFin } = calcularRangoFechas(desde, hasta, preset);

        // Obtener estadísticas modernas
        const stats = await obtenerEstadisticasModernas(fechaInicio, fechaFin);

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

        // Resumen General
        doc.fontSize(16).text('RESUMEN GENERAL', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total de visitas: ${stats.totalVisitas}`);
        doc.text(`Visitantes que completaron quiz: ${stats.visitasConQuiz}`);
        doc.text(`Visitantes sin responder quiz: ${stats.visitasSinQuiz}`);
        doc.moveDown(2);

        // Visitas por exhibición
        doc.fontSize(16).text('VISITAS POR EXHIBICION', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        const exhibicionesOrdenadas = Object.entries(stats.visitasPorExhibicion)
            .sort((a, b) => b[1] - a[1]);
        
        exhibicionesOrdenadas.forEach(([nombre, cantidad]) => {
            const porcentaje = ((cantidad / stats.totalVisitas) * 100).toFixed(1);
            doc.text(`  • ${nombre}: ${cantidad} visitas (${porcentaje}%)`);
        });
        doc.moveDown(2);

        // Gráfico de visitas por exhibición
        if (Object.keys(stats.visitasPorExhibicion).length > 0) {
            const graficoVisitas = await generarGraficoBarras(stats.visitasPorExhibicion, 'Visitas por Exhibición');
            doc.image(graficoVisitas, { width: 500 });
            doc.moveDown(2);
        }

        // Rango Horario Pico
        if (stats.rangoHorarioPico && stats.rangoHorarioPico.visitas > 0) {
            doc.fontSize(16).fillColor('#000000').text('HORARIO DE MAYOR AFLUENCIA', { underline: true });
            doc.moveDown();
            doc.fontSize(14).fillColor('#D97706');
            doc.text(stats.rangoHorarioPico.descripcion, { align: 'center' });
            doc.fontSize(12).fillColor('#000000');
            doc.text(`${stats.rangoHorarioPico.visitas} visitas registradas en este rango`, { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#666666');
            doc.text('Este es el periodo con mayor concentración de visitantes', { align: 'center' });
            doc.fillColor('#000000');
            doc.moveDown(2);
        }

        // Distribución Horaria
        if (stats.distribucionHoraria && stats.distribucionHoraria.length > 0) {
            doc.fontSize(16).text('DISTRIBUCION DE VISITAS POR HORA', { underline: true });
            doc.moveDown();
            doc.fontSize(10);
            
            // Crear tabla de distribución horaria
            const maxVisitasHora = Math.max(...stats.distribucionHoraria.map(h => h.visitas));
            stats.distribucionHoraria.forEach((hora) => {
                const esHoraPico = hora.hora >= stats.rangoHorarioPico.inicio && 
                                   hora.hora < stats.rangoHorarioPico.fin;
                
                if (esHoraPico) {
                    doc.fillColor('#D97706').text(`${hora.horaFormato}: ${hora.visitas} visitas [HORA MAS VISITADA]`, { 
                        continued: false 
                    });
                } else {
                    doc.fillColor('#000000').text(`${hora.horaFormato}: ${hora.visitas} visitas`);
                }
            });
            doc.fillColor('#000000');
            doc.moveDown(2);
        }

        // Nueva página para quizzes
        doc.addPage();

        // Distribución de Puntajes
        doc.fontSize(16).text('DISTRIBUCION DE PUNTAJES', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        
        if (Object.keys(stats.distribucionPuntajes).length > 0) {
            doc.text('Puntajes obtenidos por los visitantes:');
            const puntajesOrdenados = Object.entries(stats.distribucionPuntajes)
                .sort((a, b) => b[1] - a[1]);
            
            puntajesOrdenados.forEach(([puntaje, cantidad]) => {
                const porcentaje = ((cantidad / stats.visitasConQuiz) * 100).toFixed(1);
                doc.text(`  • ${puntaje} puntos: ${cantidad} visitantes (${porcentaje}%)`);
            });
            doc.moveDown(2);

            // Gráfico de distribución de puntajes
            const dataPuntajes = {};
            puntajesOrdenados.forEach(([puntaje, cantidad]) => {
                dataPuntajes[puntaje] = cantidad;
            });
            const graficoPuntajes = await generarGraficoBarras(dataPuntajes, 'Distribución de Puntajes');
            doc.image(graficoPuntajes, { width: 500 });
        } else {
            doc.text('No hay datos de puntajes en este período.');
        }
        doc.moveDown(2);

        // Nueva página para preguntas difíciles
        doc.addPage();

        // Preguntas con más errores
        doc.fontSize(16).text('PREGUNTAS CON MAS ERRORES', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        
        if (stats.preguntasDificiles.length > 0) {
            doc.text('Top 10 preguntas que más visitantes respondieron incorrectamente:');
            doc.moveDown();
            
            stats.preguntasDificiles.forEach((pregunta, idx) => {
                doc.fontSize(11).fillColor('#CC0000');
                doc.text(`${idx + 1}. [${pregunta.errores} errores]`, { continued: true });
                doc.fillColor('#0066CC');
                doc.text(` [${pregunta.exhibicion}]`, { continued: false });
                
                doc.fillColor('#7C3AED').fontSize(10);
                doc.text(`   ${pregunta.quiz_titulo || 'Quiz desconocido'}`);
                
                doc.fillColor('#374151').fontSize(10);
                doc.text(`   ${pregunta.titulo_pregunta || 'Sin título'}: ${pregunta.texto}`);
                
                doc.fillColor('#000000');
                doc.moveDown(0.7);
            });
            doc.moveDown();

            // Gráfico de preguntas difíciles
            const dataPreguntasDificiles = {};
            stats.preguntasDificiles.slice(0, 5).forEach((p, idx) => {
                dataPreguntasDificiles[`P${idx + 1}`] = p.errores;
            });
            const graficoDificiles = await generarGraficoBarras(dataPreguntasDificiles, 'Top 5 Preguntas con Más Errores');
            doc.image(graficoDificiles, { width: 500 });
        } else {
            doc.text('No hay datos de errores en preguntas para este período.');
        }
        doc.moveDown(2);

        // Análisis Detallado por Quiz (si se seleccionaron quizzes)
        if (quizzesIds && quizzesIds.length > 0) {
            for (const quizId of quizzesIds) {
                // Nueva página para cada quiz
                doc.addPage();
                
                // Obtener análisis del quiz
                const [analisisData, analisisError] = await getAnalisisQuizService(quizId);
                
                if (!analisisError && analisisData) {
                    const analisis = analisisData;
                    
                    // Título del quiz
                    doc.fontSize(18).fillColor('#000000').text(`ANÁLISIS DETALLADO DEL QUIZ`, { align: 'center', underline: true });
                    doc.moveDown();
                    doc.fontSize(16).text(analisis.quiz.titulo, { align: 'center' });
                    doc.moveDown(0.5);
                    doc.fontSize(12).text(`Exhibición: ${analisis.quiz.exhibicion}`, { align: 'center' });
                    doc.text(`Total de Preguntas con Respuestas: ${analisis.analisis_preguntas.length} | Participantes: ${analisis.total_participantes}`, { align: 'center' });
                    doc.moveDown(2);
                    
                    // Análisis de cada pregunta (solo las que tienen respuestas)
                    analisis.analisis_preguntas.forEach((pregunta, idx) => {
                        // Verificar si necesitamos una nueva página
                        if (doc.y > 650) {
                            doc.addPage();
                        }
                        
                        doc.fontSize(14).fillColor('#5B21B6').text(`${idx + 1})`, { underline: true });
                        doc.moveDown(0.3);
                        doc.fontSize(12).fillColor('#000000').text(pregunta.enunciado, { width: 500 });
                        doc.fontSize(10).fillColor('#666666').text(`(${pregunta.total_respuestas} respuestas totales)`, { width: 500 });
                        doc.moveDown(0.5);
                        
                        // Mostrar cada respuesta con su porcentaje
                        pregunta.respuestas.forEach((respuesta) => {
                            const icono = respuesta.es_correcta ? '[CORRECTA]' : '[INCORRECTA]';
                            const color = respuesta.es_correcta ? '#059669' : '#6B7280';
                            
                            doc.fillColor(color);
                            doc.fontSize(11);
                            doc.text(`  ${icono} ${respuesta.texto} - ${respuesta.porcentaje}% (${respuesta.cantidad} ${respuesta.cantidad === 1 ? 'respuesta' : 'respuestas'})`, { 
                                width: 500,
                                align: 'left'
                            });
                            doc.fillColor('#000000');
                            doc.moveDown(0.3);
                        });
                        
                        doc.moveDown(1);
                        
                        // Línea divisoria
                        if (idx < analisis.analisis_preguntas.length - 1) {
                            doc.strokeColor('#E5E7EB')
                               .lineWidth(1)
                               .moveTo(50, doc.y)
                               .lineTo(550, doc.y)
                               .stroke();
                            doc.moveDown(1);
                        }
                    });
                } else {
                    doc.fontSize(12).fillColor('#CC0000').text(`No se pudo obtener el análisis del quiz con ID ${quizId}`);
                }
            }
        }

        // Pie de página
        doc.fontSize(10).fillColor('#666666');
        doc.text('Este informe fue generado automáticamente por el Sistema de Gestión del Museo', { align: 'center' });
        doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' });

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
