# Video Chat Aleatorio

Aplicación de video chat aleatorio que conecta usuarios de forma anónima para conversaciones por video, audio y texto.

## Características

- ✅ Conexión anónima sin registro
- ✅ Emparejamiento aleatorio con usuarios de todo el mundo
- ✅ Video y audio en tiempo real (WebRTC)
- ✅ Chat de texto integrado
- ✅ Botón "Siguiente" para saltar a otra persona
- ✅ Botón "Detener" para desconectar completamente
- ✅ Control de audio/video (activar/desactivar)
- ✅ Diseño responsive (funciona en móvil y desktop)

## Tecnologías

**Frontend:**
- React 19
- Vite
- Socket.io-client
- simple-peer (WebRTC)

**Backend:**
- Node.js
- Express
- Socket.io

## Instalación

### Requisitos
- Node.js 20.x o superior
- npm 9.x o superior

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd <nombre-del-proyecto>
```

### 2. Instalar dependencias del servidor
```bash
cd server
npm install
```

### 3. Instalar dependencias del cliente
```bash
cd ../client
npm install
```

## Uso

### Ejecutar en desarrollo

**Terminal 1 - Servidor:**
```bash
cd server
npm run dev
```
El servidor correrá en `http://localhost:3000`

**Terminal 2 - Cliente:**
```bash
cd client
npm run dev
```
El cliente correrá en `http://localhost:5173`

### Probar la aplicación

1. Abre dos navegadores o dos pestañas en modo incógnito
2. Navega a `http://localhost:5173` en ambas
3. Haz clic en "Comenzar" en ambas pestañas
4. Deberían conectarse automáticamente

**Nota:** Asegúrate de permitir el acceso a la cámara y micrófono cuando el navegador lo solicite.

## Estructura del Proyecto

```
.
├── client/                 # Aplicación React
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   ├── App.css        # Estilos
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── server/                 # Servidor Node.js
│   ├── index.js           # Servidor Express + Socket.io
│   └── package.json
│
└── README.md
```

## Cómo Funciona

1. **Conexión inicial:** Usuario entra y se conecta al servidor vía Socket.io
2. **Cola de espera:** Usuario se agrega a la cola de emparejamiento
3. **Matching:** Servidor empareja automáticamente a los primeros 2 usuarios disponibles
4. **WebRTC:** Los usuarios establecen conexión peer-to-peer para video/audio
5. **Chat:** Los mensajes de texto se envían a través del servidor
6. **Siguiente:** Usuario puede saltar a otra persona en cualquier momento
7. **Desconexión:** Al presionar "Detener" o cerrar la pestaña, se limpia la conexión

## Consideraciones para Producción

### Seguridad
- [ ] Implementar sistema de reportes y moderación
- [ ] Agregar rate limiting para prevenir spam
- [ ] Implementar autenticación opcional
- [ ] Filtrar contenido inapropiado

### Escalabilidad
- [ ] Usar Redis para la cola de emparejamiento
- [ ] Implementar balanceo de carga
- [ ] Agregar servidor TURN para NAT traversal
- [ ] Monitoreo y analytics

### Funcionalidades Adicionales
- [ ] Filtros por idioma/región
- [ ] Intereses comunes
- [ ] Estadísticas de usuarios online
- [ ] Efectos de video
- [ ] Modo solo audio

## Problemas Comunes

### No se ve el video
- Verifica que hayas permitido acceso a cámara/micrófono
- Revisa que estés usando HTTPS en producción (WebRTC lo requiere)
- Prueba con otro navegador

### No se conectan los usuarios
- Asegúrate que ambos clientes apunten al mismo servidor
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador para errores

### Problemas de NAT/Firewall
- En producción necesitarás un servidor TURN
- Los servidores STUN públicos tienen limitaciones

## Licencia

MIT

## Contribuir

Pull requests son bienvenidos. Para cambios importantes, abre un issue primero para discutir qué te gustaría cambiar.
