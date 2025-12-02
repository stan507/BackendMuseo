"use strict";
import { Router } from "express";
import {
    getAllQuizzes,
    getQuizzById,
    getQuizzByExhibicion,
    createQuizz,
    updateQuizz,
    deleteQuizz,
    activarQuizz
} from "../controllers/quizz.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { getQuizzSchema, createQuizzSchema, updateQuizzSchema } from "../validations/quizz.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// Obtener todos los quizzes - cualquier autenticado
router.get("/", authenticate, getAllQuizzes);

// Obtener quiz por exhibición - cualquier autenticado
router.get("/exhibicion/:id_exhibicion", authenticate, getQuizzByExhibicion);

// Obtener quiz por ID - cualquier autenticado
router.get("/:id", authenticate, validate(getQuizzSchema, "params"), getQuizzById);

// Crear quiz completo - solo admin y encargado
router.post("/", authenticate, authorize("admin", "encargado"), validate(createQuizzSchema, "body"), createQuizz);

// Actualizar quiz completo - solo admin y encargado
router.put("/:id", authenticate, authorize("admin", "encargado"), validate(getQuizzSchema, "params"), validate(updateQuizzSchema, "body"), updateQuizz);

// Eliminar quiz - solo admin y encargado
router.delete("/:id", authenticate, authorize("admin", "encargado"), validate(getQuizzSchema, "params"), deleteQuizz);

// Activar quiz - solo admin y encargado
router.patch("/:id/activar", authenticate, authorize("admin", "encargado"), validate(getQuizzSchema, "params"), activarQuizz);

export default router;
