import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

const socket: Socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

console.log('\n🔌 Connecting to Real-Time Orders Notification System...');
console.log(`   Server: ${SERVER_URL}\n`);

socket.on('connect', () => {
  console.log(`[CONNECTED] ✅ Connected to server (ID: ${socket.id})\n`);
});

socket.on('welcome', (data: any) => {
  console.log(`[WELCOME] ${data.message}`);
  console.log(`  Active clients: ${data.activeClients}\n`);
});

socket.on('order-update', (payload: any) => {
  const timestamp = new Date().toLocaleTimeString();

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${payload.event}] ⏰ ${timestamp}`);

  if (payload.event === 'DELETE') {
    console.log(`  Order #${payload.recordId} deleted`);
  } else {
    console.log(`  Order #${payload.recordId} ${payload.event.toLowerCase()}d`);
    if (payload.data) {
      console.log(`  Customer: ${payload.data.customer_name}`);
      console.log(`  Product:  ${payload.data.product_name}`);
      console.log(`  Status:   ${payload.data.status}`);
    }
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

socket.on('disconnect', (reason: string) => {
  console.log(`[DISCONNECTED] ❌ Disconnected: ${reason}\n`);
});

socket.on('connect_error', (error: Error) => {
  console.log(`[ERROR] ⚠️  Connection error: ${error.message}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down CLI client...');
  socket.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  socket.disconnect();
  process.exit(0);
});
