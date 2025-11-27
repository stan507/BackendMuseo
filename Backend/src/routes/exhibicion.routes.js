"use strict";
import { Router } from "express";
import * as RelatoController from "../controllers/exhibicion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { getSchema, getByNameSchema, updateSchema } from "../validations/exhibicion.validation.js";
import { authenticate, authenticateAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// GET por ID - protegido (Unity o Admin)
router.get("/:idExhibicion", authenticate, validate(getSchema, 'params'), RelatoController.obtenerExhibicion);

// GET por nombre - protegido (Unity o Admin)
router.get("/nombre/:nombre", authenticate, validate(getByNameSchema, 'params'), RelatoController.obtenerExhibicionPorNombre);

// PUT - solo Admin
router.put("/:idExhibicion", 
    authenticateAdmin,
    validate(getSchema, 'params'), 
    validate(updateSchema, 'body'), 
    RelatoController.actualizarExhibicion
);

export default router;