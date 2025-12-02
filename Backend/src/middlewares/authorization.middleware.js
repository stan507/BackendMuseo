"use strict";

/**
 * Middleware para verificar roles de usuario
 * @param {string[]} rolesPermitidos - Array de roles que pueden acceder
 */
export function authorize(...rolesPermitidos) {
    return (req, res, next) => {
        try {
            // req.user viene del middleware authenticate
            if (!req.user) {
                return res.status(401).json({
                    message: "No autenticado",
                    data: null
                });
            }

            // Verificar si el rol del usuario está en los roles permitidos
            if (!rolesPermitidos.includes(req.user.rol)) {
                return res.status(403).json({
                    message: "No tienes permisos para realizar esta acción",
                    data: null
                });
            }

            next();
        } catch (error) {
            console.error("Error en middleware authorize:", error);
            return res.status(500).json({
                message: "Error interno del servidor",
                data: null
            });
        }
    };
}
