"use strict";
import Joi from "joi";

export const createVisitaSchema = Joi.object({
    id_usuario: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "El ID de usuario debe ser un UUID válido",
            "any.required": "El ID de usuario es requerido"
        }),
    id_exhibicion: Joi.string()
        .max(255)
        .required()
        .messages({
            "string.max": "El ID de exhibición no debe exceder 255 caracteres",
            "any.required": "El ID de exhibición es requerido"
        })
});

export const updateDuracionSchema = Joi.object({
    duracion_segundos: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            "number.base": "La duración debe ser un número",
            "number.integer": "La duración debe ser un número entero",
            "number.min": "La duración no puede ser negativa",
            "any.required": "La duración es requerida"
        }),
    puntaje_quiz: Joi.number()
        .integer()
        .min(0)
        .optional()
        .allow(null)
        .messages({
            "number.base": "El puntaje debe ser un número",
            "number.integer": "El puntaje debe ser un número entero",
            "number.min": "El puntaje no puede ser negativo"
        }),
    respuestas_quiz: Joi.array()
        .items(Joi.object({
            id_pregunta: Joi.number().integer().required(),
            id_respuesta_seleccionada: Joi.number().integer().required(),
            es_correcta: Joi.boolean().required(),
            texto_pregunta: Joi.string().optional()
        }))
        .optional()
        .allow(null)
        .messages({
            "array.base": "Las respuestas deben ser un array"
        })
});

export const getVisitaSchema = Joi.object({
    id: Joi.number().integer().positive().required()
        .messages({
            "number.base": "El ID debe ser un número",
            "number.integer": "El ID debe ser un número entero",
            "number.positive": "El ID debe ser positivo",
            "any.required": "El ID es requerido"
        })
});

export const getVisitasByExhibicionSchema = Joi.object({
    id_exhibicion: Joi.string().valid("huemul", "helice", "chemomul", "cocodrilo").required()
        .messages({
            "string.base": "El id_exhibicion debe ser una cadena de texto",
            "any.only": "El id_exhibicion debe ser: huemul, helice, chemomul o cocodrilo",
            "any.required": "El id_exhibicion es requerido"
        })
});
