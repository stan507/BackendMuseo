"use strict";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/index.routes.js';
import { PORT } from './config/configEnv.js';
import { connectDB } from './config/configDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = PORT || 3000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://146.83.194.142:1832'],
    credentials: true
}));
app.use(express.json());

const frontendPath = path.join(__dirname, '../../Frontend/dist');
app.use(express.static(frontendPath));

app.use("/api", router);

app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        next();
    }
});

/**
 * Función principal para arrancar el servidor
 */
async function startServer() {
    try {
        await connectDB();

        const { seedDatabase } = await import('./config/initialSetup.js');
        await seedDatabase();

        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`Backend del Museo escuchando en http://0.0.0.0:${port}`);
            console.log("Rutas de API disponibles en: http://0.0.0.0:${port}/api");
        });
        process.on('SIGINT', () => {
            console.log('Cerrando servidor...');
            server.close(() => {
                console.log('Servidor cerrado');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Error fatal al iniciar el servidor:", error);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error("Error no capturado:", err);
    process.exit(1);
});