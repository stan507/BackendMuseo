"use strict";
import { loginService, deviceLoginService } from "../services/auth.service.js";

export async function login(req, res) {
    try {
        const { correo, password } = req.body;
        
        if (!correo || !password) {
            return res.status(400).json({ 
                message: "Correo y contraseña son requeridos" 
            });
        }
        
        const [result, error] = await loginService(correo, password);
        
        if (error) {
            return res.status(401).json({ message: error });
        }
        
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ 
            message: "Error interno del servidor" 
        });
    }
}

export async function deviceLogin(req, res) {
    try {
        const { device_id } = req.body;
        
        if (!device_id) {
            return res.status(400).json({ 
                message: "device_id es requerido" 
            });
        }
        
        const [result, error] = await deviceLoginService(device_id);
        
        if (error) {
            return res.status(500).json({ message: error });
        }
        
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en deviceLogin:", error);
        res.status(500).json({ 
            message: "Error interno del servidor" 
        });
    }
}
