# cromos-backend-cloud-demo

Backend serverless introductorio para la Fase 2 de **Cromos del Mundial Cloud Edition**.

## 1. Objetivo del proyecto

Este proyecto construye una API REST sobre **API Gateway REST + AWS Lambda** para que los estudiantes entiendan cómo nace un backend cloud-native por dominios, sin contenedores ni base de datos real todavía.

El foco didáctico es:

- Backend serverless
- Rutas y métodos HTTP
- Una Lambda por servicio/dominio
- Variables de entorno
- Logs básicos
- Preparación para futura integración con frontend
- Arquitectura conceptual para autenticación futura

## 2. Relación con la Fase 1 frontend

En la Unidad 3 se construyó un frontend React/Vite con data dummy local.  
En esta Unidad 4 el sistema evoluciona así:

```text
Frontend React/Vite
        |
        v
API Gateway REST
        |
        v
Lambda por dominio
        |
        v
Data dummy local del backend
```

La idea es desacoplar gradualmente al frontend de archivos estáticos y mover la lógica de acceso a datos hacia una API.

## 3. Arquitectura

```text
Frontend React
    |
    v
API Gateway REST
    |
    +--> Root Lambda
    +--> Health Lambda
    +--> Countries Lambda
    +--> Teams Lambda
    +--> Players Lambda
    +--> Stickers Lambda
            |
            v
      Data dummy en src/data
```

## 4. Estructura del proyecto

```text
cromos-backend-cloud-demo/
├── scripts/
│   └── smoke.js
├── src/
│   ├── data/
│   │   ├── album.js
│   │   ├── countries.js
│   │   ├── players.js
│   │   ├── stickers.js
│   │   └── teams.js
│   ├── handlers/
│   │   ├── countries.js
│   │   ├── health.js
│   │   ├── players.js
│   │   ├── root.js
│   │   ├── stickers.js
│   │   └── teams.js
│   ├── utils/
│   │   ├── cognito.js
│   │   ├── errors.js
│   │   ├── http.js
│   │   ├── logger.js
│   │   ├── request.js
│   │   └── response.js
│   ├── local-router.js
│   └── local-server.js
├── .gitignore
├── package.json
├── README.md
└── template.yaml
```

## 5. Instalación de dependencias

El proyecto funciona sin librerías externas, pero conviene ejecutar:

```bash
npm install
```

## 6. Ejecución local

### Opción rápida con Node

```bash
npm run start:local
```

Esto levanta:

```text
http://localhost:3001
```

### Opción con AWS SAM

```bash
sam build
sam local start-api
```

## 7. Compatibilidad con AWS Academy Learner Lab

Este laboratorio fue ajustado para que sea **compatible con AWS Academy Learner Lab** usando únicamente servicios que normalmente sí están disponibles:

- AWS Lambda
- API Gateway REST
- CloudWatch Logs
- LabRole precreado del laboratorio

### Servicios que NO se usan como paso obligatorio

Los siguientes componentes pueden explicarse en arquitectura, pero **no forman parte de la práctica obligatoria**:

- Cognito User Pools
- Hosted UI
- IAM Identity Providers
- OIDC
- GitHub OIDC
- Route 53
- ACM personalizado
- WAF

## 8. Despliegue con SAM

```bash
sam build
sam deploy --guided
```

### Importante para Learner Lab

- La plantilla **no crea roles IAM nuevos**
- Todas las funciones Lambda reutilizan el rol existente `LabRole`
- Esto evita el error `iam:CreateRole` bloqueado por Learner Lab
- Usa una región permitida: `us-east-1` o `us-west-2`

Si quieres validar el rol efectivo que usa la plantilla:

```text
arn:aws:iam::<TU_ACCOUNT_ID>:role/LabRole
```

### Respuestas sugeridas para `sam deploy --guided`

Usa respuestas equivalentes a estas:

```text
Stack Name [cromos-backend-cloud-demo]: cromos-backend-cloud-demo
AWS Region [us-east-1]: us-east-1
Parameter StageName [dev]: dev
Confirm changes before deploy [Y/n]: Y
Allow SAM CLI IAM role creation [Y/n]: n
Disable rollback [y/N]: N
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: samconfig.toml
SAM configuration environment [default]: default
```

Nota:

- Aunque SAM pregunte por IAM, para este laboratorio la respuesta recomendada es `n` porque la plantilla ya usa `LabRole`
- Si trabajas desde CloudShell del Learner Lab, no necesitas fijar un perfil local en `samconfig.toml`

## 9. Variables de entorno

Este proyecto usa:

```text
SERVICE_NAME=cromos-backend-cloud-demo
STAGE=dev
LOG_LEVEL=info
APP_VERSION=1.0.0
DOMAIN_NAME=<nombre del dominio/lambda>
```

Se usan para:

