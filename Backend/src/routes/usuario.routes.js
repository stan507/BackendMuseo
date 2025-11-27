"use strict";
import { Router } from "express";
import { createUsuarioAnonimo } from "../controllers/usuario.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, createUsuarioAnonimo);

export default router;
