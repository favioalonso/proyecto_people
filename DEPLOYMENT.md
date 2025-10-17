# Guía de Despliegue en Render

Esta guía te ayudará a desplegar tu aplicación de Video Chat Aleatorio en Render para que puedas compartirla con cualquier persona en internet.

## Requisitos Previos

1. Cuenta de GitHub (gratis)
2. Cuenta de Render (gratis) - https://render.com
3. Cuenta de Metered.ca (gratis, para servidor TURN) - https://www.metered.ca/tools/openrelay/

## Paso 1: Configurar Servidor TURN (Metered.ca)

El servidor TURN mejora la conectividad WebRTC cuando hay firewalls o NAT restrictivos.

1. Ve a https://www.metered.ca/tools/openrelay/
2. Completa el formulario con tu email
3. Recibirás credenciales TURN por email:
   - URL del servidor (ej: `turn:a.relay.metered.ca:80`)
   - Username
   - Credential
4. Guarda estas credenciales, las necesitarás más adelante

## Paso 2: Configurar Variables de Entorno Locales

Antes de subir a GitHub, crea archivos `.env` locales para desarrollo:

### En `/server/.env`:
```env
PORT=3000
CLIENT_URL=http://localhost:5173
TURN_URL=turn:a.relay.metered.ca:80
TURN_USERNAME=tu_username_de_metered
TURN_CREDENTIAL=tu_credential_de_metered
```

### En `/client/.env`:
```env
VITE_SERVER_URL=http://localhost:3000
```

**IMPORTANTE:** Estos archivos `.env` NO se subirán a GitHub (están en `.gitignore`).

## Paso 3: Crear Repositorio en GitHub

1. Ve a https://github.com y crea un nuevo repositorio
2. Puedes nombrarlo como quieras (ej: `video-chat-aleatorio`)
3. Hazlo público o privado (ambos funcionan)
4. NO inicialices con README (ya tienes archivos)

## Paso 4: Subir Código a GitHub

Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit - Video Chat App"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

Reemplaza `TU_USUARIO` y `TU_REPOSITORIO` con tus datos.

## Paso 5: Configurar Render

1. Ve a https://dashboard.render.com y crea una cuenta (usa GitHub para login)
2. En el dashboard, haz click en **"New +"** → **"Web Service"**
3. Conecta tu cuenta de GitHub si no lo has hecho
4. Busca y selecciona tu repositorio `video-chat-aleatorio`
5. Haz click en **"Connect"**

## Paso 6: Configurar el Web Service en Render

Render detectará automáticamente el archivo `render.yaml`, pero verifica la configuración:

- **Name:** `video-chat-aleatorio` (o el nombre que prefieras)
- **Runtime:** Node
- **Build Command:** `cd server && npm install && npm run build`
- **Start Command:** `cd server && npm start`
- **Plan:** Free

## Paso 7: Configurar Variables de Entorno en Render

En la página de configuración del servicio, ve a la sección **Environment**:

Agrega las siguientes variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | (dejar vacío por ahora, lo configuraremos después) |
| `TURN_URL` | `turn:a.relay.metered.ca:80` (tu URL de Metered) |
| `TURN_USERNAME` | Tu username de Metered |
| `TURN_CREDENTIAL` | Tu credential de Metered |

## Paso 8: Desplegar

1. Haz click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. El proceso puede tomar 5-10 minutos la primera vez
4. Una vez completado, verás un estado **"Live"** y una URL como:
   ```
   https://video-chat-aleatorio-xxxx.onrender.com
   ```

## Paso 9: Actualizar CLIENT_URL

1. Copia la URL de tu aplicación que Render te proporcionó
2. Ve a **Settings** → **Environment** en el dashboard de Render
3. Actualiza la variable `CLIENT_URL` con tu URL de Render:
   ```
   https://video-chat-aleatorio-xxxx.onrender.com
   ```
4. Guarda los cambios
5. Render automáticamente redesplegará la aplicación

## Paso 10: Probar la Aplicación

1. Abre la URL de tu aplicación en un navegador
2. Envía el link a tu hermano (o a quien quieras probar)
3. Ambos deberían poder conectarse y hacer video chat

## Actualizaciones Futuras

Cada vez que hagas cambios al código:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

Render automáticamente detectará los cambios y redesplegará la aplicación.

## Consideraciones del Plan Gratuito de Render

- Tu aplicación se "dormirá" después de 15 minutos de inactividad
- La primera carga después de dormirse puede tomar 30-60 segundos
- Tienes 750 horas gratis al mes (suficiente para testing)
- Para uso 24/7, considera el plan Starter ($7/mes)

## Solución de Problemas

### La aplicación no carga
- Verifica que el build se completó correctamente en el dashboard de Render
- Revisa los logs en **Logs** en el dashboard
- Asegúrate de que todas las variables de entorno estén configuradas

### Video no funciona
- Verifica que las credenciales TURN estén correctas
- Comprueba que el navegador tenga permisos de cámara/micrófono
- Prueba con diferentes navegadores (Chrome/Firefox recomendados)

### Error de CORS
- Verifica que `CLIENT_URL` esté configurado con la URL correcta de Render
- La URL debe ser HTTPS (Render lo proporciona automáticamente)

## Alternativas a Render

Si Render no funciona para ti, puedes considerar:
- **Railway** (https://railway.app) - Similar a Render, $5 de crédito gratis
- **Fly.io** (https://fly.io) - Más técnico pero muy potente
- **Heroku** (https://heroku.com) - Clásico pero ya no tiene plan gratuito

## Soporte

Si tienes problemas, revisa los logs en el dashboard de Render o contacta a soporte.
