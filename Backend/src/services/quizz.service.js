"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Quizz } from "../entity/Quizz.entity.js";
import { Pregunta } from "../entity/Pregunta.entity.js";
import { Respuesta } from "../entity/Respuesta.entity.js";

export async function getQuizzByIdService(id) {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const preguntaRepo = AppDataSource.getRepository(Pregunta);
        const respuestaRepo = AppDataSource.getRepository(Respuesta);
        const quizz = await quizzRepo.findOne({
            where: { id_quizz: parseInt(id) }
        });

        if (!quizz) {
            return [null, "Quiz no encontrado"];
        }
        const preguntas = await preguntaRepo.find({
            where: { id_quizz: quizz.id_quizz }
        });

        // Para cada pregunta, obtener sus respuestas
        const preguntasConRespuestas = await Promise.all(
            preguntas.map(async (pregunta) => {
                const respuestas = await respuestaRepo.find({
                    where: { id_pregunta: pregunta.id_pregunta }
                });

                return {
                    id_pregunta: pregunta.id_pregunta,
                    titulo: pregunta.titulo,
                    texto: pregunta.texto,
                    respuestas: respuestas.map(r => ({
                        id_respuesta: r.id_respuesta,
                        texto: r.texto,
                        es_correcta: r.es_correcta
                    }))
                };
            })
        );
        const quizzCompleto = {
            id_quizz: quizz.id_quizz,
            id_usuario: quizz.id_usuario,
            titulo: quizz.titulo,
            cant_preguntas: quizz.cant_preguntas,
            es_activo: quizz.es_activo,
            fecha_creacion: quizz.fecha_creacion,
            preguntas: preguntasConRespuestas
        };

        return [quizzCompleto, null];
    } catch (error) {
        console.error("Error en getQuizzByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}
export async function getAllQuizzesService() {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const quizzes = await quizzRepo.find({
            relations: ['exhibicion']
        });
        
        return [quizzes, null];
    } catch (error) {
        console.error("Error en getAllQuizzesService:", error);
        return [null, "Error al obtener quizzes"];
    }
}
export async function getQuizzByExhibicionService(id_exhibicion) {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const preguntaRepo = AppDataSource.getRepository(Pregunta);
        const respuestaRepo = AppDataSource.getRepository(Respuesta);
        const quizzes = await quizzRepo.find({
            where: { id_exhibicion },
            order: { fecha_creacion: 'DESC' }
        });

        if (!quizzes || quizzes.length === 0) {
            return [[], null]; // Retornar array vacío en lugar de error
        }

        // Procesar todos los quizzes
        const quizzesCompletos = await Promise.all(
            quizzes.map(async (quizz) => {
                const preguntas = await preguntaRepo.find({
                    where: { id_quizz: quizz.id_quizz }
                });

                const preguntasConRespuestas = await Promise.all(
                    preguntas.map(async (pregunta) => {
                        const respuestas = await respuestaRepo.find({
                            where: { id_pregunta: pregunta.id_pregunta }
                        });

                        return {
                            id_pregunta: pregunta.id_pregunta,
                            titulo: pregunta.titulo,
                            texto: pregunta.texto,
                            respuestas: respuestas.map(r => ({
                                id_respuesta: r.id_respuesta,
                                texto: r.texto,
                                es_correcta: r.es_correcta
                            }))
                        };
                    })
                );

                return {
                    id_quizz: quizz.id_quizz,
                    id_usuario: quizz.id_usuario,
                    id_exhibicion: quizz.id_exhibicion,
                    titulo: quizz.titulo,
                    cant_preguntas: quizz.cant_preguntas,
                    es_activo: quizz.es_activo,
                    fecha_creacion: quizz.fecha_creacion,
                    preguntas: preguntasConRespuestas
                };
            })
        );

        return [quizzesCompletos, null];
    } catch (error) {
        console.error("Error en getQuizzByExhibicionService:", error);
        return [null, "Error interno del servidor"];
    }
}

