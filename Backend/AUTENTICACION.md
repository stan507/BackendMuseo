# 🔒 Sistema de Autenticación - Museo Backend

## 📋 Resumen

El backend ahora está **protegido** con un sistema de doble autenticación:
1. **API Key** - Para Unity (app móvil)
2. **JWT Token** - Para administradores (panel web)

---

## 🔑 Credenciales

### Unity API Key
```
x-api-key: museo_unity_2025_secret_key
```

### Admin Login
```
Correo: admin@museo.cl
Password: admin123
```

---

## 🚀 Uso desde Unity

Unity **automáticamente** agrega el API Key en todos los requests. Ya está configurado en `CargadorContenido.cs`:

```csharp
[SerializeField] private string apiKey = "museo_unity_2025_secret_key";
```

**No requiere cambios adicionales en Unity.**

---

## 🔐 Uso desde Postman/Admin Panel

### 1. Login (obtener token)

**POST** `http://localhost:3000/api/auth/login`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "correo": "admin@museo.cl",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": "f111264f-871c-4d7e-ba3a-d3f0e147de01",
    "correo": "admin@museo.cl",
    "nombre": "Admin",
    "rol": "admin"
  }
}
```

### 2. Usar token en requests protegidos

**Ejemplo: GET Exhibición**

**GET** `http://localhost:3000/api/exhibicion/huemul`

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo: PUT Exhibición (solo admin)**

**PUT** `http://localhost:3000/api/exhibicion/huemul`

Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

Body:
```json
{
  "relato_escrito": "Nuevo texto actualizado..."
}
```

---

## 🛡️ Rutas Protegidas

### Rutas que aceptan Unity API Key O Admin JWT:
- `GET /api/exhibicion/:id` - Ver exhibiciones
- `GET /api/quizz/:id` - Ver quizzes
- `GET /api/museo/presigned-url` - Obtener URLs de MinIO
- `GET /api/museo/list-files` - Listar archivos
- `POST /api/usuario` - Registrar visitante
- `POST /api/visita` - Registrar visita
- `POST /api/responde` - Registrar respuesta de quiz

### Rutas que SOLO aceptan Admin JWT:
- `PUT /api/exhibicion/:id` - Actualizar exhibiciones

### Rutas públicas (sin autenticación):
- `POST /api/auth/login` - Login de administrador

---

## ⚙️ Variables de Entorno

En `Backend/src/config/.env`:

```env
JWT_SECRET=8HY7yq7Z2asRMXRXn8QNVKzcDxaZMVnQRdihVLoma1LK5kic8dRVzVYjMyHgi5YZ
UNITY_API_KEY=museo_unity_2025_secret_key
```

**⚠️ CAMBIAR en producción:**
- Generar nuevo `JWT_SECRET`
- Cambiar `UNITY_API_KEY`
- Actualizar password del admin con hash bcrypt

---

## 🧪 Probar Autenticación

### Desde Postman (Sin autenticación - Debe fallar):

```bash
GET http://localhost:3000/api/exhibicion/huemul
# Respuesta: 401 Unauthorized
```

### Desde Postman (Con API Key - Debe funcionar):

```bash
GET http://localhost:3000/api/exhibicion/huemul
Headers:
  x-api-key: museo_unity_2025_secret_key
# Respuesta: 200 OK con datos
```

### Desde Postman (Con JWT Token - Debe funcionar):

```bash
# 1. Login primero
POST http://localhost:3000/api/auth/login
Body: { "correo": "admin@museo.cl", "password": "admin123" }

# 2. Copiar el token y usarlo
GET http://localhost:3000/api/exhibicion/huemul
Headers:
  Authorization: Bearer <TOKEN_AQUI>
# Respuesta: 200 OK con datos
```

---

## 📝 Notas de Seguridad

1. **JWT expira en 8 horas** - El admin deberá hacer login nuevamente
2. **API Key es estática** - Unity siempre usa la misma key
3. **HTTPS en producción** - Usar SSL/TLS en el servidor real
4. **Variables sensibles** - No commitear `.env` a git

---

## 🔧 Troubleshooting

### Error 401: "Acceso denegado"
- Falta el header `x-api-key` o `Authorization`
- Verificar que el API Key o Token sea correcto

### Error 403: "Token inválido o expirado"
- El JWT expiró (> 8 horas)
- Hacer login nuevamente

### Error 403: "Se requiere rol de administrador"
- Intentando acceder a ruta PUT con API Key de Unity
- Solo admin con JWT puede hacer PUT

---

## 📦 Archivos Creados

```
Backend/
├── src/
│   ├── middlewares/
│   │   └── auth.middleware.js       # Middleware de autenticación
│   ├── services/
│   │   └── auth.service.js          # Lógica de login
│   ├── controllers/
│   │   └── auth.controller.js       # Controlador de auth
│   └── routes/
│       └── auth.routes.js           # Rutas de auth
```

Unity/
└── Assets/Scripts/
    └── CargadorContenido.cs         # Actualizado con API Key
```

---

**✅ Sistema de autenticación implementado y funcional**
