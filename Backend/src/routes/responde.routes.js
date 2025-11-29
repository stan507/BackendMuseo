"use strict";
import { Router } from "express";
import {
    createResponde,
    getAllRespondes,
    getRespondesByQuizz
} from "../controllers/responde.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createRespondeSchema,
    getRespondesByQuizzSchema
} from "../validations/responde.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// GET all respuestas
router.get("/", authenticate, getAllRespondes);

// GET respuestas por quiz (ANTES de /:id si existiera)
router.get("/quizz/:id_quizz", authenticate, validate(getRespondesByQuizzSchema, "params"), getRespondesByQuizz);

// POST crear respuesta
router.post("/", authenticate, validate(createRespondeSchema, "body"), createResponde);

export default router;
