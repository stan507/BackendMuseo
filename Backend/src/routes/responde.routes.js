"use strict";
import { Router } from "express";
import { createResponde } from "../controllers/responde.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRespondeSchema } from "../validations/responde.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, validate(createRespondeSchema, "body"), createResponde);

export default router;
