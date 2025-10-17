# Guía Rápida - Desplegar en Render

## Resumen: 3 pasos principales

1. Obtener credenciales TURN (opcional pero recomendado)
2. Subir código a GitHub
3. Conectar GitHub con Render

---

## Paso 1: Obtener Credenciales TURN (5 minutos)

### ¿Por qué necesito esto?
El servidor TURN mejora la conexión de video en redes con firewall restrictivo. Es GRATIS y toma 5 minutos.

### Cómo obtenerlo:
1. Ve a: https://www.metered.ca/tools/openrelay/
2. Completa el formulario (solo email)
3. Recibirás un email con:
   ```
   URL: turn:a.relay.metered.ca:80
   Username: xxxxxxxxxxxxxxx
   Credential: xxxxxxxxxxxxxxx
   ```
4. Guarda estos datos para el Paso 3

**OPCIONAL:** Si quieres probar rápido sin TURN, puedes saltar este paso. La app funcionará en la mayoría de redes.

---

## Paso 2: Subir a GitHub (10 minutos)

### 2.1 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `video-chat-aleatorio` (o el que prefieras)
3. Privacidad: Público o Privado (ambos funcionan)
4. NO marques "Initialize with README"
5. Click en **Create repository**

### 2.2 Subir tu código
Abre Git Bash o terminal en la carpeta del proyecto:

```bash
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "Initial commit - Video Chat App ready for deployment"

# Configurar rama principal
git branch -M main

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/video-chat-aleatorio.git

# Subir código
git push -u origin main
```

**IMPORTANTE:** Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

Si te pide login, usa tu usuario y **Personal Access Token** (no tu contraseña):
- Para crear token: Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

---

## Paso 3: Desplegar en Render (10 minutos)

### 3.1 Crear cuenta en Render
1. Ve a https://render.com
2. Click en **Get Started**
3. Usa **Sign up with GitHub** (más fácil)
4. Autoriza a Render

### 3.2 Crear Web Service
1. En el dashboard, click **New +** → **Web Service**
2. Click **Connect** junto a tu repositorio `video-chat-aleatorio`
3. Si no aparece, click **Configure account** y dale acceso a tus repositorios

### 3.3 Configurar el servicio
Render autodetectará todo desde `render.yaml`, pero verifica:

- **Name:** `video-chat-aleatorio` (o el que quieras)
- **Branch:** `main`
- **Root Directory:** (dejar vacío)
- **Runtime:** Node
- **Build Command:** `cd server && npm install && npm run build`
- **Start Command:** `cd server && npm start`
- **Instance Type:** Free

### 3.4 Configurar Variables de Entorno
En la sección **Environment**, agrega:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Entorno de producción |
| `CLIENT_URL` | (dejar vacío por ahora) | Lo configuraremos después |
| `TURN_URL` | Tu URL de Metered | Ejemplo: `turn:a.relay.metered.ca:80` |
| `TURN_USERNAME` | Tu username de Metered | Del email de Metered |
| `TURN_CREDENTIAL` | Tu credential de Metered | Del email de Metered |

**Si no tienes TURN:** Deja `TURN_URL`, `TURN_USERNAME` y `TURN_CREDENTIAL` vacíos. La app funcionará solo con STUN.

### 3.5 Crear servicio
1. Click **Create Web Service**
2. Espera 5-10 minutos mientras Render construye tu app
3. Verás logs en tiempo real del proceso
4. Cuando termine, verás **"Live"** en verde

### 3.6 Actualizar CLIENT_URL
1. Copia la URL de tu app (ejemplo: `https://video-chat-aleatorio-abcd.onrender.com`)
2. Ve a **Environment** en el menú lateral
3. Edita la variable `CLIENT_URL` y pega tu URL
4. Click **Save Changes**
5. Render redesplegará automáticamente (1-2 minutos)

---

## ¡Listo! 🎉

Tu app está en vivo. Comparte el link con quien quieras:
```
https://tu-app.onrender.com
```

### Probar la aplicación:
1. Abre el link en tu navegador
2. Envía el link a tu hermano
3. Ambos hagan click en "Comenzar"
4. Deberían emparejarse automáticamente

---

## Notas Importantes

### Límites del plan gratuito:
- La app se "duerme" después de 15 minutos sin actividad
- Primera carga después de dormir: 30-60 segundos
- 750 horas gratis al mes (más que suficiente para probar)

### Para mantener la app siempre activa:
Upgrade a plan Starter ($7/mes) o usa un servicio como UptimeRobot para hacer ping cada 10 minutos.

### Actualizaciones futuras:
Cada vez que hagas cambios:
```bash
git add .
git commit -m "Descripción del cambio"
git push
```
Render redesplegará automáticamente.

---

## Solución de Problemas Rápidos

**❌ Error: "Build failed"**
- Revisa los logs en Render
- Verifica que `render.yaml` esté en la raíz del proyecto

**❌ Página en blanco**
- Verifica que `CLIENT_URL` esté configurado correctamente
- Espera 2 minutos después de configurar `CLIENT_URL`

**❌ Video no funciona**
- Verifica permisos de cámara/micrófono en el navegador
- Verifica credenciales TURN
- Prueba en modo incógnito

**❌ "Cannot GET /"**
- El build del cliente falló
- Revisa los logs de build en Render
- Asegúrate de que el comando build se ejecutó correctamente

---

## ¿Necesitas ayuda?

1. Revisa `DEPLOYMENT.md` para guía detallada
2. Chequea logs en el dashboard de Render
3. Verifica que todas las variables de entorno estén configuradas
