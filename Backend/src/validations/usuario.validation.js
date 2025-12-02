"use strict";
import Joi from "joi";

// Validación para registro de usuario (admin o encargado)
export const registerSchema = Joi.object({
    nombre: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "El nombre debe ser texto.",
            "string.min": "El nombre debe tener al menos 2 caracteres.",
            "string.max": "El nombre no debe exceder los 100 caracteres.",
            "any.required": "El nombre es requerido.",
        }),
    
    apellido: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "El apellido debe ser texto.",
            "string.min": "El apellido debe tener al menos 2 caracteres.",
            "string.max": "El apellido no debe exceder los 100 caracteres.",
            "any.required": "El apellido es requerido.",
        }),
    
    correo: Joi.string()
        .email()
        .max(255)
        .required()
        .messages({
            "string.base": "El correo debe ser texto.",
            "string.email": "El correo debe ser un email válido.",
            "string.max": "El correo no debe exceder los 255 caracteres.",
            "any.required": "El correo es requerido.",
        }),
    
    contrasena: Joi.string()
        .min(6)
        .max(255)
        .required()
        .messages({
            "string.base": "La contraseña debe ser texto.",
            "string.min": "La contraseña debe tener al menos 6 caracteres.",
            "string.max": "La contraseña no debe exceder los 255 caracteres.",
            "any.required": "La contraseña es requerida.",
        }),
    
    rol: Joi.string()
        .valid("admin", "encargado")
        .required()
        .messages({
            "string.base": "El rol debe ser texto.",
            "any.only": "El rol debe ser: admin o encargado.",
            "any.required": "El rol es requerido.",
        }),
})
.unknown(false)
.messages({
    "object.unknown": "No se permiten propiedades adicionales en el body."
});

// Validación para actualizar usuario
export const updateUsuarioSchema = Joi.object({
    nombre: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            "string.base": "El nombre debe ser texto.",
            "string.min": "El nombre debe tener al menos 2 caracteres.",
            "string.max": "El nombre no debe exceder los 100 caracteres.",
        }),
    
    apellido: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            "string.base": "El apellido debe ser texto.",
            "string.min": "El apellido debe tener al menos 2 caracteres.",
            "string.max": "El apellido no debe exceder los 100 caracteres.",
        }),
    
    correo: Joi.string()
        .email()
        .max(255)
        .optional()
        .messages({
            "string.base": "El correo debe ser texto.",
            "string.email": "El correo debe ser un email válido.",
            "string.max": "El correo no debe exceder los 255 caracteres.",
        }),
    
    contrasena: Joi.string()
        .min(6)
        .max(255)
        .optional()
        .messages({
            "string.base": "La contraseña debe ser texto.",
            "string.min": "La contraseña debe tener al menos 6 caracteres.",
            "string.max": "La contraseña no debe exceder los 255 caracteres.",
        }),
    
    rol: Joi.string()
        .valid("admin", "encargado")
        .optional()
        .messages({
            "string.base": "El rol debe ser texto.",
            "any.only": "El rol debe ser: admin o encargado.",
        }),
})
.min(1)
.unknown(false)
.messages({
    "object.min": "Debe proporcionar al menos un campo para actualizar.",
    "object.unknown": "No se permiten propiedades adicionales en el body."
});

// Validación para parámetro UUID
export const uuidSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.base": "El ID debe ser texto.",
            "string.guid": "El ID debe ser un UUID válido.",
            "any.required": "El ID es requerido en la URL.",
        }),
});
