"use strict";
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
    exportarVisitasCSV, 
    exportarQuizzesCSV, 
    exportarEstadisticasCSV 
} from "../controllers/csv.controller.js";

const router = Router();

// Rutas de exportación CSV (requieren autenticación)
router.get("/visitas", authenticate, exportarVisitasCSV);
router.get("/quizzes", authenticate, exportarQuizzesCSV);
router.get("/estadisticas", authenticate, exportarEstadisticasCSV);

export default router;
