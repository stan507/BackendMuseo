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
import { authorize } from "../middlewares/authorization.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, updateUsuarioSchema, uuidSchema } from "../validations/usuario.validation.js";

const router = Router();

// Crear usuario anónimo (para Unity) - cualquier autenticado
router.post("/", authenticate, createUsuarioAnonimo);

// Registrar usuario con contraseña - solo admin
router.post("/register", authenticate, authorize("admin"), validate(registerSchema, "body"), registerUsuario);

// Obtener todos los usuarios - admin y encargado
router.get("/", authenticate, authorize("admin", "encargado"), getAllUsuarios);

// Obtener usuario por ID - admin y encargado
router.get("/:id", authenticate, authorize("admin", "encargado"), validate(uuidSchema, "params"), getUsuarioById);

// Actualizar usuario - solo admin
router.put("/:id", authenticate, authorize("admin"), validate(uuidSchema, "params"), validate(updateUsuarioSchema, "body"), updateUsuario);

// Eliminar usuario - solo admin
router.delete("/:id", authenticate, authorize("admin"), validate(uuidSchema, "params"), deleteUsuario);

export default router;
