const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId to WebSocket connections
    this.rooms = new Map(); // Map of room names to Set of clientIds
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('🔌 WebSocket server initialized');
  }

  async handleConnection(ws, req) {
    const clientId = this.generateClientId();
    ws.clientId = clientId;
    ws.userId = null;
    ws.userRole = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          await this.handleAuthentication(ws, data.token);
        } else if (data.type === 'join_room') {
          this.joinRoom(ws.clientId, data.room);
        } else if (data.type === 'leave_room') {
          this.leaveRoom(ws.clientId, data.room);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  generateClientId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async handleAuthentication(ws, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      
      // Store client connection
      this.clients.set(ws.clientId, ws);
      
      // Join user-specific room
      this.joinRoom(ws.clientId, `user_${ws.userId}`);
      
      // Join role-specific room
      this.joinRoom(ws.clientId, `role_${ws.userRole}`);
      
      this.sendSuccess(ws, 'Authenticated successfully');
      console.log(`🔌 Client ${ws.clientId} authenticated as user ${ws.userId} (${ws.userRole})`);
      
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      this.sendError(ws, 'Authentication failed');
      ws.close();
    }
  }

  handleDisconnection(ws) {
    // Remove from all rooms
    for (const [roomName, clients] of this.rooms.entries()) {
      clients.delete(ws.clientId);
      if (clients.size === 0) {
        this.rooms.delete(roomName);
      }
    }
    
    // Remove from clients map
    this.clients.delete(ws.clientId);
    
    console.log(`🔌 Client ${ws.clientId} disconnected`);
  }

  joinRoom(clientId, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(clientId);
    
    const ws = this.clients.get(clientId);
    if (ws) {
      this.sendSuccess(ws, `Joined room: ${roomName}`);
    }
  }

  leaveRoom(clientId, roomName) {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
    
    const ws = this.clients.get(clientId);
    if (ws) {
      this.sendSuccess(ws, `Left room: ${roomName}`);
    }
  }

  broadcast(roomName, message) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const messageData = {
      type: 'broadcast',
      room: roomName,
      message,
      timestamp: new Date().toISOString()
    };

    room.forEach(clientId => {
      const ws = this.clients.get(clientId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData));
      }
    });
  }

  sendToUser(userId, message) {
    const roomName = `user_${userId}`;
    this.broadcast(roomName, message);
  }

  sendToRole(role, message) {
    const roomName = `role_${role}`;
    this.broadcast(roomName, message);
  }

  sendToAll(message) {
    const messageData = {
      type: 'broadcast',
      room: 'all',
      message,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData));
      }
    });
  }

  sendSuccess(ws, message) {
    ws.send(JSON.stringify({
      type: 'success',
      message,
      timestamp: new Date().toISOString()
    }));
  }

  sendError(ws, message) {
    ws.send(JSON.stringify({
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    }));
  }

  // Real-time events
  async notifyAppointmentUpdate(appointmentId, status) {
    try {
      const db = getDb();
      const [appointments] = await db.execute(`
        SELECT a.*, p.name as patient_name, u.name as doctor_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE a.id = ?
      `, [appointmentId]);

      if (appointments.length > 0) {
        const appointment = appointments[0];
        
        // Send to doctor
        if (appointment.doctor_id) {
          this.sendToUser(appointment.doctor_id, {
            type: 'appointment_update',
            data: appointment
          });
        }
        
        // Send to all staff
        this.sendToRole('staff', {
          type: 'appointment_update',
          data: appointment
        });
      }
    } catch (error) {
      console.error('Failed to notify appointment update:', error);
    }
  }

  async notifyNewBill(bill) {
    try {
      // Send to billing staff
      this.sendToRole('staff', {
        type: 'new_bill',
        data: bill
      });
      
      // Send to patient if they have a session
      if (bill.patient_id) {
        this.sendToUser(bill.patient_id, {
          type: 'new_bill',
          data: bill
        });
      }
    } catch (error) {
      console.error('Failed to notify new bill:', error);
    }
  }

  async notifyQueueUpdate() {
    try {
      const db = getDb();
      const [queueData] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM appointments 
        WHERE DATE(appointment_date) = CURDATE()
      `);

      this.sendToAll({
        type: 'queue_update',
        data: queueData[0]
      });
    } catch (error) {
      console.error('Failed to notify queue update:', error);
    }
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      rooms: Array.from(this.rooms.entries()).map(([name, clients]) => ({
        name,
        clients: clients.size
      }))
    };
  }
}

const wsService = new WebSocketService();

module.exports = wsService;
