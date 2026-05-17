const fs = require('fs');
const path = require('path');

// ============================================================
// Ticket Storage - Simple JSON file based
// No database, no complexity
// ============================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Make sure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets: {}, counter: 0 }, null, 2));
}

// Read raw data from file
function readData() {
  try {
    return JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
  } catch {
    return { tickets: {}, counter: 0 };
  }
}

// Write raw data to file
function writeData(data) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('[TicketStorage] Write error:', err.message);
    return false;
  }
}

// Get all tickets as an object
function getAllTickets() {
  return readData().tickets;
}

// Get a single ticket by ID
function getTicket(ticketId) {
  const data = readData();
  return data.tickets[ticketId] || null;
}

// Get open ticket for a user in a guild
function getOpenTicket(guildId, userId) {
  const data = readData();
  for (const [id, ticket] of Object.entries(data.tickets)) {
    if (ticket.guildId === guildId && ticket.userId === userId && ticket.status === 'open') {
      return { id, ...ticket };
    }
  }
  return null;
}

// Create a new ticket
function createTicket(ticketData) {
  const data = readData();
  data.counter++;
  const ticketId = `TICKET-${data.counter}`;
  data.tickets[ticketId] = {
    ...ticketData,
    ticketId,
    status: 'open',
    claimedBy: null,
    createdAt: new Date().toISOString()
  };
  writeData(data);
  return { ticketId, ticketNumber: data.counter, ...data.tickets[ticketId] };
}

// Update a ticket
function updateTicket(ticketId, updates) {
  const data = readData();
  if (!data.tickets[ticketId]) return false;
  data.tickets[ticketId] = { ...data.tickets[ticketId], ...updates };
  writeData(data);
  return true;
}

// Delete a ticket
function deleteTicket(ticketId) {
  const data = readData();
  if (!data.tickets[ticketId]) return false;
  delete data.tickets[ticketId];
  writeData(data);
  return true;
}

module.exports = {
  getAllTickets,
  getTicket,
  getOpenTicket,
  createTicket,
  updateTicket,
  deleteTicket
};
