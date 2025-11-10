"use strict";
import { Router } from "express";
import minIORoutes from "./minIO.routes.js"; 


const router = Router();

router
    .use("/museo", minIORoutes);



export default router;