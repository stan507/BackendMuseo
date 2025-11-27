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
