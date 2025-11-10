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
app.use(cors()); // Permite peticiones desde Unity (diferente "origen")
app.use(express.json()); // Permite a Express entender JSON

// --- Rutas ---
// Le decimos a Express que CUALQUIER petición que
// empiece con "/api" debe ser manejada por nuestro "mapa" de rutas.
app.use("/api", router);

/**
 * Función principal para arrancar el servidor
 */
async function startServer() {

    // 1. Intentar conectarse a la base de datos PRIMERO
    await connectDB();

    // 2. Si la conexión a la DB fue exitosa, iniciar el servidor web
    app.listen(port, () => {
        console.log(`Backend del Museo escuchando en http://localhost:${port}`);
        console.log("Rutas de API disponibles en: http://localhost:3000/api/museo");
    });
}

// --- Encender ---
startServer();