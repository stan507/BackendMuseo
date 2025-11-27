"use strict";
import jwt from "jsonwebtoken";
import { JWT_SECRET, UNITY_API_KEY } from "../config/configEnv.js";

/**
 * Middleware para autenticar con API Key (Unity) o JWT Token (Admin)
 */
export function authenticate(req, res, next) {
    // Verificar API Key primero (para Unity)
    const apiKey = req.headers["x-api-key"];
    
    if (apiKey === UNITY_API_KEY) {
        req.user = { tipo: "unity" };
        return next();
    }
    
    // Si no hay API Key, verificar JWT (para Admin)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ 
            message: "Acceso denegado: Se requiere API Key o Token de autenticación" 
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                message: "Token inválido o expirado" 
            });
        }
        
        req.user = { 
            tipo: "admin",
            id_usuario: decoded.id_usuario, 
            rol: decoded.rol 
        };
        next();
    });
}

/**
 * Middleware para rutas que SOLO admins pueden acceder
 */
export function authenticateAdmin(req, res, next) {
    authenticate(req, res, () => {
        if (req.user.tipo !== "admin" || req.user.rol !== "admin") {
            return res.status(403).json({ 
                message: "Acceso denegado: Se requiere rol de administrador" 
            });
        }
        next();
    });
}
