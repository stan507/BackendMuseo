"use strict";
import { Router } from "express";
import { getQuizzById } from "../controllers/quizz.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { getQuizzSchema } from "../validations/quizz.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:id", authenticate, validate(getQuizzSchema, "params"), getQuizzById);

export default router;
