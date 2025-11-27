"use strict";
import Joi from "joi";

export const getSchema = Joi.object({

    idExhibicion: Joi.string().required().messages({
        "string.base": "El ID de la exhibición debe ser texto.",
        "any.required": "El ID de la exhibición es requerido en la URL.",
        "string.empty": "El ID de la exhibición no puede estar vacío.",
    }),
});

export const getByNameSchema = Joi.object({

    nombre: Joi.string().required().messages({
        "string.base": "El nombre debe ser texto.",
        "any.required": "El nombre es requerido en la URL.",
        "string.empty": "El nombre no puede estar vacío.",
    }),
});

export const updateSchema = Joi.object({
    
    nombre: Joi.string()
        .min(3)
        .max(100)
        .optional() 
        .messages({
            "string.base": "El nombre debe ser de tipo string.",
            "string.min": "El nombre debe tener al menos 3 caracteres.",
            "string.max": "El nombre no debe exceder los 100 caracteres.",
    }),

    relato_escrito: Joi.string()
        .min(10)
        .optional() 
        .messages({
            "string.base": "El relato debe ser de tipo string.",
            "string.min": "El relato debe tener al menos 10 caracteres.",
    }),
})
.unknown(false) 
.messages({
    "object.unknown": "No se permiten propiedades adicionales en el body."
});

