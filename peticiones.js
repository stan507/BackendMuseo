const express = require('express');
const Minio = require('minio');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

const minioClient = new Minio.Client({
    endPoint: '146.83.194.142',
    port: 1836,
    useSSL: false,
    accessKey: 'henriquez1831',
    secretKey: 'juan2025'
});

// --- LA RUTA DE LA API (SIMPLIFICADA) ---
// La ruta ahora es fija. Los datos vendrán como "?bucket=...&object=..."
app.get('/presigned-url', async (req, res) => {
    // Leemos los parámetros de la consulta de la URL
    const bucketName = req.query.bucket;
    const objectName = req.query.object;

    // Verificación de seguridad básica
    if (!bucketName || !objectName) {
        return res.status(400).send({ error: 'Faltan los parámetros "bucket" y "object"' });
    }

    console.log(`Petición recibida para (bucket/objeto): ${bucketName}/${objectName}`);

    try {
        const presignedUrl = await minioClient.presignedGetObject(bucketName, objectName, 5 * 60);
        console.log(`URL generada: ${presignedUrl}`);
        res.json({ url: presignedUrl });
    } catch (err) {
        console.error("Error generando la URL pre-firmada:", err);
        res.status(500).send({ error: 'No se pudo generar la URL' });
    }
});

app.listen(port, () => {
    console.log(`Servidor de URLs pre-firmadas escuchando en http://localhost:${port}`);
});