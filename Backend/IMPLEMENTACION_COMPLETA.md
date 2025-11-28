# 🚀 BACKEND MUSEO - IMPLEMENTACIÓN COMPLETA

## ✅ Lo que se implementó:

### 1. CRUD Usuarios Completo
- ✅ POST /api/usuario/register - Crear usuario (admin/encargado) con contraseña encriptada
- ✅ GET /api/usuario - Listar todos
- ✅ GET /api/usuario/:id - Obtener uno
- ✅ PUT /api/usuario/:id - Actualizar (con bcrypt si hay contraseña)
- ✅ DELETE /api/usuario/:id - Eliminar
- ✅ Roles: admin, encargado, anonimo
- ✅ initialSetup.js actualizado con contraseña encriptada

### 2. MinIO - Gestión de Archivos
- ✅ POST /api/museo/upload - Subir archivo (multer + form-data)
  - Estructura: museo/subcarpeta/tipo/archivo
  - Subcarpetas: huemul, helice, chemomul, cocodrilo
  - Tipos: videos, fotos, audios, modelo3D, textura
  - Validación de tipos MIME
  - Límite: 100MB
- ✅ DELETE /api/museo/file - Eliminar archivo por path
- ✅ GET /api/museo/presigned-url - URL temporal (ya existía)
- ✅ GET /api/museo/list-files - Listar archivos carpeta (ya existía)

### 3. Exhibiciones
- ✅ GET /api/exhibicion - Listar las 4 exhibiciones
- ✅ GET /api/exhibicion/:id - Obtener una (ya existía)
- ✅ PUT /api/exhibicion/:id - Actualizar nombre y relato_escrito
- ❌ NO implementado: POST (crear) ni DELETE (solo 4 fijas)

### 4. Quizzes CRUD Completo con Nested
- ✅ GET /api/quizz - Listar todos
- ✅ GET /api/quizz/:id - Obtener uno con preguntas/respuestas (ya existía)
- ✅ POST /api/quizz - Crear quiz completo (nested: quiz + preguntas + respuestas)
- ✅ PUT /api/quizz/:id - Actualizar quiz completo (nested)
- ✅ DELETE /api/quizz/:id - Eliminar con validación (mínimo 1 quiz)
- ✅ Transacciones para consistencia
- ✅ Validaciones Joi para estructura nested

---

## 🔧 PASOS PARA EJECUTAR:

### 1. Instalar dependencia (multer)
```bash
cd "d:\Unity\Tarea 1\MuseoProyect\Backend"
npm install multer
```

### 2. Iniciar servidor
```bash
npm start
```

Debería mostrar:
```
=> Conexión exitosa a la base de datos!
Extensión uuid-ossp asegurada.
  Ya existen 4 exhibicion(es).
  Ya existen X usuario(s). Admin encontrado: ...
Inicializacion completada.
Backend del Museo escuchando en http://0.0.0.0:3000
```

---

## 📝 EJEMPLOS POSTMAN:

### 🔐 1. Login (obtener token)
**POST** `http://localhost:3000/api/auth/login`
```json
{
  "correo": "admin@museo.cl",
  "password": "admin123"
}
```

### 👥 2. CRUD Usuarios

**POST /api/usuario/register** (Crear encargado)
```json
{
  "nombre": "María",
  "apellido": "González",
  "correo": "maria@museo.cl",
  "contrasena": "password123",
  "rol": "encargado"
}
```

**GET /api/usuario** - Listar todos

**PUT /api/usuario/:id** - Actualizar
```json
{
  "nombre": "María Francisca",
  "contrasena": "nuevaPassword456"
}
```

**DELETE /api/usuario/:id** - Eliminar

---

### 📁 3. MinIO - Upload de Archivo

**POST /api/museo/upload**

Headers:
```
Authorization: Bearer <TOKEN>
```

Body (form-data):
- `file`: [SELECCIONAR ARCHIVO] (imagen, video, audio, modelo 3D)
- `subcarpeta`: huemul (text)
- `tipo`: fotos (text)

Tipos válidos: `videos`, `fotos`, `audios`, `modelo3D`, `textura`

