"use strict";
import { Router } from "express";
import minIORoutes from "./minIO.routes.js";
import exhibicionRoutes from "./exhibicion.routes.js";
import quizzRoutes from "./quizz.routes.js";
import usuarioRoutes from "./usuario.routes.js";
import visitaRoutes from "./visita.routes.js";
import respondeRoutes from "./responde.routes.js";
import authRoutes from "./auth.routes.js";


const router = Router();

// Ruta pública de autenticación (no requiere auth)
router.use("/auth", authRoutes);

// Todas las demás rutas están protegidas (se aplicará en cada ruta individual)
router
    .use("/museo", minIORoutes)
    .use("/exhibicion", exhibicionRoutes)
    .use("/quizz", quizzRoutes)
    .use("/usuario", usuarioRoutes)
    .use("/visita", visitaRoutes)
    .use("/responde", respondeRoutes);



export default router;