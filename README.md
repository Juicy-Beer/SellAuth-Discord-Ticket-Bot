# SellAuth Discord Ticket Bot

![SellAuth](https://img.shields.io/badge/SellAuth-Integrated-brightgreen?style=for-the-badge&logo=shopify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)

A complete Discord bot for SellAuth store owners.  
Includes a full ticket system, automatic restock notifications, order/invoice alerts, shop statistics, coupon management, and payment info commands.

---

## Features

### Ticket System
- Button panels to open private support tickets
- Staff can claim, close, reopen, rename, and delete tickets
- Automatic HTML transcripts logged to a channel
- Fully configurable category, support role, and panels

### SellAuth Integration
- Real-time restock notifications with role ping
- Automatic completed order / invoice notifications
- Shop statistics (revenue, orders, customers, ratings)
- Coupon create / update / delete / list / view
- Out-of-stock checker
- Invoice lookup by ID

### Payment & Utility Commands
- `/paypal`, `/bitcoin`, `/litecoin` – display your payment addresses
- Role management, reaction roles, giveaways, purge, and more
- Whitelist system so only authorized users can run admin commands

---

## Setup

### 1. Create a Discord Application
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to the **Bot** tab → **Add Bot**
4. Copy the **Token** → this is your `DISCORD_TOKEN`
5. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
6. Go to **OAuth2 → General** and copy the **Client ID** → this is your `CLIENT_ID`

### 2. Invite the Bot
1. Go to **OAuth2 → URL Generator**
2. Scopes: `bot` + `applications.commands`
3. Bot Permissions:
   - Manage Channels
   - Manage Roles
   - View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
4. Copy the generated URL and invite the bot to your server

### 3. Get your SellAuth Credentials
1. Log in to your SellAuth dashboard
2. Go to **Account → API**
   - Copy your **API Key** → `SELLAUTH_API_KEY`
   - Copy your **Shop ID** → `SHOP_ID`
3. Go to **Storefront → Configure → Miscellaneous**
   - Copy the **Webhook Secret** → `SELLAUTH_WEBHOOK_SECRET`
4. Your store domain (e.g. `yourstore.mysellauth.com`) → `SELLAUTH_DOMAIN`

### 4. Create Discord Webhooks
- One webhook for **restock** notifications → `RESTOCK_WEBHOOK_URL`
- One webhook for **invoice/order** notifications → `INVOICE_NOTIFIER_DISCORD_WEBHOOK_URL`

### 5. Clone & Install

```bash
git clone https://github.com/Juicy-Beer/SellAuth-Discord-Ticket-Bot.git
cd SellAuth-Discord-Ticket-Bot
npm install