// ANTIGUO: Obtener solo el primer quiz de una exhibición (deprecated, mantener por compatibilidad)
export async function getFirstQuizzByExhibicionService(id_exhibicion) {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const preguntaRepo = AppDataSource.getRepository(Pregunta);
        const respuestaRepo = AppDataSource.getRepository(Respuesta);
        const quizz = await quizzRepo.findOne({
            where: { id_exhibicion },
            order: { fecha_creacion: 'DESC' }
        });

        if (!quizz) {
            return [null, "No hay quiz para esta exhibición"];
        }
        const preguntas = await preguntaRepo.find({
            where: { id_quizz: quizz.id_quizz }
        });

        const preguntasConRespuestas = await Promise.all(
            preguntas.map(async (pregunta) => {
                const respuestas = await respuestaRepo.find({
                    where: { id_pregunta: pregunta.id_pregunta }
                });

                return {
                    id_pregunta: pregunta.id_pregunta,
                    titulo: pregunta.titulo,
                    texto: pregunta.texto,
                    respuestas: respuestas.map(r => ({
                        id_respuesta: r.id_respuesta,
                        texto: r.texto,
                        es_correcta: r.es_correcta
                    }))
                };
            })
        );

        const quizzCompleto = {
            id_quizz: quizz.id_quizz,
            id_usuario: quizz.id_usuario,
            id_exhibicion: quizz.id_exhibicion,
            titulo: quizz.titulo,
            cant_preguntas: quizz.cant_preguntas,
            es_activo: quizz.es_activo,
            fecha_creacion: quizz.fecha_creacion,
            preguntas: preguntasConRespuestas
        };

        return [quizzCompleto, null];
    } catch (error) {
        console.error("Error en getFirstQuizzByExhibicionService:", error);
        return [null, "Error interno del servidor"];
    }
}
export async function createQuizzService(id_usuario, id_exhibicion, titulo, preguntas) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        const quizzRepo = queryRunner.manager.getRepository(Quizz);
        const preguntaRepo = queryRunner.manager.getRepository(Pregunta);
        const respuestaRepo = queryRunner.manager.getRepository(Respuesta);
        await quizzRepo.update(
            { id_exhibicion },
            { es_activo: false }
        );
        const nuevoQuizz = await quizzRepo.save({
            id_usuario,
            id_exhibicion,
            titulo,
            cant_preguntas: preguntas.length,
            es_activo: true
        });
        for (const preguntaData of preguntas) {
            const nuevaPregunta = await preguntaRepo.save({
                id_quizz: nuevoQuizz.id_quizz,
                titulo: preguntaData.titulo,
                texto: preguntaData.texto
            });
            for (const respuestaData of preguntaData.respuestas) {
                await respuestaRepo.save({
                    id_pregunta: nuevaPregunta.id_pregunta,
                    texto: respuestaData.texto,
                    es_correcta: respuestaData.es_correcta
                });
            }
        }
        
        await queryRunner.commitTransaction();
        
        // Retornar el quiz completo creado
        return await getQuizzByIdService(nuevoQuizz.id_quizz);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en createQuizzService:", error);
        return [null, "Error al crear el quiz"];
    } finally {
        await queryRunner.release();
    }
}
export async function updateQuizzService(id_quizz, id_exhibicion, titulo, preguntas) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        const quizzRepo = queryRunner.manager.getRepository(Quizz);
        const preguntaRepo = queryRunner.manager.getRepository(Pregunta);
        const respuestaRepo = queryRunner.manager.getRepository(Respuesta);
        const quizz = await quizzRepo.findOne({ where: { id_quizz } });
        if (!quizz) {
            await queryRunner.rollbackTransaction();
            return [null, "Quiz no encontrado"];
        }
        const preguntasExistentes = await preguntaRepo.find({ 
            where: { id_quizz },
            relations: ['respuestas']
        });
        await quizzRepo.update({ id_quizz }, {
            id_exhibicion,
            titulo,
            cant_preguntas: preguntas.length
        });
        for (let i = 0; i < preguntas.length; i++) {
            const preguntaData = preguntas[i];
            let preguntaActual;
            
            if (preguntasExistentes[i]) {
                await preguntaRepo.update(preguntasExistentes[i].id_pregunta, {
                    titulo: preguntaData.titulo,
                    texto: preguntaData.texto
                });
                preguntaActual = preguntasExistentes[i];
                await respuestaRepo.delete({ id_pregunta: preguntaActual.id_pregunta });
            } else {
                preguntaActual = await preguntaRepo.save({
                    id_quizz,
                    titulo: preguntaData.titulo,
                    texto: preguntaData.texto
                });
            }
            for (const respuestaData of preguntaData.respuestas) {
                await respuestaRepo.save({
                    id_pregunta: preguntaActual.id_pregunta,
                    texto: respuestaData.texto,
                    es_correcta: respuestaData.es_correcta
                });
            }
        }
        if (preguntasExistentes.length > preguntas.length) {
            const preguntasAEliminar = preguntasExistentes.slice(preguntas.length);
            for (const pregunta of preguntasAEliminar) {
                await preguntaRepo.delete(pregunta.id_pregunta);
            }
        }
        
        await queryRunner.commitTransaction();
        
        // Retornar el quiz actualizado
        return await getQuizzByIdService(id_quizz);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en updateQuizzService:", error);
        return [null, "Error al actualizar el quiz"];
    } finally {
        await queryRunner.release();
    }
}
export async function deleteQuizzService(id_quizz) {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        
        // Verificar cantidad total de quizzes
        const totalQuizzes = await quizzRepo.count();
        if (totalQuizzes <= 1) {
            return [null, "No se puede eliminar. Debe existir al menos 1 quiz"];
        }
        
        // Verificar que el quiz existe
        const quizz = await quizzRepo.findOne({ where: { id_quizz } });
        if (!quizz) {
            return [null, "Quiz no encontrado"];
        }
        await quizzRepo.delete({ id_quizz });
        
        return [{ message: "Quiz eliminado exitosamente" }, null];
    } catch (error) {
        console.error("Error en deleteQuizzService:", error);
        return [null, "Error al eliminar el quiz"];
    }
}

// Activar quiz (desactiva los demás de la misma exhibición)
export async function activarQuizzService(id_quizz) {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        
        // Verificar que el quiz existe
        const quizz = await quizzRepo.findOne({ where: { id_quizz } });
        if (!quizz) {
            return [null, "Quiz no encontrado"];
        }
        
        // Desactivar todos los quizzes de esta exhibición
        await quizzRepo.update(
            { id_exhibicion: quizz.id_exhibicion },
            { es_activo: false }
        );
        
        // Activar este quiz
        await quizzRepo.update(
            { id_quizz },
            { es_activo: true }
        );
        
        return [{ message: "Quiz activado exitosamente", id_quizz }, null];
    } catch (error) {
        console.error("Error en activarQuizzService:", error);
        return [null, "Error al activar el quiz"];
    }
}
