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
router.post("/", authenticate, createUsuarioAnonimo);

// Registrar usuario con contraseña - solo admin
router.post("/register", authenticate, authorize("admin"), validate(registerSchema, "body"), registerUsuario);
router.get("/", authenticate, authorize("admin", "encargado"), getAllUsuarios);
router.get("/:id", authenticate, authorize("admin", "encargado"), validate(uuidSchema, "params"), getUsuarioById);
router.put("/:id", authenticate, authorize("admin"), validate(uuidSchema, "params"), validate(updateUsuarioSchema, "body"), updateUsuario);
router.delete("/:id", authenticate, authorize("admin"), validate(uuidSchema, "params"), deleteUsuario);

export default router;
