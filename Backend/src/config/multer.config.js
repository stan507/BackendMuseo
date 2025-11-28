"use strict";
import multer from "multer";

// Configurar multer para almacenar archivos en memoria (buffer)
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    // Mapeo de tipos por extensión
    const allowedExtensions = {
        // Imágenes
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        // Videos
        'video/mp4': ['.mp4'],
        'video/mpeg': ['.mpeg', '.mpg'],
        'video/quicktime': ['.mov'],
        'video/x-msvideo': ['.avi'],
        'video/webm': ['.webm'],
        // Audio
        'audio/mpeg': ['.mp3'],
        'audio/wav': ['.wav'],
        'audio/ogg': ['.ogg'],
        // Modelos 3D
        'application/octet-stream': ['.fbx', '.obj', '.gltf', '.glb'],
        'model/gltf-binary': ['.glb'],
        'model/gltf+json': ['.gltf'],
        'text/plain': ['.obj']
    };
    
    const allowedMimes = Object.keys(allowedExtensions);
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Formatos aceptados: JPG, PNG, GIF, WebP, MP4, MPEG, MOV, AVI, WebM, MP3, WAV, OGG, FBX, OBJ, GLTF, GLB`), false);
    }
};

// Configurar multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB máximo
    }
});
