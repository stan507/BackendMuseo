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
