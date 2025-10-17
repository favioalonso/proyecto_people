import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Configurar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS dinámico para desarrollo y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Servir archivos estáticos del cliente en producción
app.use(express.static(path.join(__dirname, '../client/dist')));

// Estado del servidor
const waitingQueue = []; // Cola de usuarios esperando match
const activeConnections = new Map(); // socketId -> { partnerId, inCall }

// Función para emparejar usuarios
function matchUsers() {
  while (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    // Verificar que ambos sockets aún estén conectados
    const socket1 = io.sockets.sockets.get(user1);
    const socket2 = io.sockets.sockets.get(user2);

    if (!socket1 || !socket2) {
      // Si alguno se desconectó, volver a agregar el que sigue conectado
      if (socket1) waitingQueue.unshift(user1);
      if (socket2) waitingQueue.unshift(user2);
      continue;
    }

    // Guardar información de la conexión
    activeConnections.set(user1, { partnerId: user2, inCall: true });
    activeConnections.set(user2, { partnerId: user1, inCall: true });

    // Notificar a ambos usuarios que se encontró un match
    socket1.emit('match_found', { partnerId: user2 });
    socket2.emit('match_found', { partnerId: user1 });

    console.log(`Match encontrado: ${user1} <-> ${user2}`);
  }
}

// Función para desconectar una pareja
function disconnectPair(socketId) {
  const connection = activeConnections.get(socketId);

  if (connection && connection.partnerId) {
    const partnerId = connection.partnerId;
    const partnerSocket = io.sockets.sockets.get(partnerId);

    // Notificar al partner que el usuario se desconectó
    if (partnerSocket) {
      partnerSocket.emit('partner_disconnected');
      activeConnections.delete(partnerId);

      // Agregar al partner de vuelta a la cola
      waitingQueue.push(partnerId);
      matchUsers();
    }
  }

  activeConnections.delete(socketId);
}

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Usuario entra a la cola de espera
  socket.on('find_match', () => {
    console.log(`Usuario ${socket.id} buscando match...`);

    // Asegurarse de que no esté ya en la cola
    if (!waitingQueue.includes(socket.id) && !activeConnections.has(socket.id)) {
      waitingQueue.push(socket.id);
      socket.emit('searching');
      matchUsers();
    }
  });

  // Usuario presiona "Siguiente"
  socket.on('next_user', () => {
    console.log(`Usuario ${socket.id} busca siguiente persona`);
    disconnectPair(socket.id);

    // Agregar de vuelta a la cola
    if (!waitingQueue.includes(socket.id)) {
      waitingQueue.push(socket.id);
      socket.emit('searching');
      matchUsers();
    }
  });

  // Señalización WebRTC
  socket.on('webrtc_offer', ({ offer, to }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtc_offer', { offer, from: socket.id });
    }
  });

  socket.on('webrtc_answer', ({ answer, to }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtc_answer', { answer, from: socket.id });
    }
  });

  socket.on('webrtc_ice_candidate', ({ candidate, to }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtc_ice_candidate', { candidate, from: socket.id });
    }
  });

  // Chat de texto
  socket.on('send_message', ({ message, to }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('receive_message', { message, from: socket.id });
    }
  });

  // Usuario se desconecta o presiona "Detener"
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);

    // Remover de la cola si estaba esperando
    const queueIndex = waitingQueue.indexOf(socket.id);
    if (queueIndex > -1) {
      waitingQueue.splice(queueIndex, 1);
    }

    // Desconectar de su pareja si estaba en llamada
    disconnectPair(socket.id);
  });
});

// Ruta catch-all para SPA - debe ir al final
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Endpoint para obtener configuración de ICE servers (TURN)
app.get('/api/ice-config', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Agregar servidor TURN si está configurado
  if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL
    });
  }

  res.json({ iceServers });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Esperando conexiones...`);
  console.log(`TURN server configurado: ${!!process.env.TURN_URL}`);
});
