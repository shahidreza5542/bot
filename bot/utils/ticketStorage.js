const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const tickets = new Map();
let ticketCounter = 0;

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
      return true;
    }
  } catch (err) {
    console.error('TicketStorage load error:', err.message);
  }
  return false;
}

function saveTickets() {
  try {
    const obj = Object.fromEntries(tickets);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets: obj, lastUpdated: new Date().toISOString() }, null, 2));
    return true;
  } catch (err) {
    console.error('TicketStorage save error:', err.message);
    return false;
  }
}

function getNextTicketNumber() {
  ticketCounter++;
  saveTickets();
  return ticketCounter;
}

function addTicket(ticketId, data) {
  tickets.set(ticketId, data);
  saveTickets();
}

function removeTicket(ticketId) {
  tickets.delete(ticketId);
  saveTickets();
}

function findOpenTicket(userId, guildId) {
  for (const [id, ticket] of tickets) {
    if (ticket.userId === userId && ticket.guildId === guildId && ticket.status === 'open') {
      return { id, ...ticket };
    }
  }
  return null;
}

function findTicketByChannel(channelId) {
  for (const [id, ticket] of tickets) {
    if (ticket.channelId === channelId) {
      return { id, ...ticket };
    }
  }
  return null;
}

loadTickets();

module.exports = {
  tickets,
  saveTickets,
  loadTickets,
  getNextTicketNumber,
  addTicket,
  removeTicket,
  findOpenTicket,
  findTicketByChannel
};
