"use strict";
import { Router } from "express";
import {
    getAllInformes,
    getInformeById,
    createInforme,
    updateInforme,
    deleteInforme
} from "../controllers/informe.controller.js";
import { generarInformePDF } from "../controllers/pdf.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    getInformeSchema,
    createInformeSchema,
    updateInformeSchema
} from "../validations/informe.validation.js";

const router = Router();

// GET PDF de estadísticas (ANTES de /:id)
router.get("/pdf", authenticate, generarInformePDF);

// GET all informes
router.get("/", authenticate, getAllInformes);

// GET informe by ID
router.get("/:id", authenticate, validate(getInformeSchema, "params"), getInformeById);

// POST crear informe
router.post("/", authenticate, validate(createInformeSchema, "body"), createInforme);

// PUT actualizar informe
router.put("/:id", authenticate, validate(getInformeSchema, "params"), validate(updateInformeSchema, "body"), updateInforme);

// DELETE eliminar informe
router.delete("/:id", authenticate, validate(getInformeSchema, "params"), deleteInforme);

export default router;
