const fs = require('fs');
const path = require('path');

// ============================================================
// Shared Ticket Storage Module
// Separate module to avoid any circular dependency or
// module loading order issues between ticket.js and
// interactionCreate.js
// ============================================================

const TICKETS_FILE = path.join(__dirname, '../data/tickets.json');
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory ticket store
const tickets = new Map();
let ticketCounter = 0;

// Load tickets from disk on startup
function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const raw = fs.readFileSync(TICKETS_FILE, 'utf8');
      const data = JSON.parse(raw);
      let maxCounter = 0;

      for (const [key, value] of Object.entries(data.tickets || {})) {
        tickets.set(key, value);
        const num = parseInt(key.split('-')[1]);
        if (!isNaN(num) && num > maxCounter) maxCounter = num;
      }

      ticketCounter = maxCounter;
      console.log(`[TicketStorage] Loaded ${tickets.size} tickets, counter: ${ticketCounter}`);
      return true;
    }
  } catch (err) {
    console.error('[TicketStorage] Load error:', err.message);
  }
  return false;
}

// Save tickets to disk
function saveTickets() {
  try {
    const obj = Object.fromEntries(tickets);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets: obj, lastUpdated: new Date().toISOString() }, null, 2));
    return true;
  } catch (err) {
    console.error('[TicketStorage] Save error:', err.message);
    return false;
  }
}

// Reload tickets from disk (for recovery after restart)
function reloadTickets() {
  tickets.clear();
  ticketCounter = 0;
  return loadTickets();
}

// Get next ticket number
function getNextTicketNumber() {
  ticketCounter++;
  return ticketCounter;
}

// Initialize on load
loadTickets();

module.exports = {
  tickets,
  saveTickets,
  loadTickets,
  reloadTickets,
  getNextTicketNumber,
  TICKETS_FILE
};
