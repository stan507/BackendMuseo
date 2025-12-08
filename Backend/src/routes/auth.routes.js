"use strict";
import { Router } from "express";
import { login, deviceLogin } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/device-login", deviceLogin);

export default router;
