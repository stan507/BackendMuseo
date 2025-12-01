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

// Upload de archivo
export const handleUploadFile = async (req, res) => {
    try {
        const { subcarpeta, tipo } = req.body;
        
        if (!req.file) {
            return res.status(400).json({
                message: "No se proporcionó ningún archivo",
                data: null
            });
        }
        
        if (!subcarpeta || !tipo) {
            return res.status(400).json({
                message: "subcarpeta y tipo son requeridos",
                data: null
            });
        }

        // Validar nombre de archivo
        const nombreArchivo = req.file.originalname;
        const caracteresProblematicos = /[^a-zA-Z0-9._-]/g;
        
        if (caracteresProblematicos.test(nombreArchivo)) {
            return res.status(400).json({
                message: `Nombre de archivo inválido: "${nombreArchivo}". Solo se permiten letras, números, guiones, guiones bajos y puntos.`,
                data: null
            });
        }

        if (nombreArchivo.startsWith('.') || nombreArchivo.startsWith('-')) {
            return res.status(400).json({
                message: "El nombre de archivo no puede comenzar con punto o guion",
                data: null
            });
        }

        if (nombreArchivo.length > 200) {
            return res.status(400).json({
                message: "El nombre de archivo es demasiado largo (máximo 200 caracteres)",
                data: null
            });
        }
        
        // Validar subcarpeta
        const subcarpetasValidas = ['huemul', 'helice', 'chemomul', 'cocodrilo'];
        if (!subcarpetasValidas.includes(subcarpeta)) {
            return res.status(400).json({
                message: `subcarpeta inválida. Debe ser: ${subcarpetasValidas.join(', ')}`,
                data: null
            });
        }
        
        // Validar tipo
        const tiposValidos = ['videos', 'fotos', 'audios', 'modelo3D', 'textura'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                message: `tipo inválido. Debe ser: ${tiposValidos.join(', ')}`,
                data: null
            });
        }
        
        // Validar extensión según tipo
        const ext = req.file.originalname.toLowerCase().split('.').pop();
        const extensionesPorTipo = {
            fotos: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            videos: ['mp4', 'mpeg', 'mpg', 'mov', 'avi', 'webm'],
            audios: ['mp3', 'wav', 'ogg'],
            modelo3D: ['fbx', 'obj', 'gltf', 'glb'],
            textura: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        };
        
        if (!extensionesPorTipo[tipo].includes(ext)) {
            return res.status(400).json({
                message: `Extensión .${ext} no válida para tipo ${tipo}. Extensiones aceptadas: ${extensionesPorTipo[tipo].join(', ')}`,
                data: null
            });
        }
        
        const [result, error] = await minioService.uploadFileService(
            req.file.buffer,
            subcarpeta,
            tipo,
            req.file.originalname,
            req.file.mimetype
        );
        
        if (error) {
            return res.status(500).json({
                message: error,
                data: null
            });
        }
        
        res.status(201).json({
            message: "Archivo subido exitosamente",
            data: result
        });
    } catch (error) {
        console.error("Error en handleUploadFile:", error);
        res.status(500).json({
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
