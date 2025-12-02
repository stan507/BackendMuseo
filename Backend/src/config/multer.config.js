"use strict";
import multer from "multer";

// Configurar multer para almacenar archivos en memoria (buffer)
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
    // Mapeo de tipos por extensión
    const allowedExtensions = {
        // Imágenes (solo formatos compatibles con Unity)
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        // Videos (solo formatos multiplataforma con Unity VideoPlayer)
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm'],
        // Audio (solo MP3 compatible con Unity AudioType.MPEG)
        'audio/mpeg': ['.mp3'],
        // Modelos 3D (solo glTF 2.0 compatible con glTFast)
        'application/octet-stream': ['.gltf', '.glb', '.bin'],
        'model/gltf-binary': ['.glb'],
        'model/gltf+json': ['.gltf']
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
