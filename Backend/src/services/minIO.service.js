"use strict";
import { minioClient, bucketName } from "../config/minio.config.js";

/**
 * CREAR y ACTUALIZAR: Sube un archivo a MinIO.
 * Si el 'nombreArchivo' ya existe, lo sobrescribe (Actualizar).
 * @param {Object} file - Objeto de multer (buffer, originalname, mimetype)
 * @param {string} objectKey - La ruta/nombre completo del archivo (ej: "huemul/fotos/foto1.jpg")
 */
export const subirArchivo = async (file, objectKey) => {
    if (!file || !file.buffer || !objectKey) {
        throw new Error("Archivo o nombre de objeto (objectKey) inválido");
    }

    await minioClient.putObject(
        bucketName,
        objectKey,
        file.buffer,
        file.mimetype
    );

    console.log(`[Servicio MinIO] Archivo subido/actualizado: ${objectKey}`);
    return { key: objectKey };
};

/**
 * BORRAR: Elimina un objeto del bucket de Minio.
 */
export const deleteFile = async (objectName) => {
    if (!objectName) {
        return [true, null];
    }
    try {
        await minioClient.removeObject(bucketName, objectName);
        console.log(`[Servicio MinIO] Archivo '${objectName}' eliminado.`);
        return [true, null];
    } catch (error) {
        console.error(`Error al eliminar el archivo '${objectName}':`, error);
        return [false, 'Error al eliminar el archivo.'];
    }
};


/**
 * LEER (Un solo objeto): Genera una URL pre-firmada para que Unity descargue un archivo.
 */
export const getPresignedUrl = async (objectName) => {
    try {
        // 1. Definimos la URL que queremos que vea el público (el puerto 1837)
        const endPointPublico = process.env.MINIO_ENDPOINT + ':1837';

        const url = await minioClient.presignedGetObject(
            bucketName,
            objectName,
            10 * 60,
            
            { 'Host': endPointPublico }
        );

        console.log(`[Servicio MinIO] URL pre-firmada generada para: ${objectName}`);
        return url;
    } catch (err) {
        // ... (Manejo de errores)
        console.error("Error en servicio getPresignedUrl:", err);
        throw new Error('No se pudo generar la URL');
    }
};

/**
 * LEER (Carpeta): Lista todos los archivos en una "carpeta" (prefijo) de MinIO.
 * (Para el Carrusel de Unity)
 */
export const listFiles = (prefix) => {
    return new Promise((resolve, reject) => {
        const files = [];
        // Busca en el bucket "museo" bajo el prefijo (ej: "helice/fotos/")
        const stream = minioClient.listObjects(bucketName, prefix, true); // true = recursivo

        // La lógica de stream.on('data') DEBE USAR object.name
        stream.on('data', (obj) => {
            // Solo añadimos archivos, ignoramos los directorios (que terminan en /)
            if (obj.name && !obj.name.endsWith('/')) {
                // Devolvemos la ruta/key completa (ej: "helice/fotos/foto1.jpg")
                files.push(obj.name);
            }
        });

        // 🚨 CORRECCIÓN DE ERROR 500: Manejo robusto del error del stream
        stream.on('error', (err) => {
            console.error('[Servicio MinIO] Error en listFiles:', err);
            // Rechaza la promesa con el error real
            reject(new Error('Fallo la operacion de listado de archivos. Revise la consola de MinIO para detalles.'));
        });

        // Fin del proceso: Devolver la lista.
        stream.on('end', () => {
            console.log(`[Servicio MinIO] Listado exitoso para el prefijo: ${prefix}. ${files.length} archivos encontrados.`);
            resolve(files); // Devuelve el array de rutas
        });
    });
};