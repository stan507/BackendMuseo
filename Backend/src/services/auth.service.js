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
        
        // Verificar password (si existe en BD)
        if (usuario.password) {
            const passwordValido = await bcryptjs.compare(password, usuario.password);
            
            if (!passwordValido) {
                return [null, "Credenciales inválidas"];
            }
        } else {
            // Si no tiene password guardado, comparar directo (temporal)
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
