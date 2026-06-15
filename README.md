# 🤖 Mridu — A Slack Bot

A fun Slack bot built for a **Hack Club** event! Mridu responds to slash commands and can tell you jokes, share cat facts, and check its own latency.

---

## ✨ Features

| Command | Description |
|---|---|
| `/mridu-ping` | Check the bot's response latency |
| `/mridu-catfact` | Get a random cat fact |
| `/mridu-joke` | Get a random joke |
| `/mridu-help` | Show all available commands |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+
- A Slack workspace where you have permission to install apps
- A [Slack App](https://api.slack.com/apps) with Socket Mode enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mridu-slack-bot.git
   cd mridu-slack-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   ```

4. **Run the bot**
   ```bash
   node index.js
   ```

   You should see:
   ```
   Mridu can talk now!
   ```

---

## ⚙️ Slack App Configuration

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app **from scratch**.
2. Under **Socket Mode**, enable it and generate an **App-Level Token** with the `connections:write` scope — this is your `SLACK_APP_TOKEN`.
3. Under **OAuth & Permissions**, add the `chat:write` and `commands` bot token scopes. Install the app to your workspace and copy the **Bot User OAuth Token** — this is your `SLACK_BOT_TOKEN`.
4. Under **Slash Commands**, create the following commands and point them at your app:
   - `/mridu-ping`
   - `/mridu-catfact`
   - `/mridu-joke`
   - `/mridu-help`

---

## 🗂️ Project Structure

```
mridu-slack-bot/
├── index.js        # Main bot logic
├── .env            # Environment variables (never commit this!)
├── .gitignore
├── package.json
└── README.md
```

---

## 📦 Dependencies

- [`@slack/bolt`](https://slack.dev/bolt-js/) — Slack's official bot framework for Node.js
- [`axios`](https://axios-http.com/) — HTTP client for fetching cat facts and jokes
- [`dotenv`](https://github.com/motdotla/dotenv) — Loads environment variables from `.env`

---

## 🌐 External APIs Used

- **Cat Facts** — [catfact.ninja](https://catfact.ninja/)
- **Random Jokes** — [official-joke-api.appspot.com](https://official-joke-api.appspot.com/)

---

## 🔒 .gitignore

Make sure your `.env` file is never committed:

```
node_modules/
.env
```

---

## 🛠️ Built With

- [Slack Bolt for JS](https://slack.dev/bolt-js/)
- [Node.js](https://nodejs.org/)
- ❤️ for [Hack Club](https://hackclub.com/)

---

## 📄 License

MIT — feel free to fork and build your own Mridu!
