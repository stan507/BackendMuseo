"use strict";
import { Router } from 'express';
// Importamos los "gerentes" (controladores)
import { 
    handleGetUrl, 
    handleListFiles 
    } from '../controllers/minIO.controller.js';

const router = Router();

// --- RUTAS PARA LA APP DE UNITY ---

// Cuando Unity llame a "GET /api/museo/presigned-url", se ejecutará 'handleGetUrl'
router.get("/presigned-url", handleGetUrl);

// Cuando Unity llame a "GET /api/museo/list-files", se ejecutará 'handleListFiles'
router.get("/list-files", handleListFiles);

// (Aquí pondremos después las rutas del admin, como POST /upload, DELETE /file, etc.)

export default router;