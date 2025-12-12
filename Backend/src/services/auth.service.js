"use strict";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { AppDataSource } from "../config/configDb.js";
import { Usuario } from "../entity/Usuario.entity.js";
import { JWT_SECRET } from "../config/configEnv.js";

export async function loginService(correo, password) {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        
        const usuario = await usuarioRepo.findOne({ 
            where: { correo, rol: "admin" } 
        });
        
        if (!usuario) {
            return [null, "Credenciales inválidas"];
        }
        
        // Verificar contraseña (si existe en BD)
        if (usuario.contrasena) {
            const passwordValido = await bcryptjs.compare(password, usuario.contrasena);
            
            if (!passwordValido) {
                return [null, "Credenciales inválidas"];
            }
        } else {
            // Si no tiene contraseña guardada, comparar directo (temporal)
            if (password !== "admin123") {
                return [null, "Credenciales inválidas"];
            }
        }
        
        // Generar JWT
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                rol: usuario.rol 
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );
        
        return [{ 
            token, 
            usuario: { 
                id_usuario: usuario.id_usuario,
                correo: usuario.correo, 
                nombre: usuario.nombre,
                rol: usuario.rol 
            } 
        }, null];
    } catch (error) {
        console.error("Error en loginService:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function deviceLoginService(device_id) {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const emailDispositivo = `device_${device_id}@museo.local`;
        let usuario = await usuarioRepo.findOne({ 
            where: { correo: emailDispositivo } 
        });
        
        // Si no existe, crear uno nuevo automáticamente
        if (!usuario) {
            usuario = await usuarioRepo.save({
                correo: emailDispositivo,
                nombre: `Dispositivo ${device_id.substring(0, 8)}`,
                apellido: "Anónimo", // Apellido por defecto para dispositivos
                rol: "visitante",
                contrasena: null // Sin contraseña para dispositivos
            });
            console.log(`Nuevo dispositivo registrado: ${device_id}`);
        }
        
        // Generar JWT
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                rol: usuario.rol,
                device_id: device_id
            },
            JWT_SECRET,
            { expiresIn: "30d" } // Token más largo para dispositivos
        );
        
        return [{ 
            token, 
            usuario: { 
                id_usuario: usuario.id_usuario,
                correo: usuario.correo, 
                nombre: usuario.nombre,
                rol: usuario.rol,
                device_id: device_id
            } 
        }, null];
    } catch (error) {
        console.error("Error en deviceLoginService:", error);
        return [null, "Error interno del servidor"];
    }
}
