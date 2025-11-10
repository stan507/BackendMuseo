"use strict";
// Importamos los dos "trabajadores" (servicios) que este gerente necesita
import * as minioService from '../services/minIO.service.js';
// (Más adelante importaremos aquí el 'database.service.js' para el Quiz)

/**
 * Maneja la petición de Unity para obtener una URL pre-firmada.
 * (Llamará a la función 'getPresignedUrl' del servicio)
 */
export const handleGetUrl = async (req, res) => {
    // Obtenemos el nombre del objeto de la URL (ej: ?object=huemul/modelo.glb)
    const { object } = req.query;

    if (!object) {
        return res.status(400).send({ error: 'Falta el parámetro "object"' });
    }

    console.log(`Controlador: Petición de URL para: ${object}`);
    try {
        // Le pide el trabajo al servicio
        const presignedUrl = await minioService.getPresignedUrl(object);
        
        // Responde a Unity con el JSON que espera
        res.json({ url: presignedUrl }); 
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};

/**
 * Maneja la petición de Unity para listar archivos de una carpeta (prefijo).
 * (Llamará a la función 'listFiles' del servicio)
 */
export const handleListFiles = async (req, res) => {
    // Obtenemos el prefijo (carpeta) de la URL (ej: ?prefix=huemul/fotos/)
    const { prefix } = req.query;

    if (!prefix) {
        return res.status(400).send({ error: 'Falta el parámetro "prefix"' });
    }

    console.log(`Controlador: Petición de lista para la carpeta: ${prefix}`);
    try {
        // Le pide el trabajo al servicio
        const files = await minioService.listFiles(prefix);
        
        // Responde a Unity con el JSON que espera
        res.json({ files: files }); 
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};
