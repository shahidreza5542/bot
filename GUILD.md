# Toolmetry AI Discord Bot - Complete Feature Guide

## Overview
Toolmetry AI is a powerful all-in-one Discord bot designed specifically for your server. It features AI-powered fun commands, tickets, moderation, welcome system, and automatic activity engagement - all WITHOUT database storage for core features (everything stays in Discord/memory).

## Features

### 1. Ticket System (Discord-Only, No Database)
Create and manage support tickets directly in Discord.

**Commands:**
- `/ticket-panel` - Send branded ticket panel (Admin only)
- `/ticket <subject>` - Create a support ticket

**Ticket Features:**
- Branded Toolmetry AI embed design
- Claim button - Staff can claim tickets
- Close button - Closes ticket (deletes after 5 min)
- Delete button - Instantly deletes ticket
- Permission-based access

**How to use:**
1. Run `/ticket-panel` in your support channel
2. Users click "Create Ticket" button
3. Ticket channel is created with Claim/Close/Delete buttons
4. Staff can claim, close, or delete tickets

---

### 2. Welcome System (Discord-Only)
Customizable welcome messages for new members.

**Commands:**
- `/welcome setup` - Configure welcome messages
  - `channel` - Where to send welcome messages
  - `message` - Custom message (use {user} and {server})
  - `embed` - Send as embed? (true/false)
  - `color` - Embed color hex code
  - `image` - Welcome image URL
- `/welcome disable` - Turn off welcome messages
- `/welcome test` - Test the welcome message

**Variables:**
- `{user}` - Mentions the new user
- `{server}` - Shows server name

**Example:**
```
/welcome setup channel:#welcome message:Welcome {user} to {server}! embed:true color:#00D4AA
```

---

### 3. AI-Powered Fun Commands
All fun commands use Pollinations AI (free, unlimited).

#### /joke - AI Generated Jokes
- `/joke` - Random AI joke
- `/joke type:roast target:@user` - AI roast someone
- `/joke type:pun` - AI pun
- `/joke delivery:everyone` - Mention everyone with joke (Admin only)

#### /8ball - AI Magic 8-Ball
- `/8ball question:Will I win?` - AI answers your question
- Uses AI to generate mysterious responses

#### /roast - Roast Someone
- `/roast user:@username` - Roast a user with style

#### /compliment - Compliment Someone
- `/compliment user:@username` - Make someone's day

#### /meme - Random Memes
- `/meme` - Fetches random meme from Reddit

---

### 4. Auto Activity System (AI-Powered)
Bot automatically keeps your server active!

**Features:**
- **Auto-Roast Inactive Users**: Bot detects inactive users (30+ min) and roasts them with AI-generated jokes
- **Activity Tracking**: Tracks who is chatting
- **Smart Detection**: Only roasts once every 2 hours per user
- **No Commands Needed**: Fully automatic

**How it works:**
1. Bot tracks user activity in real-time
2. If someone hasn't chatted for 30+ minutes
3. Bot generates an AI roast
4. Posts it in the channel when someone else sends a message

---

### 5. Moderation (Discord-Only)
No database warnings - everything stored in memory.

#### /warn
- `/warn user:@user reason:Spamming` - Warn a user
- Sends DM to user
- Tracks warnings in memory

#### /ban
- `/ban user:@user reason:Breaking rules` - Ban user

#### /kick
- `/kick user:@user reason:Bad behavior` - Kick user

#### /purge
- `/purge amount:10` - Delete last 10 messages
- `/purge amount:5 user:@user` - Delete user's last 5 messages

---

### 6. Utility Commands

#### /embed - Custom Embed Builder
Create beautiful embeds with full customization:

**Options:**
- `title` (required) - Embed title
- `description` (required) - Main message
- `color` - Hex color (#00D4AA)
- `footer` - Footer text
- `footer_image` - Footer icon URL
- `image` - Main image URL
- `thumbnail` - Thumbnail URL
- `author` - Author name
- `author_image` - Author icon
- `channel` - Where to send (optional)

**Example:**
```
/embed title:"Announcement" description:"Big news!" color:#FF0000 footer:"Toolmetry AI" channel:#announcements
```

#### /serverinfo
- Shows server statistics
- Member count, roles, channels, boost level

#### /userinfo [user]
- Shows user information
- Join date, account creation, roles

#### /avatar [user]
- Shows user's avatar in full size

#### /poll
- `/poll question:"Best color?" option1:Red option2:Blue`
- Creates a reaction poll

#### /say
- `/say message:"Hello everyone!" channel:#general`
- Make bot say something

---

### 7. Fun Interaction Commands

#### /hug @user
- Sends a hug GIF

#### /slap @user
- Sends a slap GIF (all in good fun)

#### /coinflip
- Flips a coin (Heads/Tails)

#### /roll
- `/roll sides:6` - Roll a dice
- `/roll min:1 max:100` - Random number

---

### 8. Activity Commands (Admin Only)
Engage the entire server with one command.

#### /activity mention-all-joke
- Mentions @everyone with an AI-generated joke
- Perfect for reviving chat

#### /activity mention-all-msg
- Send custom message with @everyone

#### /activity fun-fact
- Share an interesting fact with @everyone

---

## AI Integration
The bot uses **Pollinations AI** (completely free, unlimited requests) for:
- Joke generation
- 8-ball responses
- Inactivity roasts

**Benefits:**
- No API key needed
- Unlimited requests
- Fast responses
- Always free

---

## Storage Model
**No Database for Core Features:**
- Tickets: Stored in memory only (lost on restart)
- Warnings: Stored in memory only
- Welcome settings: Stored in memory only
- Activity tracking: Real-time memory

**Why?**
- Faster performance
- No database setup needed
- Perfect for single-server use
- Privacy (no persistent logs)

**Note:** If bot restarts, ticket/warning data is reset. This is by design for privacy.

---

## Setup Instructions

### 1. Environment Variables (.env)
```
DISCORD_TOKEN=your_bot_token
MONGODB_URI=your_mongodb_uri (optional, for auth only)
PORT=5000
```

### 2. Install & Run
```bash
npm install
npm start
```

### 3. Initial Configuration
1. Invite bot to server
2. Run `/welcome setup` (optional)
3. Run `/ticket-panel` in your support channel
4. Done! Bot is fully functional

---

## Command Reference Table

| Command | Usage | Permission |
|---------|-------|------------|
| /ticket-panel | Send ticket panel | Admin |
| /ticket | Create ticket | Everyone |
| /welcome setup | Configure welcome | Admin |
| /welcome test | Test welcome | Admin |
| /joke | AI joke | Everyone |
| /8ball | AI 8-ball | Everyone |
| /roast | Roast user | Everyone |
| /compliment | Compliment user | Everyone |
| /warn | Warn user | Kick Members |
| /ban | Ban user | Ban Members |
| /kick | Kick user | Kick Members |
| /purge | Delete messages | Manage Messages |
| /embed | Create embed | Manage Messages |
| /activity | Server engagement | Admin |
| /serverinfo | Server stats | Everyone |
| /userinfo | User info | Everyone |
| /avatar | Show avatar | Everyone |
| /meme | Random meme | Everyone |
| /poll | Create poll | Admin |
| /say | Bot says message | Admin |
| /hug | Hug user | Everyone |
| /slap | Slap user | Everyone |
| /coinflip | Flip coin | Everyone |
| /roll | Roll dice | Everyone |
| /help | Show help | Everyone |
| /rank | Check level | Everyone |

---

## Support
For support, use the ticket system in your server or contact the bot developer.

**Powered by Toolmetry AI** - Made with love for your server ❤️
