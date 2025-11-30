# Implementacion de Tracking de Embudo de Conversion para Quiz

## Cambios Realizados

### Backend

#### 1. Base de Datos
- Agregada columna `quiz_iniciado` (BOOLEAN) a la tabla `visita`
- Ejecutar script: `Backend/migration_add_quiz_iniciado.sql`

```sql
ALTER TABLE visita ADD COLUMN IF NOT EXISTS quiz_iniciado BOOLEAN DEFAULT NULL;
```

Estados posibles:
- `null`: El usuario NO abrio el quiz
- `true`: El usuario INICIO el quiz
- `false`: El usuario ABANDONO el quiz (lo abrio pero no lo completo)
- Cuando completa el quiz, este campo permanece en `true` y se llena `puntaje_quiz`

#### 2. Backend - Entidad
- Archivo: `Backend/src/entity/Visita.entity.js`
- Agregado campo `quiz_iniciado` con comentario explicativo

#### 3. Backend - Servicio
- Archivo: `Backend/src/services/visita.service.js`
- Nueva funcion: `updateQuizEstadoService(id_visita, quiz_iniciado)`

#### 4. Backend - Controlador
- Archivo: `Backend/src/controllers/visita.controller.js`
- Nueva funcion: `updateQuizEstado(req, res)`

#### 5. Backend - Rutas
- Archivo: `Backend/src/routes/visita.routes.js`
- Nueva ruta: `PATCH /api/visita/:id/quiz-estado`
- Body: `{ "quiz_iniciado": true/false }`

### Unity

#### 1. CargadorContenido.cs
- Nueva funcion publica: `MarcarQuizEstado(int idVisita, bool iniciado, Action<bool> callback)`
- Nueva coroutine privada: `EnviarQuizEstado()`
- Hace PATCH a `/api/visita/{idVisita}/quiz-estado`

#### 2. quizzDesplegador.cs
- Nueva variable privada: `bool quizCompletado = false`
- En `InicializarTest()`: Llama a `MarcarQuizEstado(idVisita, true)` al iniciar
- En `FinalizarQuiz()`: Marca `quizCompletado = true` antes de enviar resultados
- En `OnDestroy()`: Si `quizActivo && !quizCompletado`, llama a `MarcarQuizEstado(idVisita, false)`

## Flujo de Estados

### Escenario 1: Usuario ve exhibicion pero NO abre quiz
- Visita registrada con `quiz_iniciado = null`
- Embudo: Vio exhibicion ✓ | Abrio quiz ✗ | Completo quiz ✗

### Escenario 2: Usuario abre quiz pero lo cierra antes de terminar
- Visita registrada con `quiz_iniciado = null`
- Al abrir quiz: `quiz_iniciado = true`
- Al destruir prefab sin completar: `quiz_iniciado = false`
- Embudo: Vio exhibicion ✓ | Abrio quiz ✓ | Completo quiz ✗

### Escenario 3: Usuario completa el quiz
- Visita registrada con `quiz_iniciado = null`
- Al abrir quiz: `quiz_iniciado = true`
- Al completar: `quizCompletado = true`, se envian resultados, `puntaje_quiz` se llena
- El campo `quiz_iniciado` queda en `true`
- Embudo: Vio exhibicion ✓ | Abrio quiz ✓ | Completo quiz ✓

## Consultas SQL para Metricas

### Total de visitas por etapa del embudo
```sql
SELECT 
  COUNT(*) as total_visitas,
  COUNT(CASE WHEN quiz_iniciado IS NOT NULL THEN 1 END) as quiz_abierto,
  COUNT(CASE WHEN puntaje_quiz IS NOT NULL THEN 1 END) as quiz_completado,
  COUNT(CASE WHEN quiz_iniciado = false THEN 1 END) as quiz_abandonado
FROM visita
WHERE fecha_visita BETWEEN '2025-01-01' AND '2025-01-31';
```

### Tasa de conversion
```sql
SELECT 
  COUNT(*) as total_visitas,
  ROUND(COUNT(CASE WHEN quiz_iniciado IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as tasa_apertura,
  ROUND(COUNT(CASE WHEN puntaje_quiz IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as tasa_completado
FROM visita;
```

## Proximos Pasos

1. Ejecutar migration SQL
2. Reiniciar backend
3. Compilar Unity con cambios
4. Probar en dispositivo:
   - Abrir y cerrar quiz sin completar
   - Completar quiz normalmente
   - Ver exhibicion sin abrir quiz
5. Verificar datos en base de datos
6. Implementar visualizacion en frontend (Informes)
