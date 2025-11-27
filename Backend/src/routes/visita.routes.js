"use strict";
import { Router } from "express";
import { createVisita } from "../controllers/visita.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createVisitaSchema } from "../validations/visita.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, validate(createVisitaSchema, "body"), createVisita);

export default router;
