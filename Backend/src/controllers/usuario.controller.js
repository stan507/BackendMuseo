"use strict";
import {
    createUsuarioAnonimoService,
    registerUsuarioService,
    getAllUsuariosService,
    getUsuarioByIdService,
    updateUsuarioService,
    deleteUsuarioService
} from "../services/usuario.service.js";

// Crear usuario anónimo (para Unity)
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

// Registrar usuario (admin o encargado)
export async function registerUsuario(req, res) {
    try {
        const { nombre, apellido, correo, contrasena, rol } = req.body;

        const [usuario, error] = await registerUsuarioService(nombre, apellido, correo, contrasena, rol);

        if (error) {
            return res.status(400).json({
                message: error,
                data: null
            });
        }

        res.status(201).json({
            message: "Usuario registrado exitosamente",
            data: usuario
        });
    } catch (error) {
        console.error("Error en registerUsuario:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

// Obtener todos los usuarios
export async function getAllUsuarios(req, res) {
    try {
        const [usuarios, error] = await getAllUsuariosService();

        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Usuarios obtenidos exitosamente",
            data: usuarios
        });
    } catch (error) {
        console.error("Error en getAllUsuarios:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

// Obtener usuario por ID
export async function getUsuarioById(req, res) {
    try {
        const { id } = req.params;

        const [usuario, error] = await getUsuarioByIdService(id);

        if (error) {
            return res.status(404).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Usuario obtenido exitosamente",
            data: usuario
        });
    } catch (error) {
        console.error("Error en getUsuarioById:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

// Actualizar usuario
export async function updateUsuario(req, res) {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;

        const [usuario, error] = await updateUsuarioService(id, datosActualizados);

        if (error) {
            const statusCode = error === "Usuario no encontrado" ? 404 : 400;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: "Usuario actualizado exitosamente",
            data: usuario
        });
    } catch (error) {
        console.error("Error en updateUsuario:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}

// Eliminar usuario
export async function deleteUsuario(req, res) {
    try {
        const { id } = req.params;

        const [result, error] = await deleteUsuarioService(id);

        if (error) {
            return res.status(404).json({
                message: error,
                data: null
            });
        }

        res.status(200).json({
            message: result.message,
            data: null
        });
    } catch (error) {
        console.error("Error en deleteUsuario:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
}
