"use strict";
import { Router } from 'express';
import {  handleGetUrl, handleListFiles } from '../controllers/minIO.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getPresignedUrlSchema, listFilesSchema } from '../validations/minIO.validation.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// --- RUTAS PROTEGIDAS PARA LA APP DE UNITY Y ADMIN ---
router.get("/presigned-url", authenticate, validate(getPresignedUrlSchema, 'query'), handleGetUrl);
router.get("/list-files", authenticate, validate(listFilesSchema, 'query'), handleListFiles);

// (Aquí pondremos después las rutas del admin, como POST /upload, DELETE /file, etc.)

export default router;