"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Usuario } from "../entity/Usuario.entity.js";
import bcrypt from "bcryptjs";
export async function createUsuarioAnonimoService() {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);

        const nuevoUsuario = {
            nombre: "Visitante",
            apellido: "Anónimo",
            correo: null, // Anónimos sin correo
            contrasena: null,
            rol: "anonimo"
        };

        const usuarioCreado = await usuarioRepo.save(nuevoUsuario);

        return [usuarioCreado, null];
    } catch (error) {
        console.error("Error en createUsuarioAnonimoService:", error);
        return [null, "Error interno del servidor"];
    }
}

// Registrar usuario con contraseña (admin o encargado)
export async function registerUsuarioService(nombre, apellido, correo, contrasena, rol) {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);

        // Verificar si el correo ya existe
        const usuarioExistente = await usuarioRepo.findOne({ where: { correo } });
        if (usuarioExistente) {
            return [null, "El correo ya está registrado"];
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const contrasenaHash = await bcrypt.hash(contrasena, salt);

        const nuevoUsuario = {
            nombre,
            apellido,
            correo,
            contrasena: contrasenaHash,
            rol
        };

        const usuarioCreado = await usuarioRepo.save(nuevoUsuario);

        // No devolver la contraseña
        const { contrasena: _, ...usuarioSinContrasena } = usuarioCreado;

        return [usuarioSinContrasena, null];
    } catch (error) {
        console.error("Error en registerUsuarioService:", error);
        return [null, "Error interno del servidor"];
    }
}
export async function getAllUsuariosService() {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const usuarios = await usuarioRepo.find({
            select: ["id_usuario", "nombre", "apellido", "correo", "rol"]
        });

        return [usuarios, null];
    } catch (error) {
        console.error("Error en getAllUsuariosService:", error);
        return [null, "Error interno del servidor"];
    }
}
export async function getUsuarioByIdService(id_usuario) {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const usuario = await usuarioRepo.findOne({
            where: { id_usuario },
            select: ["id_usuario", "nombre", "apellido", "correo", "rol"]
        });

        if (!usuario) {
            return [null, "Usuario no encontrado"];
        }

        return [usuario, null];
    } catch (error) {
        console.error("Error en getUsuarioByIdService:", error);
        return [null, "Error interno del servidor"];
    }
}
export async function updateUsuarioService(id_usuario, datosActualizados) {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);

        const usuario = await usuarioRepo.findOne({ where: { id_usuario } });
        if (!usuario) {
            return [null, "Usuario no encontrado"];
        }

        // Si se actualiza la contraseña, encriptarla
        if (datosActualizados.contrasena) {
            const salt = await bcrypt.genSalt(10);
            datosActualizados.contrasena = await bcrypt.hash(datosActualizados.contrasena, salt);
        }

        // Si se actualiza el correo, verificar que no exista
        if (datosActualizados.correo && datosActualizados.correo !== usuario.correo) {
            const correoExistente = await usuarioRepo.findOne({ 
                where: { correo: datosActualizados.correo } 
            });
            if (correoExistente) {
                return [null, "El correo ya está registrado"];
            }
        }

        // Proteger contra cambio de rol del último admin
        if (datosActualizados.rol && usuario.rol === 'admin' && datosActualizados.rol !== 'admin') {
            const cantidadAdmins = await usuarioRepo.count({ where: { rol: 'admin' } });
            if (cantidadAdmins <= 1) {
                return [null, "No se puede cambiar el rol del último administrador. Debe existir al menos un admin en el sistema."];
            }
        }

        await usuarioRepo.update({ id_usuario }, datosActualizados);

        const usuarioActualizado = await usuarioRepo.findOne({
            where: { id_usuario },
            select: ["id_usuario", "nombre", "apellido", "correo", "rol"]
        });

        return [usuarioActualizado, null];
    } catch (error) {
        console.error("Error en updateUsuarioService:", error);
        return [null, "Error interno del servidor"];
    }
}
export async function deleteUsuarioService(id_usuario) {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);

        const usuario = await usuarioRepo.findOne({ where: { id_usuario } });
        if (!usuario) {
            return [null, "Usuario no encontrado"];
        }

        // Proteger al administrador principal
        if (usuario.correo === "admin@museo.cl") {
            return [null, "No se puede eliminar el administrador principal del sistema"];
        }

        // Verificar si es el último admin
        if (usuario.rol === 'admin') {
            const cantidadAdmins = await usuarioRepo.count({ where: { rol: 'admin' } });
            if (cantidadAdmins <= 1) {
                return [null, "No se puede eliminar el último administrador del sistema. Debe existir al menos un admin."];
            }
        }

        await usuarioRepo.delete({ id_usuario });

        return [{ message: "Usuario eliminado exitosamente" }, null];
    } catch (error) {
        console.error("Error en deleteUsuarioService:", error);
        return [null, "Error interno del servidor"];
    }
}
