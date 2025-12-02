"use strict";
import { Router } from "express";
import * as RelatoController from "../controllers/exhibicion.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { getSchema, getByNameSchema, updateSchema } from "../validations/exhibicion.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// GET todas las exhibiciones - cualquier autenticado
router.get("/", authenticate, RelatoController.getAllExhibiciones);

// GET por ID - cualquier autenticado
router.get("/:idExhibicion", authenticate, validate(getSchema, 'params'), RelatoController.obtenerExhibicion);

// GET por nombre - cualquier autenticado
router.get("/nombre/:nombre", authenticate, validate(getByNameSchema, 'params'), RelatoController.obtenerExhibicionPorNombre);

// PUT - solo admin y encargado
router.put("/:idExhibicion", 
    authenticate,
    authorize("admin", "encargado"),
    validate(getSchema, 'params'), 
    validate(updateSchema, 'body'), 
    RelatoController.actualizarExhibicion
);

export default router;