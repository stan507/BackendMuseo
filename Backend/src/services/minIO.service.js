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
 * UPLOAD: Sube un archivo a MinIO en la estructura museo/subcarpeta/tipo/archivo
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} subcarpeta - huemul, helice, chemomul, cocodrilo
 * @param {string} tipoArchivo - videos, fotos, audios, modelo3D, textura
 * @param {string} nombreArchivo - Nombre del archivo
 * @param {string} mimetype - Tipo MIME del archivo
 */
export const uploadFileService = async (fileBuffer, subcarpeta, tipoArchivo, nombreArchivo, mimetype) => {
    try {
        // Construir path: subcarpeta/tipoArchivo/nombreArchivo
        const objectPath = `${subcarpeta}/${tipoArchivo}/${nombreArchivo}`;
        
        await minioClient.putObject(
            bucketName,
            objectPath,
            fileBuffer,
            fileBuffer.length,
            { 'Content-Type': mimetype }
        );
        
        console.log(`[MinIO] Archivo subido: ${objectPath}`);
        return [{ path: objectPath, filename: nombreArchivo }, null];
    } catch (error) {
        console.error("Error en uploadFileService:", error);
        return [null, "Error al subir el archivo a MinIO"];
    }
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
 * DELETE: Elimina un archivo de MinIO por path completo
 * @param {string} filePath - Path completo del archivo (ej: huemul/fotos/foto1.jpg)
 */
export const deleteFileService = async (filePath) => {
    try {
        console.log(`[MinIO] Intentando eliminar: ${bucketName}/${filePath}`);
        
        // Verificar si el archivo existe
        try {
            await minioClient.statObject(bucketName, filePath);
            console.log(`[MinIO] Archivo existe, procediendo a eliminar`);
        } catch (statError) {
            if (statError.code === 'NotFound') {
                console.log(`[MinIO] Archivo no encontrado: ${filePath}`);
                return [null, "Archivo no encontrado en MinIO"];
            }
            throw statError;
        }
        
        // Eliminar archivo
        await minioClient.removeObject(bucketName, filePath);
        
        console.log(`[MinIO] ✅ Archivo eliminado exitosamente: ${filePath}`);
        return [{ message: "Archivo eliminado exitosamente" }, null];
    } catch (error) {
        console.error("[MinIO] ❌ Error en deleteFileService:", error);
        console.error("[MinIO] Detalles:", {
            code: error.code,
            message: error.message,
            bucket: bucketName,
            filePath: filePath
        });
        return [null, `Error al eliminar el archivo: ${error.message}`];
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
                // Devolvemos objeto completo con metadatos
                files.push({
                    name: obj.name,
                    size: obj.size || 0,
                    lastModified: obj.lastModified || new Date()
                });
            }
        });

        // 🚨 CORRECCIÓN DE ERROR 500: Manejo robusto del error del stream
        stream.on('error', (err) => {
            console.error('[Servicio MinIO] Error en listFiles:', err);
            console.error('[Servicio MinIO] Detalles del error:', {
                code: err.code,
                message: err.message,
                bucket: bucketName,
                prefix: prefix
            });
            // Rechaza la promesa con el error real
            reject(new Error(`Error al listar archivos: ${err.message}`));
        });

        // Fin del proceso: Devolver la lista.
        stream.on('end', () => {
            console.log(`[Servicio MinIO] Listado exitoso para el prefijo: '${prefix}'. ${files.length} archivos encontrados.`);
            if (files.length === 0) {
                console.log(`[Servicio MinIO] ⚠️ No se encontraron archivos con el prefijo: '${prefix}'`);
                console.log(`[Servicio MinIO] Verifica que la estructura sea: ${bucketName}/${prefix}archivo.ext`);
            }
            resolve(files); // Devuelve el array de objetos con metadatos
        });
    });
};