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

        // Obtener el quiz
        const quizz = await quizzRepo.findOne({
            where: { id_quizz: parseInt(id) }
        });

        if (!quizz) {
            return [null, "Quiz no encontrado"];
        }

        // Obtener preguntas del quiz
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

        // Construir respuesta completa
        const quizzCompleto = {
            id_quizz: quizz.id_quizz,
            id_usuario: quizz.id_usuario,
            titulo: quizz.titulo,
            cant_preguntas: quizz.cant_preguntas,
            fecha_creacion: quizz.fecha_creacion,
            preguntas: preguntasConRespuestas
        };

        return [quizzCompleto, null];
    } catch (error) {
        console.error("Error en getQuizzByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}

// Obtener todos los quizzes
export async function getAllQuizzesService() {
    try {
        const quizzRepo = AppDataSource.getRepository(Quizz);
        const quizzes = await quizzRepo.find();
        
        return [quizzes, null];
    } catch (error) {
        console.error("Error en getAllQuizzesService:", error);
        return [null, "Error al obtener quizzes"];
    }
}

// Crear quiz completo (nested: quiz + preguntas + respuestas)
export async function createQuizzService(id_usuario, titulo, preguntas) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        const quizzRepo = queryRunner.manager.getRepository(Quizz);
        const preguntaRepo = queryRunner.manager.getRepository(Pregunta);
        const respuestaRepo = queryRunner.manager.getRepository(Respuesta);
        
        // 1. Crear el quiz
        const nuevoQuizz = await quizzRepo.save({
            id_usuario,
            titulo,
            cant_preguntas: preguntas.length
        });
        
        // 2. Crear preguntas y respuestas
        for (const preguntaData of preguntas) {
            const nuevaPregunta = await preguntaRepo.save({
                id_quizz: nuevoQuizz.id_quizz,
                titulo: preguntaData.titulo,
                texto: preguntaData.texto
            });
            
            // 3. Crear respuestas de esta pregunta
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

// Actualizar quiz completo (elimina preguntas/respuestas antiguas y crea nuevas)
export async function updateQuizzService(id_quizz, titulo, preguntas) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        const quizzRepo = queryRunner.manager.getRepository(Quizz);
        const preguntaRepo = queryRunner.manager.getRepository(Pregunta);
        const respuestaRepo = queryRunner.manager.getRepository(Respuesta);
        
        // 1. Verificar que el quiz existe
        const quizz = await quizzRepo.findOne({ where: { id_quizz } });
        if (!quizz) {
            await queryRunner.rollbackTransaction();
            return [null, "Quiz no encontrado"];
        }
        
        // 2. Eliminar preguntas antiguas (cascade eliminará respuestas)
        await preguntaRepo.delete({ id_quizz });
        
        // 3. Actualizar quiz
        await quizzRepo.update({ id_quizz }, {
            titulo,
            cant_preguntas: preguntas.length
        });
        
        // 4. Crear nuevas preguntas y respuestas
        for (const preguntaData of preguntas) {
            const nuevaPregunta = await preguntaRepo.save({
                id_quizz,
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

// Eliminar quiz (validar que quede al menos 1)
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
        
        // Eliminar (cascade eliminará preguntas y respuestas)
        await quizzRepo.delete({ id_quizz });
        
        return [{ message: "Quiz eliminado exitosamente" }, null];
    } catch (error) {
        console.error("Error en deleteQuizzService:", error);
        return [null, "Error al eliminar el quiz"];
    }
}
