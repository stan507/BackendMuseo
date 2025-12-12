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

    const maxValue = Math.max(...values);
    const suggestedMax = Math.ceil(maxValue * 1.2); // 20% más alto que el valor máximo

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
                    beginAtZero: true,
                    suggestedMax: suggestedMax,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
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
    console.log('[PDF Service] Obteniendo estadísticas modernas...');
    const desde = fechaInicio.toISOString().split('T')[0];
    const hasta = fechaFin.toISOString().split('T')[0];
    console.log('[PDF Service] Query rango:', desde, 'a', hasta);
    const queryVisitas = `
        SELECT 
            v.id_visita,
            v.fecha_visita,
            v.duracion_segundos,
            v.id_exhibicion,
            e.nombre as exhibicion_nombre
        FROM visita v
        LEFT JOIN exhibicion e ON v.id_exhibicion = e.id_exhibicion
        WHERE v.fecha_visita >= $1 AND v.fecha_visita <= $2
        ORDER BY v.fecha_visita DESC
    `;
    const queryRespuestas = `
        SELECT 
            r.id_responde,
            r.id_usuario,
            r.id_quizz,
            r.correctas,
            r.tiempo_segundos,
            r.fecha_responde,
            q.cant_preguntas,
            q.titulo as quiz_titulo,
            q.id_exhibicion
        FROM responde r
        LEFT JOIN quizz q ON r.id_quizz = q.id_quizz
        WHERE r.fecha_responde >= $1 AND r.fecha_responde <= $2
    `;

    const visitas = await AppDataSource.query(queryVisitas, [desde, hasta + ' 23:59:59']);
    const respuestas = await AppDataSource.query(queryRespuestas, [desde, hasta + ' 23:59:59']);
    console.log('[PDF Service] Visitas encontradas:', visitas.length);
    console.log('[PDF Service] Respuestas encontradas:', respuestas.length);

    const totalVisitas = visitas.length;
    const visitasConQuiz = respuestas.length;

    // Visitas por exhibición
    const visitasPorExhibicion = {};
    visitas.forEach(v => {
        const nombre = v.exhibicion_nombre || 'Sin Exhibición';
        visitasPorExhibicion[nombre] = (visitasPorExhibicion[nombre] || 0) + 1;
    });

    // Distribución de puntajes desde responde (con nombre del quiz)
    const distribucionPuntajes = {};
    respuestas.forEach(r => {
        if (r.correctas !== null && r.correctas >= 0 && r.cant_preguntas > 0) {
            const quizNombre = r.quiz_titulo || 'Quiz desconocido';
            const key = `${quizNombre}: ${r.correctas}/${r.cant_preguntas}`;
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

    // Preguntas difíciles - obtener respuestas_detalle desde responde
    const queryRespuestasDetalle = `
        SELECT 
            r.id_quizz,
            r.respuestas_detalle
        FROM responde r
        WHERE r.fecha_responde >= $1 AND r.fecha_responde <= $2
        AND r.respuestas_detalle IS NOT NULL
    `;

    const respuestasDetalle = await AppDataSource.query(queryRespuestasDetalle, [desde, hasta + ' 23:59:59']);

    const preguntasDificiles = {};
    const preguntasCache = {};

    for (const r of respuestasDetalle) {
        if (r.respuestas_detalle && Array.isArray(r.respuestas_detalle) && r.respuestas_detalle.length > 0) {
            for (const respuesta of r.respuestas_detalle) {
                if (!respuesta.es_correcta && respuesta.id_pregunta) {
                    const key = `${r.id_quizz}_${respuesta.id_pregunta}`;

                    if (!preguntasDificiles[key]) {
                        let preguntaInfo = preguntasCache[respuesta.id_pregunta];

                        if (!preguntaInfo) {
                            const queryPregunta = `
                                SELECT p.titulo, p.texto, q.titulo as quiz_titulo, q.id_exhibicion, e.nombre as exhibicion_nombre
                                FROM pregunta p
                                JOIN quizz q ON p.id_quizz = q.id_quizz
                                JOIN exhibicion e ON q.id_exhibicion = e.id_exhibicion
                                WHERE p.id_pregunta = $1
                            `;
                            const [preguntaData] = await AppDataSource.query(queryPregunta, [respuesta.id_pregunta]);
                            if (preguntaData) {
                                preguntaInfo = preguntaData;
                                preguntasCache[respuesta.id_pregunta] = preguntaInfo;
                            }
                        }

                        if (preguntaInfo) {
                            preguntasDificiles[key] = {
                                exhibicion: preguntaInfo.exhibicion_nombre,
                                quiz_titulo: preguntaInfo.quiz_titulo,
                                titulo_pregunta: preguntaInfo.titulo,
                                texto: preguntaInfo.texto,
                                errores: 0,
                                respuestas_incorrectas: {}
                            };
                        }
                    }

                    if (preguntasDificiles[key]) {
                        preguntasDificiles[key].errores++;

                        // Contabilizar respuesta incorrecta
                        const textoRespuesta = respuesta.texto_respuesta || 'Respuesta desconocida';
                        if (!preguntasDificiles[key].respuestas_incorrectas[textoRespuesta]) {
                            preguntasDificiles[key].respuestas_incorrectas[textoRespuesta] = 0;
                        }
                        preguntasDificiles[key].respuestas_incorrectas[textoRespuesta]++;
                    }
                }
            }
        }
    }

    return {
        totalVisitas,
        visitasConQuiz,
        visitasSinQuiz: totalVisitas - visitasConQuiz,
        visitasPorExhibicion,
        distribucionPuntajes,
        rangoHorarioPico,
        distribucionHoraria,
        preguntasDificiles: Object.values(preguntasDificiles)
            .map(p => {
                // Encontrar la respuesta incorrecta más común
                const respuestasArray = Object.entries(p.respuestas_incorrectas || {})
                    .map(([texto, count]) => ({ texto, count }))
                    .sort((a, b) => b.count - a.count);

                return {
                    ...p,
                    respuesta_incorrecta_comun: respuestasArray[0]?.texto || null,
                    veces_respuesta_incorrecta: respuestasArray[0]?.count || 0
                };
            })
            .sort((a, b) => b.errores - a.errores)
            .slice(0, 10)
    };
}

/**
 * Generar PDF del informe
 */
export async function generarInformePDFService(desde, hasta, preset, quizzesIds = [], userId = null) {
    try {
        console.log('[PDF Service] Calculando rango de fechas...');
        const { fechaInicio, fechaFin } = calcularRangoFechas(desde, hasta, preset);
        console.log('[PDF Service] Fechas:', fechaInicio.toISOString(), '-', fechaFin.toISOString());
        let usuarioNombre = 'Usuario Desconocido';
        if (userId) {
            try {
                const usuarioRepo = AppDataSource.getRepository("Usuario");
                const usuario = await usuarioRepo.findOne({ where: { id_usuario: userId } });
                if (usuario) {
                    usuarioNombre = `${usuario.nombre} ${usuario.apellido}`;
                }
            } catch (error) {
                console.error('Error obteniendo usuario:', error);
            }
        }
        const stats = await obtenerEstadisticasModernas(fechaInicio, fechaFin);
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // Encabezado
        doc.fontSize(20).text('Informe Museo - Estadísticas', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`, { align: 'center' });
        doc.text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.fontSize(10).fillColor('#666666').text(`Generado por: ${usuarioNombre}`, { align: 'center' });
        doc.fillColor('#000000').fontSize(12);
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

        // Nueva página para preguntas difíciles
        doc.addPage();

        // Preguntas con más errores
        doc.fontSize(16).text('PREGUNTAS CON MAS ERRORES', { underline: true });
        doc.moveDown();
        doc.fontSize(10).fillColor('#666666');
        doc.text('Este gráfico muestra las preguntas que más visitantes respondieron incorrectamente.');
        doc.text('P1, P2, etc. representa cada pregunta. La altura de la barra indica la cantidad de errores.');
        doc.fillColor('#000000').fontSize(12);
        doc.moveDown();

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

                if (pregunta.respuesta_incorrecta_comun) {
                    doc.fillColor('#DC2626').fontSize(9).font('Helvetica-Oblique');
                    doc.text(`   [X] Respuesta incorrecta mas comun: "${pregunta.respuesta_incorrecta_comun}" (${pregunta.veces_respuesta_incorrecta} veces)`);
                    doc.font('Helvetica');
                }

                doc.fillColor('#000000');
                doc.moveDown(0.7);
            });
            doc.moveDown();

            // Gráfico de preguntas difíciles
            const dataPreguntasDificiles = {};
            stats.preguntasDificiles.slice(0, 5).forEach((p, idx) => {
                // Usar el título de la pregunta truncado como etiqueta
                const label = `P${idx + 1}: ${p.titulo_pregunta.substring(0, 20)}${p.titulo_pregunta.length > 20 ? '...' : ''}`;
                dataPreguntasDificiles[label] = p.errores;
            });
            const graficoDificiles = await generarGraficoBarras(dataPreguntasDificiles, 'Top 5 Preguntas con Mas Errores (cantidad de errores)');
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
                const [analisisData, analisisError] = await getAnalisisQuizService(quizId, fechaInicio, fechaFin);

                if (!analisisError && analisisData) {
                    const analisis = analisisData;

                    // Título del quiz
                    doc.fontSize(18).fillColor('#000000').text(`ANÁLISIS DETALLADO DEL QUIZ`, { align: 'center', underline: true });
                    doc.moveDown();
                    doc.fontSize(16).text(`Quiz de ${analisis.quiz.exhibicion}`, { align: 'center' });
                    doc.moveDown(0.5);
                    doc.fontSize(12).text(`ID del Quiz: ${analisis.quiz.id_quizz}`, { align: 'center' });
                    doc.text(`Total de Preguntas: ${analisis.quiz.cant_preguntas} | Preguntas con Respuestas: ${analisis.analisis_preguntas.length} | Participantes: ${analisis.total_participantes}`, { align: 'center' });
                    doc.moveDown(2);

                    // Distribución de Puntajes para este quiz específico
                    doc.fontSize(14).fillColor('#7C3AED').text('DISTRIBUCION DE PUNTAJES', { underline: true });
                    doc.fontSize(10).fillColor('#666666');
                    doc.text('Cuantos participantes obtuvieron cada puntaje en este quiz.');
                    doc.fillColor('#000000').fontSize(12);
                    doc.moveDown();
                    const desdeStr = fechaInicio.toISOString().split('T')[0];
                    const hastaStr = fechaFin.toISOString().split('T')[0];
                    const queryPuntajes = `
                        SELECT 
                            r.correctas,
                            r.respuestas_detalle,
                            q.cant_preguntas,
                            COUNT(*) as cantidad
                        FROM responde r
                        JOIN quizz q ON r.id_quizz = q.id_quizz
                        WHERE r.id_quizz = $1
                        AND r.fecha_responde >= $2
                        AND r.fecha_responde <= $3
                        GROUP BY r.correctas, q.cant_preguntas, r.respuestas_detalle
                        ORDER BY r.correctas DESC
                    `;
                    const puntajesQuizRaw = await AppDataSource.query(queryPuntajes, [quizId, desdeStr, hastaStr + ' 23:59:59']);

                    if (puntajesQuizRaw.length > 0) {
                        const cantPreguntas = puntajesQuizRaw[0].cant_preguntas;

                        // Agrupar por puntaje y detectar abandonos
                        const puntajesAgrupados = {};
                        const abandonosPorPreguntasRespondidas = {};
                        let totalAbandonos = 0;

                        puntajesQuizRaw.forEach(row => {
                            const puntaje = row.correctas;
                            const respuestasDetalle = row.respuestas_detalle;
                            const cantidad = parseInt(row.cantidad);

                            // Detectar si es abandono
                            const preguntasRespondidas = respuestasDetalle && Array.isArray(respuestasDetalle)
                                ? respuestasDetalle.length
                                : 0;
                            const esAbandono = preguntasRespondidas < cantPreguntas;

                            // Agrupar por puntaje
                            if (!puntajesAgrupados[puntaje]) {
                                puntajesAgrupados[puntaje] = {
                                    total: 0,
                                    abandonos: 0
                                };
                            }
                            puntajesAgrupados[puntaje].total += cantidad;

                            if (esAbandono) {
                                puntajesAgrupados[puntaje].abandonos += cantidad;
                                totalAbandonos += cantidad;

                                // Contar abandonos por cantidad de preguntas respondidas
                                if (!abandonosPorPreguntasRespondidas[preguntasRespondidas]) {
                                    abandonosPorPreguntasRespondidas[preguntasRespondidas] = 0;
                                }
                                abandonosPorPreguntasRespondidas[preguntasRespondidas] += cantidad;
                            }
                        });

                        // Calcular total real de participantes
                        const totalParticipantesReal = Object.values(puntajesAgrupados).reduce((sum, p) => sum + p.total, 0);

                        // Mostrar distribución con abandonos
                        const dataPuntajesQuiz = {};
                        Object.keys(puntajesAgrupados).sort((a, b) => b - a).forEach(puntaje => {
                            const label = `${puntaje}/${cantPreguntas}`;
                            const datos = puntajesAgrupados[puntaje];
                            dataPuntajesQuiz[label] = datos.total;
                            const porcentaje = ((datos.total / totalParticipantesReal) * 100).toFixed(0);

                            if (datos.abandonos > 0) {
                                doc.text(`  • ${label} correctas: ${datos.total} participantes (${porcentaje}%) - ${datos.abandonos} abandonos`);
                            } else {
                                doc.text(`  • ${label} correctas: ${datos.total} participantes (${porcentaje}%)`);
                            }
                        });
                        doc.moveDown();

                        // Gráfico de barras para este quiz
                        const graficoPuntajesQuiz = await generarGraficoBarras(dataPuntajesQuiz, `Distribucion de Puntajes (Total: ${totalParticipantesReal} participantes)`);
                        doc.image(graficoPuntajesQuiz, { width: 500 });
                        doc.moveDown(2);


                        if (totalAbandonos > 0) {
                            if (doc.y > 600) {
                                doc.addPage();
                            }

                            doc.fontSize(14).fillColor('#DC2626').text('ANALISIS DE ABANDONOS', { underline: true });
                            doc.fontSize(10).fillColor('#666666');
                            doc.text('Participantes que abandonaron el quiz antes de completarlo.');
                            doc.fillColor('#000000').fontSize(12);
                            doc.moveDown();

                            const porcentajeAbandonos = ((totalAbandonos / totalParticipantesReal) * 100).toFixed(1);
                            doc.fontSize(11).fillColor('#DC2626');
                            doc.text(`Total de abandonos: ${totalAbandonos} de ${totalParticipantesReal} participantes (${porcentajeAbandonos}%)`);
                            doc.fillColor('#000000');
                            doc.moveDown(0.5);

                            doc.fontSize(11).text('Distribucion de abandonos por preguntas respondidas:');
                            doc.fontSize(10);

                            doc.moveDown(0.3);

                            const dataAbandonos = {};
                            Object.keys(abandonosPorPreguntasRespondidas).sort((a, b) => parseInt(a) - parseInt(b)).forEach(preguntasResp => {
                                const cantidad = abandonosPorPreguntasRespondidas[preguntasResp];
                                const porcentaje = ((cantidad / totalAbandonos) * 100).toFixed(0);
                                const label = `${preguntasResp}/${cantPreguntas}`;
                                dataAbandonos[label] = cantidad;
                                doc.text(`  • ${label} preguntas respondidas: ${cantidad} personas (${porcentaje}%)`);
                            });
                            doc.moveDown();

                            if (doc.y > 350) {
                                doc.addPage();
                            }

                            const graficoAbandonos = await generarGraficoBarras(dataAbandonos, `Abandonos por Preguntas Respondidas (Total: ${totalAbandonos} abandonos)`);
                            doc.image(graficoAbandonos, { width: 500 });
                            doc.moveDown(2);
                        }
                    }

                    // Separador
                    doc.fontSize(14).fillColor('#7C3AED').text('ANALISIS POR PREGUNTA', { underline: true });
                    doc.fillColor('#000000').fontSize(12);
                    doc.moveDown();

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

        return new Promise(async (resolve, reject) => {
            doc.on('end', async () => {
                const pdfBuffer = Buffer.concat(buffers);

                // Guardar registro del informe en BD
                if (userId) {
                    try {
                        const informeRepo = AppDataSource.getRepository("Informe");
                        await informeRepo.save({
                            id_usuario: userId,
                            descripcion: `Informe generado para el periodo ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`
                        });
                    } catch (error) {
                        console.error("Error guardando registro de informe:", error);
                    }
                }

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
