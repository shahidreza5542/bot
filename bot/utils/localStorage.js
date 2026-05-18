const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  levels: path.join(DATA_DIR, 'levels.json'),
  warnings: path.join(DATA_DIR, 'warnings.json'),
  bans: path.join(DATA_DIR, 'bans.json')
};

function initFile(filePath, defaultData = {}) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

Object.values(FILES).forEach(file => initFile(file, {}));

function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

const levelStorage = {
  get(key) {
    const data = readData(FILES.levels);
    return data[key] || { level: 1, xp: 0, messages: 0 };
  },
  set(key, value) {
    const data = readData(FILES.levels);
    data[key] = value;
    writeData(FILES.levels, data);
  },
  getGuildLevels(guildId) {
    const data = readData(FILES.levels);
    const guildLevels = [];
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(`xp-${guildId}-`)) {
        const userId = key.replace(`xp-${guildId}-`, '');
        guildLevels.push({ userId, ...value, key });
      }
    }
    return guildLevels.sort((a, b) => b.xp - a.xp);
  }
};

const warningStorage = {
  get(guildId, userId) {
    const data = readData(FILES.warnings);
    const key = `${guildId}-${userId}`;
    return data[key] || [];
  },
  add(guildId, userId, warning) {
    const data = readData(FILES.warnings);
    const key = `${guildId}-${userId}`;
    if (!data[key]) data[key] = [];
    data[key].push({
      ...warning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      active: true
    });
    writeData(FILES.warnings, data);
    return data[key];
  },
  remove(guildId, userId, warningId) {
    const data = readData(FILES.warnings);
    const key = `${guildId}-${userId}`;
    if (data[key]) {
      const warning = data[key].find(w => w.id === warningId);
      if (warning) {
        warning.active = false;
        writeData(FILES.warnings, data);
      }
    }
    return data[key] || [];
  },
  getAllForGuild(guildId) {
    const data = readData(FILES.warnings);
    const guildWarnings = [];
    for (const [key, warnings] of Object.entries(data)) {
      if (key.startsWith(`${guildId}-`)) {
        const userId = key.replace(`${guildId}-`, '');
        guildWarnings.push(...warnings.map(w => ({ ...w, userId })));
      }
    }
    return guildWarnings;
  }
};

const banStorage = {
  add(ban) {
    const data = readData(FILES.bans);
    const id = Date.now().toString();
    data[id] = {
      ...ban,
      id,
      createdAt: new Date().toISOString(),
      active: true
    };
    writeData(FILES.bans, data);
    return data[id];
  },
  get(guildId, userId) {
    const data = readData(FILES.bans);
    for (const ban of Object.values(data)) {
      if (ban.guildId === guildId && ban.userId === userId && ban.active) {
        return ban;
      }
    }
    return null;
  },
  remove(guildId, userId) {
    const data = readData(FILES.bans);
    for (const [id, ban] of Object.entries(data)) {
      if (ban.guildId === guildId && ban.userId === userId && ban.active) {
        ban.active = false;
        ban.unbannedAt = new Date().toISOString();
        writeData(FILES.bans, data);
        return ban;
      }
    }
    return null;
  },
  getAllForGuild(guildId) {
    const data = readData(FILES.bans);
    return Object.values(data).filter(ban => ban.guildId === guildId);
  }
};

module.exports = {
  levelStorage,
  warningStorage,
  banStorage
};
