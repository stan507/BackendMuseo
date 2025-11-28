"use strict";
import { Router } from "express";
import {
    getAllQuizzes,
    getQuizzById,
    createQuizz,
    updateQuizz,
    deleteQuizz
} from "../controllers/quizz.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { getQuizzSchema, createQuizzSchema, updateQuizzSchema } from "../validations/quizz.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Obtener todos los quizzes
router.get("/", authenticate, getAllQuizzes);

// Obtener quiz por ID
router.get("/:id", authenticate, validate(getQuizzSchema, "params"), getQuizzById);

// Crear quiz completo (nested)
router.post("/", authenticate, validate(createQuizzSchema, "body"), createQuizz);

// Actualizar quiz completo (nested)
router.put("/:id", authenticate, validate(getQuizzSchema, "params"), validate(updateQuizzSchema, "body"), updateQuizz);

// Eliminar quiz
router.delete("/:id", authenticate, validate(getQuizzSchema, "params"), deleteQuizz);

export default router;