- Identificar el servicio
- Distinguir el stage
- Etiquetar logs
- Mostrar versión
- Saber qué Lambda está atendiendo la petición

### ¿Qué es una variable de entorno?

Una variable de entorno es un valor externo al código que permite configurar comportamiento sin hardcodearlo dentro de los archivos fuente.

## 10. Autenticación futura como concepto arquitectónico

Aunque el laboratorio práctico no usa Cognito como paso obligatorio, la arquitectura futura puede evolucionar así:

```text
Frontend React
    |
    v
API Gateway REST
    |
    +--> Cognito Authorizer (futuro)
    |
    v
Lambda por dominio
```

En una fase empresarial, Cognito permitiría:

- autenticar usuarios
- emitir tokens
- proteger rutas privadas
- pasar identidad a la Lambda

En este laboratorio eso queda **solo como explicación conceptual**, no como actividad práctica.

## 11. ¿Qué es un secret?

Un secret es un dato sensible que no debe exponerse en código fuente, frontend ni logs.

Ejemplos:

- Passwords
- API keys privadas
- Tokens sensibles
- Credenciales de base de datos

### Qué nunca debe ir en el frontend

- Access keys de AWS
- Passwords
- JWT secrets
- Connection strings privadas
- Tokens administrativos

### Qué debería ir en Secrets Manager en una fase empresarial

- Credenciales de base de datos
- Claves privadas de integraciones
- Secretos de terceros
- Tokens internos sensibles

## 12. Logs en CloudWatch

Cada Lambda genera logs estructurados con:

- Inicio de petición
- Método HTTP
- Ruta
- Parámetros
- Resultado
- Errores

Ejemplo de log:

```js
console.log({
  level: "INFO",
  service: process.env.SERVICE_NAME,
  domain: process.env.DOMAIN_NAME,
  route: event.path,
  method: event.httpMethod
});
```

## 13. Rutas disponibles

### `GET /`

```json
{
  "message": "API Cromos del Mundial Cloud Edition lista para recibir solicitudes"
}
```

### `GET /health`

```json
{
  "status": "ok",
  "service": "cromos-backend-cloud-demo"
}
```

### `GET /countries`

Lista países.

### `GET /countries/{id}`

Devuelve un país por id.

### `GET /teams`

Lista equipos.

### `GET /teams/{id}`

Devuelve un equipo por id.

### `GET /players`

Lista jugadores.

### `GET /players/{id}`

Devuelve un jugador por id.

### `GET /players?country=ecuador`

Filtro por país.

### `GET /stickers`

Lista cromos.

### `GET /stickers/{id}`

Devuelve un cromo por id.

### `GET /stickers?rarity=legend`

Filtro por rareza.

### `POST /stickers`

Simula creación sin persistencia real.

Campos mínimos:

- `number`
- `playerId`
- `edition`
- `rarity`

### `PUT /stickers/{id}`

Simula actualización de un cromo.

### `DELETE /stickers/{id}`

Simula eliminación.

## 14. Métodos HTTP explicados

- `GET`: consultar recursos
- `POST`: crear recursos
- `PUT`: actualizar recursos
- `DELETE`: eliminar recursos
- `OPTIONS`: responder preflight de CORS

## 15. CORS

Todas las respuestas JSON agregan:

```text
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

## 16. Manejo de errores

El proyecto contempla:

- `200 OK`
- `201 Created`
- `400 Bad Request`
- `404 Not Found`
- `500 Internal Server Error`

## 17. Ejemplos con curl

Reemplaza `API_URL` por tu URL real.

```bash
curl https://API_URL/health
curl https://API_URL/countries
curl https://API_URL/players
curl https://API_URL/stickers
curl -X POST https://API_URL/stickers -H "Content-Type: application/json" -d '{"number":"099","playerId":"moises-caicedo","edition":"Test Edition","rarity":"special"}'
```

## 18. Cómo conectar luego el frontend

En la siguiente fase el frontend podrá usar:

```text
VITE_API_URL=https://tu-api.execute-api.region.amazonaws.com/dev
```

## 19. Cómo probar rápidamente sin AWS

```bash
npm run smoke
```

El smoke test valida rutas y respuestas sin depender de servicios avanzados.

## 20. Diagrama de arquitectura

```text
Usuario / Frontend React
          |
          v
   API Gateway REST
          |
          +-------------------+
          |                   |
          v                   v
   Root Lambda          Health Lambda
          |
          +----------------------------------------------+
          |                      |                       |
          v                      v                       v
 Countries Lambda         Teams Lambda           Players Lambda
          \                      |                       /
           \                     |                      /
            +--------------------+---------------------+
                                 |
                                 v
                          Stickers Lambda
                                 |
                                 v
                         Data Dummy Local
```

## 21. Próxima fase

La evolución natural es:

```text
Frontend React
    |
    v
API Gateway REST
    |
    v
Lambda por dominio
    |
    v
DynamoDB
```
