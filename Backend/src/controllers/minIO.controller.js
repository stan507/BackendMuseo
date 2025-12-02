"use strict";
import * as minioService from '../services/minIO.service.js';

export const handleGetUrl = async (req, res) => {
    const { object } = req.query;

    console.log(`Controlador: Petición de URL para: ${object}`);
    try {
        const presignedUrl = await minioService.getPresignedUrl(object);
        res.json({ url: presignedUrl }); 
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};

export const handleListFiles = async (req, res) => {
    const { prefix } = req.query;

    console.log(`Controlador: Petición de lista para la carpeta: ${prefix}`);
    try {
        const files = await minioService.listFiles(prefix);
        res.json({ files: files }); 
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};

// Upload de archivo(s) - soporta múltiples archivos
export const handleUploadFile = async (req, res) => {
    try {
        const { subcarpeta, tipo } = req.body;
        
        // Multer puede parsear múltiples archivos en req.files o un solo archivo en req.file
        const archivos = req.files || (req.file ? [req.file] : []);
        
        if (!archivos || archivos.length === 0) {
            return res.status(400).json({
                message: "No se proporcionaron archivos",
                data: null
            });
        }
        
        if (!subcarpeta || !tipo) {
            return res.status(400).json({
                message: "subcarpeta y tipo son requeridos",
                data: null
            });
        }

        // Validaciones comunes
        const caracteresProblematicos = /[^a-zA-Z0-9._-]/g;
        const subcarpetasValidas = ['huemul', 'helice', 'chemomul', 'cocodrilo'];
        const tiposValidos = ['videos', 'fotos', 'audios', 'modelo3D', 'textura'];
        const extensionesPorTipo = {
            fotos: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            videos: ['mp4', 'mpeg', 'mpg', 'mov', 'avi', 'webm'],
            audios: ['mp3', 'wav', 'ogg'],
            modelo3D: ['gltf', 'glb', 'bin'],
            textura: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        };

        // Validar subcarpeta y tipo una sola vez
        if (!subcarpetasValidas.includes(subcarpeta)) {
            return res.status(400).json({
                message: `subcarpeta inválida. Debe ser: ${subcarpetasValidas.join(', ')}`,
                data: null
            });
        }
        
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                message: `tipo inválido. Debe ser: ${tiposValidos.join(', ')}`,
                data: null
            });
        }

        // Validar todos los archivos antes de subir
        for (const archivo of archivos) {
            const nombreArchivo = archivo.originalname;
            
            if (caracteresProblematicos.test(nombreArchivo)) {
                return res.status(400).json({
                    message: `Archivo "${nombreArchivo}": nombre inválido. Solo se permiten letras, números, guiones, guiones bajos y puntos.`,
                    data: null
                });
            }

            if (nombreArchivo.startsWith('.') || nombreArchivo.startsWith('-')) {
                return res.status(400).json({
                    message: `Archivo "${nombreArchivo}": no puede comenzar con punto o guion`,
                    data: null
                });
            }

            if (nombreArchivo.length > 200) {
                return res.status(400).json({
                    message: `Archivo "${nombreArchivo}": nombre demasiado largo (máximo 200 caracteres)`,
                    data: null
                });
            }
            
            const ext = nombreArchivo.toLowerCase().split('.').pop();
            if (!extensionesPorTipo[tipo].includes(ext)) {
                return res.status(400).json({
                    message: `Archivo "${nombreArchivo}": extensión .${ext} no válida para tipo ${tipo}. Extensiones aceptadas: ${extensionesPorTipo[tipo].join(', ')}`,
                    data: null
                });
            }
        }

        // Subir todos los archivos
        const resultados = [];
        const errores = [];

        for (const archivo of archivos) {
            const [result, error] = await minioService.uploadFileService(
                archivo.buffer,
                subcarpeta,
                tipo,
                archivo.originalname,
                archivo.mimetype
            );

            if (error) {
                errores.push({ archivo: archivo.originalname, error });
            } else {
                resultados.push({ archivo: archivo.originalname, ...result });
            }
        }

        // Si todos fallaron
        if (errores.length === archivos.length) {
            return res.status(500).json({ 
                message: "Todos los archivos fallaron al subir",
                data: null,
                errores 
            });
        }

        // Si algunos fallaron
        if (errores.length > 0) {
            return res.status(207).json({ 
                message: `${resultados.length} archivo(s) subido(s), ${errores.length} fallaron`,
                data: resultados,
                errores 
            });
        }

        // Todos exitosos
        return res.status(201).json({ 
            message: `${resultados.length} archivo(s) subido(s) exitosamente`,
            data: resultados 
        });
        
    } catch (error) {
        console.error('Error en handleUploadFile:', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            data: null
        });
    }
};

// Delete de archivo
export const handleDeleteFile = async (req, res) => {
    try {
        // Soportar tanto query params como body
        const objectName = req.query.objectName || req.body.filePath || req.body.objectName;
        
        console.log('🗑️ Solicitud de eliminación:', objectName);
        
        if (!objectName) {
            return res.status(400).json({
                message: "objectName es requerido (query param o body)",
                data: null
            });
        }
        
        const [result, error] = await minioService.deleteFileService(objectName);
        
        if (error) {
            console.error('❌ Error al eliminar:', error);
            const statusCode = error === "Archivo no encontrado" ? 404 : 500;
            return res.status(statusCode).json({
                message: error,
                data: null
            });
        }
        
        console.log('✅ Archivo eliminado exitosamente:', objectName);
        res.status(200).json({
            message: result.message || "Archivo eliminado exitosamente",
            data: null
        });
    } catch (error) {
        console.error("Error en handleDeleteFile:", error);
        res.status(500).json({
            message: `Error interno del servidor: ${error.message}`,
            data: null
        });
    }
};