Respuesta:
```json
{
  "message": "Archivo subido exitosamente",
  "data": {
    "path": "huemul/fotos/mi-imagen.jpg",
    "filename": "mi-imagen.jpg"
  }
}
```

**DELETE /api/museo/file** - Eliminar archivo
```json
{
  "filePath": "huemul/fotos/mi-imagen.jpg"
}
```

---

### 🏛️ 4. Exhibiciones

**GET /api/exhibicion** - Listar las 4
```json
{
  "message": "Exhibiciones obtenidas exitosamente",
  "data": [
    {
      "id_exhibicion": "huemul",
      "nombre": "Huemul",
      "relato_escrito": "..."
    },
    ...
  ]
}
```

**PUT /api/exhibicion/huemul** - Actualizar
```json
{
  "nombre": "Huemul Patagónico",
  "relato_escrito": "Nuevo texto descriptivo del huemul..."
}
```

---

### 📝 5. Quizzes CRUD Nested

**GET /api/quizz** - Listar todos (resumido)

**POST /api/quizz** - Crear quiz completo
```json
{
  "id_usuario": "f111264f-871c-4d7e-ba3a-d3f0e147de01",
  "titulo": "Quiz sobre la Aviación en Chile",
  "preguntas": [
    {
      "titulo": "Primera pregunta",
      "texto": "¿En qué año se fundó la aviación comercial en Chile?",
      "respuestas": [
        {
          "texto": "1929",
          "es_correcta": true
        },
        {
          "texto": "1945",
          "es_correcta": false
        },
        {
          "texto": "1960",
          "es_correcta": false
        }
      ]
    },
    {
      "titulo": "Segunda pregunta",
      "texto": "¿Qué material se usaba en las hélices antiguas?",
      "respuestas": [
        {
          "texto": "Madera laminada",
          "es_correcta": true
        },
        {
          "texto": "Acero",
          "es_correcta": false
        }
      ]
    }
  ]
}
```

**PUT /api/quizz/1** - Actualizar quiz completo (misma estructura sin id_usuario)
```json
{
  "titulo": "Quiz Actualizado sobre Aviación",
  "preguntas": [
    {
      "titulo": "Pregunta modificada",
      "texto": "¿Cuál fue el primer avión en Chile?",
      "respuestas": [...]
    }
  ]
}
```

**DELETE /api/quizz/5** - Eliminar quiz
- ⚠️ Validación: No se puede eliminar si solo queda 1 quiz

---

## 🔒 Seguridad:

- Todos los endpoints requieren `Authorization: Bearer <TOKEN>`
- Contraseñas encriptadas con bcrypt (10 salt rounds)
- Validaciones Joi en todas las rutas
- Archivos limitados a 100MB
- Tipos MIME validados

---

## 📊 Estructura MinIO:

```
museo/ (bucket)
  ├── huemul/
  │   ├── videos/
  │   ├── fotos/
  │   ├── audios/
  │   ├── modelo3D/
  │   └── textura/
  ├── helice/
  │   ├── videos/
  │   └── ...
  ├── chemomul/
  └── cocodrilo/
```

---

## ⚠️ Notas Importantes:

1. **Usuarios anónimos** (Unity): POST /api/usuario - NO requiere registro previo
2. **Admin inicial**: correo: `admin@museo.cl`, password: `admin123`
3. **Quizzes**: Mínimo 1 debe existir siempre (validación en DELETE)
4. **Exhibiciones**: Solo 4 fijas (huemul, helice, chemomul, cocodrilo)
5. **MinIO Upload**: En Postman usa "Body → form-data → File" para subir archivos
6. **Nested**: POST y PUT de quiz crean/actualizan preguntas y respuestas automáticamente

---

## 🎯 Próximos pasos sugeridos:

1. ✅ Probar todos los endpoints en Postman
2. ✅ Subir algunos archivos de prueba a MinIO
3. ✅ Crear/actualizar quizzes con la estructura nested
4. 🔜 Desarrollar frontend de administración
5. 🔜 Conectar Unity con los nuevos endpoints
6. 🔜 Deploy a producción (146.83.194.142:1832)

---

**Todo el código está listo. Solo ejecuta los 2 comandos y prueba en Postman.**
