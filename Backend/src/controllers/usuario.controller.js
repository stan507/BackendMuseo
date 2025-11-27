"use strict";
import { createUsuarioAnonimoService } from "../services/usuario.service.js";

export async function createUsuarioAnonimo(req, res) {
    try {
        const [usuario, error] = await createUsuarioAnonimoService();

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(201).json({
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol
        });
    } catch (error) {
        console.error("Error en createUsuarioAnonimo:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
