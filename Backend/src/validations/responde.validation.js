"use strict";
import Joi from "joi";

export const createRespondeSchema = Joi.object({
    id_usuario: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "El ID de usuario debe ser un UUID válido",
            "any.required": "El ID de usuario es requerido"
        }),
    id_quizz: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "El ID del quiz debe ser un número",
            "number.integer": "El ID del quiz debe ser un número entero",
            "number.positive": "El ID del quiz debe ser positivo",
            "any.required": "El ID del quiz es requerido"
        }),
    correctas: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            "number.base": "El número de respuestas correctas debe ser un número",
            "number.integer": "El número de respuestas correctas debe ser un número entero",
            "number.min": "El número de respuestas correctas no puede ser negativo",
            "any.required": "El número de respuestas correctas es requerido"
        }),
    tiempo_segundos: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            "number.base": "El tiempo debe ser un número",
            "number.integer": "El tiempo debe ser un número entero",
            "number.min": "El tiempo no puede ser negativo"
        }),
    respuestas_detalle: Joi.array()
        .items(Joi.object({
            id_pregunta: Joi.number().integer().required(),
            id_respuesta_seleccionada: Joi.number().integer().required(),
            es_correcta: Joi.boolean().required(),
            texto_pregunta: Joi.string().required(),
            texto_respuesta: Joi.string().optional()
        }))
        .optional()
        .allow(null)
        .messages({
            "array.base": "Las respuestas_detalle deben ser un array"
        })
});

export const getRespondesByQuizzSchema = Joi.object({
    id_quizz: Joi.number().integer().positive().required()
        .messages({
            "number.base": "El id_quizz debe ser un número",
            "number.integer": "El id_quizz debe ser un número entero",
            "number.positive": "El id_quizz debe ser positivo",
            "any.required": "El id_quizz es requerido"
        })
});
