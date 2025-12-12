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
router.get("/", authenticate, getAllQuizzes);
router.get("/exhibicion/:id_exhibicion", authenticate, getQuizzByExhibicion);
router.get("/:id", authenticate, validate(getQuizzSchema, "params"), getQuizzById);
router.post("/", authenticate, authorize("admin", "encargado"), validate(createQuizzSchema, "body"), createQuizz);
router.put("/:id", authenticate, authorize("admin", "encargado"), validate(getQuizzSchema, "params"), validate(updateQuizzSchema, "body"), updateQuizz);
router.delete("/:id", authenticate, authorize("admin", "encargado"), validate(getQuizzSchema, "params"), deleteQuizz);

// Activar quiz - solo admin y encargado
router.patch("/:id/activar", authenticate, authorize("admin", "encargado"), validate(getQuizzSchema, "params"), activarQuizz);

export default router;
