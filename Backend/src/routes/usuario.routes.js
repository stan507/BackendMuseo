"use strict";
import { Router } from "express";
import {
    createUsuarioAnonimo,
    registerUsuario,
    getAllUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario
} from "../controllers/usuario.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, updateUsuarioSchema, uuidSchema } from "../validations/usuario.validation.js";

const router = Router();

// Crear usuario anónimo (para Unity)
router.post("/", authenticate, createUsuarioAnonimo);

// Registrar usuario con contraseña (admin/encargado)
router.post("/register", authenticate, validate(registerSchema, "body"), registerUsuario);

// Obtener todos los usuarios
router.get("/", authenticate, getAllUsuarios);

// Obtener usuario por ID
router.get("/:id", authenticate, validate(uuidSchema, "params"), getUsuarioById);

// Actualizar usuario
router.put("/:id", authenticate, validate(uuidSchema, "params"), validate(updateUsuarioSchema, "body"), updateUsuario);

// Eliminar usuario
router.delete("/:id", authenticate, validate(uuidSchema, "params"), deleteUsuario);

export default router;
