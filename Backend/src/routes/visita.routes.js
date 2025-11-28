"use strict";
import { Router } from "express";
import { createVisita, updateDuracionVisita } from "../controllers/visita.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createVisitaSchema, updateDuracionSchema } from "../validations/visita.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, validate(createVisitaSchema, "body"), createVisita);
router.put("/:id", authenticate, validate(updateDuracionSchema, "body"), updateDuracionVisita);

export default router;
