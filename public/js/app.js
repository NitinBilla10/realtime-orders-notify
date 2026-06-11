// ===== Socket.IO Connection =====
const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// ===== DOM Elements =====
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const clientCount = document.getElementById('client-count');
const ordersTbody = document.getElementById('orders-tbody');
const eventsList = document.getElementById('events-list');
const statTotal = document.querySelector('#stat-total .stat-value');
const statPending = document.querySelector('#stat-pending .stat-value');
const statShipped = document.querySelector('#stat-shipped .stat-value');
const statDelivered = document.querySelector('#stat-delivered .stat-value');

let orders = [];
let hasReceivedEvents = false;

// ===== Socket Events =====
socket.on('connect', () => {
  statusDot.className = 'status-dot connected';
  statusText.textContent = 'Connected';
  statusText.style.color = 'var(--status-delivered)';
  fetchOrders();
});

socket.on('disconnect', () => {
  statusDot.className = 'status-dot disconnected';
  statusText.textContent = 'Disconnected';
  statusText.style.color = 'var(--danger)';
});

socket.on('welcome', (data) => {
  clientCount.textContent = `${data.activeClients} client${data.activeClients !== 1 ? 's' : ''}`;
});

socket.on('connect_error', () => {
  statusDot.className = 'status-dot disconnected';
  statusText.textContent = 'Connection Error';
  statusText.style.color = 'var(--danger)';
});

socket.on('order-update', (payload) => {
  addEventLog(payload);
  fetchOrders();
});

// ===== Fetch Orders =====
async function fetchOrders() {
  try {
    const response = await fetch('/api/orders');
    const result = await response.json();
    if (result.success) {
      orders = result.data;
      renderOrders();
      updateStats();
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  }
}

// ===== Render Orders Table =====
function renderOrders() {
  if (orders.length === 0) {
    ordersTbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
              <rect x="2" y="3" width="20" height="18" rx="2"/>
              <path d="M8 7h8M8 11h8M8 15h5"/>
            </svg>
            <p>No orders yet. Create one via the API.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  ordersTbody.innerHTML = orders
    .map(
      (order) => `
      <tr id="order-row-${order.id}" class="row-highlight">
        <td><span class="order-id">#${order.id}</span></td>
        <td>${escapeHtml(order.customer_name)}</td>
        <td>${escapeHtml(order.product_name)}</td>
        <td>
          <span class="status-badge ${order.status}">
            <span class="status-dot-badge"></span>
            ${order.status}
          </span>
        </td>
        <td>${formatDate(order.updated_at)}</td>
      </tr>
    `
    )
    .join('');
}

// ===== Update Stats =====
function updateStats() {
  statTotal.textContent = orders.length;
  statPending.textContent = orders.filter((o) => o.status === 'pending').length;
  statShipped.textContent = orders.filter((o) => o.status === 'shipped').length;
  statDelivered.textContent = orders.filter((o) => o.status === 'delivered').length;
}

// ===== Add Event Log =====
function addEventLog(payload) {
  if (!hasReceivedEvents) {
    eventsList.innerHTML = '';
    hasReceivedEvents = true;
  }

  const time = new Date().toLocaleTimeString();
  const eventType = payload.event.toLowerCase();
  let description = '';

  if (payload.event === 'DELETE') {
    description = `Order #${payload.recordId} was deleted`;
  } else if (payload.event === 'INSERT') {
    description = `New order #${payload.recordId} created`;
    if (payload.data) {
      description += ` — ${payload.data.customer_name} ordered ${payload.data.product_name}`;
    }
  } else if (payload.event === 'UPDATE') {
    description = `Order #${payload.recordId} updated`;
    if (payload.data) {
      description += ` — Status: ${payload.data.status}`;
    }
  }

  const eventHTML = `
    <div class="event-item ${eventType}">
      <div class="event-header">
        <span class="event-type ${eventType}">${payload.event}</span>
        <span class="event-time">${time}</span>
      </div>
      <div class="event-body">${description}</div>
    </div>
  `;

  eventsList.insertAdjacentHTML('afterbegin', eventHTML);

  // Keep only last 50 events
  const items = eventsList.querySelectorAll('.event-item');
  if (items.length > 50) {
    items[items.length - 1].remove();
  }
}

// ===== Clear Logs =====
function clearLogs() {
  hasReceivedEvents = false;
  eventsList.innerHTML = `
    <div class="event-placeholder">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <p>Waiting for real-time events...</p>
    </div>
  `;
}

// ===== Utilities =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ===== Initial Fetch =====
fetchOrders();
