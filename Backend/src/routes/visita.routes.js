"use strict";
import { Router } from "express";
import {
    createVisita,
    updateDuracionVisita,
    getAllVisitas,
    getVisitaById,
    getVisitasByExhibicion
} from "../controllers/visita.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createVisitaSchema,
    updateDuracionSchema,
    getVisitaSchema,
    getVisitasByExhibicionSchema
} from "../validations/visita.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// GET all visitas
router.get("/", authenticate, getAllVisitas);

// GET visitas por exhibicion (ANTES de /:id)
router.get("/exhibicion/:id_exhibicion", authenticate, validate(getVisitasByExhibicionSchema, "params"), getVisitasByExhibicion);

// GET visita by ID
router.get("/:id", authenticate, validate(getVisitaSchema, "params"), getVisitaById);

// POST crear visita
router.post("/", authenticate, validate(createVisitaSchema, "body"), createVisita);

// PUT actualizar duracion
router.put("/:id", authenticate, validate(updateDuracionSchema, "body"), updateDuracionVisita);

export default router;
