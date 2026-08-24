# Doombot - Slack

Doom is my favourite comics villain from Marvel. That's why, I named my bot Doombot.

![Guide](assets/readme/Guide.png)
as you can see, hack club provided a guide for us to create a bot and that's what I used.

as the guide intended, i went to https://api.slack.com/apps and created an app named Doombot,
then enabled socket mode, and set perms to the bot.
set bot token scopes.

then i installed the bot in hack clubs workspace.

![TakeAPI](assets/readme/takeapi.png)
took the infos and saved them somewhere.
then i added my first commands [/doom-ping].

then i created a project on vs code, opened terminal and run some npm install commands.
stored all the infos in the .env file.

then created index.js and put this
```index.js
require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/doom-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
```
run node index.js and "bot is running!"
then i saw my bot can ping now! hell yeah!

Then wrote all the codes and set it up in nest!