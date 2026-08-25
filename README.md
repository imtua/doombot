# Doombot - Slack

Doom is my favourite comics villain from Marvel. That's why, I named my bot Doombot.

## What is this about?

This is a slack bot built for the hack club slack workplace that let's you run lots of fun tools, api utilities, and simple automation commands directly inside slack.

## API and external tools
- /doom-help : Doom will help you.
- /doom-hi : Doom will say hi back.
- /doom-ping : Doom is here.
- /doom-fact : Doom will say a fact about himself.
- /doom-8ball : Doom will decide.
- /doom-catfact : Doom has 8 cats and will spit a fact about meows.
- /doom-roll : Doom will roll a dice for you.
- /doom-joke : Doom is funny and will joke.
- /doom-remind : Doom will remind for you.

## What did I actually do?
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

## How does it work?
the bot is already installed in the hack club slack workspace. to use it: go to slack and run commands starting with / it is recommended to
message the bot directly. example usage: -/doom-help -/doom-hi -/doom-ping

Note: almost all commands require an input after the command, separated by a space. setup (optional):

if you want to run your own version: 
```bash
#clone this repo
git clone https://github.com/not-imtiaz/doombot
cd doombot
npm install

#set environment variables (create a .env file)
nano .env

#run the bot
node index.js
```

## What I learned from this little project:
I learned a lot about what API’s are and how they work, ssh servers, and hosting code, python, and backend systems. I learned to build a slack bot
using node.js and slack bolt, work with external API’s and async request handling, connect multiple services together (slack, python services,
external API’s) and even deploy and host backend code on remote servers using ssh 

## Creator
made by: imtiaz <3