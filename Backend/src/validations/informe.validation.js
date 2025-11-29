"use strict";
import Joi from "joi";

export const getInformeSchema = Joi.object({
    id: Joi.number().integer().positive().required()
        .messages({
            "number.base": "El ID debe ser un número",
            "number.integer": "El ID debe ser un número entero",
            "number.positive": "El ID debe ser positivo",
            "any.required": "El ID es requerido"
        })
});

export const createInformeSchema = Joi.object({
    id_usuario: Joi.string().uuid().required()
        .messages({
            "string.base": "El id_usuario debe ser una cadena de texto",
            "string.uuid": "El id_usuario debe ser un UUID válido",
            "any.required": "El id_usuario es requerido"
        }),
    descripcion: Joi.string().min(10).max(5000).required()
        .messages({
            "string.base": "La descripción debe ser una cadena de texto",
            "string.min": "La descripción debe tener al menos 10 caracteres",
            "string.max": "La descripción no puede exceder 5000 caracteres",
            "any.required": "La descripción es requerida"
        })
});

export const updateInformeSchema = Joi.object({
    descripcion: Joi.string().min(10).max(5000).required()
        .messages({
            "string.base": "La descripción debe ser una cadena de texto",
            "string.min": "La descripción debe tener al menos 10 caracteres",
            "string.max": "La descripción no puede exceder 5000 caracteres",
            "any.required": "La descripción es requerida"
        })
});
