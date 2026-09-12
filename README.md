# SellAuth Discord Ticket Bot

![SellAuth](https://img.shields.io/badge/SellAuth-Integrated-brightgreen?style=for-the-badge&logo=shopify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)

A Discord bot built for SellAuth store owners. It handles support tickets, transcripts, and automatic restock notifications.

---

## What it does

- Opens private ticket channels when a customer clicks a panel button
- Pings your support team and the customer when a ticket is created
- Lets staff claim and close tickets with a single click
- Saves an HTML transcript of every ticket and logs it to a channel
- Sends a Discord embed with an @Restock ping whenever you restock a product on SellAuth

---

## Setup

### 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to the **Bot** tab and click **Add Bot**
4. Under **Token** click **Reset Token** and copy it this is your `DISCORD_TOKEN`
5. Scroll down to **Privileged Gateway Intents** and enable:
   - Server Members Intent
   - Message Content Intent
6. Go to the **OAuth2** tab → **General** and copy your **Client ID** this is your `CLIENT_ID`

### 2. Invite the bot to your server

1. Go to **OAuth2** → **URL Generator**
2. Under **Scopes** tick `bot` and `applications.commands`
3. Under **Bot Permissions** tick:
   - Manage Channels
   - Manage Roles
   - Read Messages / View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
4. Copy the generated URL and open it in your browser to invite the bot

### 3. Get your SellAuth API key

1. Log in to your SellAuth dashboard
2. Go to **Account → API**
3. Generate and copy your API key, this is your `SELLAUTH_API_KEY`
4. Your `SHOP_ID` is visible in the same section or in your store URL

### 4. Get your SellAuth Webhook Secret

1. Go to **Storefront → Configure → Miscellaneous**
2. Scroll down to **Webhook Secret** and copy it, this is your `SELLAUTH_WEBHOOK_SECRET`

### 5. Create a Discord Webhook for restock notifications

1. Go to your Discord restock channel
2. Click **Edit Channel → Integrations → Webhooks → New Webhook**
3. Copy the webhook URL, this is your `RESTOCK_WEBHOOK_URL`

### 6. Clone the repo

```bash
git clone https://github.com/alfiebull17/SellAuth-Discord-Ticket-Bot
cd SellAuth-Discord-Ticket-Bot
npm install
```

### 7. Configure your environment

Create a `.env` file in the root of the project:

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here

SHOP_ID=your_sellauth_shop_id_here
SELLAUTH_API_KEY=your_sellauth_api_key_here

PAYPAL_EMAIL=your_paypal_email@example.com
BITCOIN_ADDRESS=your_bitcoin_wallet_address
LITECOIN_ADDRESS=your_litecoin_wallet_address

WHITELISTED_USERS=white_listed_user_id

RESTOCK_WEBHOOK_URL=your_discord_webhook_url
RESTOCK_ROLE_ID=your_restock_role_id
SELLAUTH_WEBHOOK_SECRET=your_sellauth_webhook_secret

INVOICE_NOTIFIER_DISCORD_WEBHOOK_URL=your_webhook_url_here
INVOICE_NOTIFIER_ROLE_ID=your_role_id_here
```

### 8. Deploy slash commands

```bash
node deploy-commands.js
```

### 9. Start the bot

```bash
node index.js
```

---

## Restock Notifications

The bot includes a separate Express server that listens for SellAuth HTTP notifications and sends a Discord embed with an @Restock ping whenever a product variant is restocked.

### Running the restock server

```bash
node server/restock.js
```

### Deploying to Render (Free Server)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repo
3. Set the start command to `node server/restock.js`
4. Add your environment variables in the Render dashboard
5. Copy your Render URL and paste it into SellAuth → Storefront → Notifications → Product Restocked → HTTP Request

To keep the server alive on Render's free tier, use [UptimeRobot](https://uptimerobot.com) to ping your server URL every 5 minutes.

### Connecting SellAuth to the restock server

1. Go to SellAuth → **Storefront → Notifications**
2. Find **Product Restocked** and enable **HTTP Request**
3. Paste your Render URL followed by `/sellauth-webhook`
4. Hit **Save Settings**

---

## Requirements

- Node.js v18 or higher
- A Discord bot with the following intents: `Guilds`, `GuildMessages`, `MessageContent`, `GuildMembers`
- A SellAuth store with API access
- A hosting provider for the bot (like Wispbyte, Railway, or a VPS)
- A hosting provider for the restock server (like Render)

---

## Support

Got a question or an issue? Message me on Discord **@Juicybeer**
