"use strict";
import express from 'express';
import cors from 'cors';
import router from './routes/index.routes.js'; // 1. Importamos el "mapa" de rutas
import { PORT } from './config/configEnv.js'; // 2. Importamos el puerto desde .env
import { connectDB } from './config/configDb.js'; // 3. Importamos la función de conexión a la DB

const app = express();
const port = PORT || 3000; // Usa el puerto del .env o el 3000

// --- Middlewares ---
// (Son plugins que se ejecutan en cada petición)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://146.83.194.142:1832'], // Vite (5173), frontend alternativo (3001), producción
    credentials: true
})); // Permite peticiones desde frontend
app.use(express.json()); // Permite a Express entender JSON

// --- Rutas ---
// Le decimos a Express que CUALQUIER petición que
// empiece con "/api" debe ser manejada por nuestro "mapa" de rutas.
app.use("/api", router);

/**
 * Función principal para arrancar el servidor
 */
async function startServer() {
    try {
        // 1. Intentar conectarse a la base de datos PRIMERO
        await connectDB();

        // 2. Poblar la base de datos con datos iniciales si está vacía
        const { seedDatabase } = await import('./config/initialSetup.js');
        await seedDatabase();

        // 3. Si todo fue exitoso, iniciar el servidor web
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`Backend del Museo escuchando en http://0.0.0.0:${port}`);
            console.log("Rutas de API disponibles en: http://0.0.0.0:${port}/api");
        });

        // Mantener el proceso vivo
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

// --- Encender ---
startServer().catch(err => {
    console.error("Error no capturado:", err);
    process.exit(1);
});