"use strict";
import Joi from "joi";

export const getPresignedUrlSchema = Joi.object({
    object: Joi.string().required().messages({
        "string.base": "El parámetro 'object' debe ser texto.",
        "any.required": "El parámetro 'object' es requerido.",
        "string.empty": "El parámetro 'object' no puede estar vacío.",
    }),
});

export const listFilesSchema = Joi.object({
    prefix: Joi.string().required().messages({
        "string.base": "El parámetro 'prefix' debe ser texto.",
        "any.required": "El parámetro 'prefix' es requerido.",
        "string.empty": "El parámetro 'prefix' no puede estar vacío.",
    }),
});
