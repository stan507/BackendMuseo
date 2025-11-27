"use strict";
import { AppDataSource } from "../config/configDb.js";
import { Usuario } from "../entity/Usuario.entity.js";

export async function createUsuarioAnonimoService() {
    try {
        const usuarioRepo = AppDataSource.getRepository(Usuario);

        // Crear usuario anónimo con timestamp para hacerlo único
        const timestamp = Date.now();
        const nuevoUsuario = {
            nombre: "Visitante",
            apellido: `Anónimo`,
            correo: `visitante_${timestamp}@museo.app`,
            rol: "visitante"
        };

        const usuarioCreado = await usuarioRepo.save(nuevoUsuario);

        return [usuarioCreado, null];
    } catch (error) {
        console.error("Error en createUsuarioAnonimoService:", error);
        return [null, "Error interno del servidor"];
    }
}
