"use strict";
import Joi from "joi";

export const getQuizzSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "El ID debe ser un número",
            "number.integer": "El ID debe ser un número entero",
            "number.positive": "El ID debe ser positivo",
            "any.required": "El ID es requerido"
        })
});

// Validación para respuestas (nested)
const respuestaSchema = Joi.object({
    texto: Joi.string()
        .min(1)
        .max(500)
        .required()
        .messages({
            "string.base": "El texto de la respuesta debe ser texto",
            "string.min": "El texto debe tener al menos 1 carácter",
            "string.max": "El texto no debe exceder 500 caracteres",
            "any.required": "El texto de la respuesta es requerido"
        }),
    es_correcta: Joi.boolean()
        .required()
        .messages({
            "boolean.base": "es_correcta debe ser true o false",
            "any.required": "es_correcta es requerido"
        })
});

// Validación para preguntas (nested con respuestas)
const preguntaSchema = Joi.object({
    titulo: Joi.string()
        .min(3)
        .max(200)
        .required()
        .messages({
            "string.base": "El título debe ser texto",
            "string.min": "El título debe tener al menos 3 caracteres",
            "string.max": "El título no debe exceder 200 caracteres",
            "any.required": "El título es requerido"
        }),
    texto: Joi.string()
        .min(5)
        .max(1000)
        .required()
        .messages({
            "string.base": "El texto debe ser texto",
            "string.min": "El texto debe tener al menos 5 caracteres",
            "string.max": "El texto no debe exceder 1000 caracteres",
            "any.required": "El texto de la pregunta es requerido"
        }),
    respuestas: Joi.array()
        .items(respuestaSchema)
        .min(2)
        .required()
        .messages({
            "array.base": "respuestas debe ser un array",
            "array.min": "Debe haber al menos 2 respuestas por pregunta",
            "any.required": "Las respuestas son requeridas"
        })
});

// Validación para crear quiz completo (nested)
export const createQuizzSchema = Joi.object({
    id_usuario: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.base": "id_usuario debe ser texto",
            "string.guid": "id_usuario debe ser un UUID válido",
            "any.required": "id_usuario es requerido"
        }),
    titulo: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            "string.base": "El título debe ser texto",
            "string.min": "El título debe tener al menos 5 caracteres",
            "string.max": "El título no debe exceder 200 caracteres",
            "any.required": "El título es requerido"
        }),
    preguntas: Joi.array()
        .items(preguntaSchema)
        .min(1)
        .required()
        .messages({
            "array.base": "preguntas debe ser un array",
            "array.min": "Debe haber al menos 1 pregunta",
            "any.required": "Las preguntas son requeridas"
        })
})
.unknown(false)
.messages({
    "object.unknown": "No se permiten propiedades adicionales"
});

// Validación para actualizar quiz (sin id_usuario)
export const updateQuizzSchema = Joi.object({
    titulo: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            "string.base": "El título debe ser texto",
            "string.min": "El título debe tener al menos 5 caracteres",
            "string.max": "El título no debe exceder 200 caracteres",
            "any.required": "El título es requerido"
        }),
    preguntas: Joi.array()
        .items(preguntaSchema)
        .min(1)
        .required()
        .messages({
            "array.base": "preguntas debe ser un array",
            "array.min": "Debe haber al menos 1 pregunta",
            "any.required": "Las preguntas son requeridas"
        })
})
.unknown(false)
.messages({
    "object.unknown": "No se permiten propiedades adicionales"
});
