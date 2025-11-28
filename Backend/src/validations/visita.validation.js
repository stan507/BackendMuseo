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
        })
});
