"use strict";
import { Router } from 'express';
import { handleGetUrl, handleListFiles, handleUploadFile, handleDeleteFile } from '../controllers/minIO.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getPresignedUrlSchema, listFilesSchema } from '../validations/minIO.validation.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { upload } from '../config/multer.config.js';

const router = Router();

// --- RUTAS PROTEGIDAS PARA LA APP DE UNITY Y ADMIN ---
router.get("/presigned-url", authenticate, validate(getPresignedUrlSchema, 'query'), handleGetUrl);
router.get("/list-files", authenticate, validate(listFilesSchema, 'query'), handleListFiles);

// Upload de archivo(s) (solo admin/encargado) - soporta múltiples archivos
router.post("/upload", authenticate, upload.array('files', 10), handleUploadFile);

// Delete de archivo (solo admin/encargado)
router.delete("/file", authenticate, handleDeleteFile);

export default router;