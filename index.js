require("dotenv").config();
const axios = require("axios");
const { App } = require("@slack/bolt");
const { btoa } = require("buffer");
const { privateEncrypt } = require("crypto");
const e = require("express");
const { join } = require("path");
const { normalize } = require("path/posix");
const { checkServerIdentity } = require("tls");
const { promiseHooks } = require("v8");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

app.command("/doom-ping", async ({ command, ack, respond }) => {
    const start = Date.now();
    await ack();
    const latency = Date.now() - start;
    await respond({
        response_type: "in_channel",
        text: `Pong!\nLatency: ${latency}ms`
    });
});

(async () => {
    await app.start();
    console.log("Answer to doom.");
})();

app.command("/doom-help", async ({ ack, respond }) => {
    await ack();
    await respond({
        response_type: "in_channel",
        text:
            `Need help, Doom? Here are the commands you can use:
/doom-ping - Doom will ping you back with latency.
/doom-help - Doom will help you with the commands you can use.
/doom-hi - Doom will say hi to you.
/doom-catfact - Doom has a cat fact for you.
/doom-fact - Doom will give you a random fact about himself.
/doom-8ball - Doom decides what happens.
/doom-roll - Doom rolls a dice for you.
/doom-joke - Doom is funny, he will tell you a joke.
/doom-remind - Do it or get doomed.`
    });
});

app.command("/doom-catfact", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://catfact.ninja/fact");
        await respond({ text: 'Doom says: Hee\'s a cat fact from doom: ' + response.data.fact });
    } catch (error) {
        await respond({
            response_type: "in_channel",
            text: "Meow."
        });
    }
});

app.command("/doom-hi", async ({ ack, respond }) => {
    await ack();

    await respond({
        response_type: "in_channel",
        text: "Hell answers to me for I am Doom. I'm from Latveria and I wanna rule the whole world."
    })
});

app.command("/doom-remind", async ({ command, ack, respond }) => {
    await ack();
    const parts = command.text.split(" ");
    const minutes = Number(parts[0]);
    const reminder = parts.slice(1).join(" ");
    if (!minutes || !reminder) {
        await respond({
            response_type: "in_channel",
            text: "Are you dumb? Usage: /doom-remind <minutes> <reminder>"
        });
        return;
    }
    await respond({
        response_type: "in_channel",
        text: `Doom will remind you in ${minutes} minutes: ${reminder}`
    });
    setTimeout(async () => {
        await respond({
            response_type: "in_channel",
            text: `Doom reminds you: ${reminder}`
        }, minutes * 60 * 1000);
    })
})

app.command("/doom-fact", async ({ ack, respond }) => {
    await ack();
    const facts = [
        "Doom gave his entire country, Latveria, free high-speed wifi, and made the password 'RICHARDSUCKS' just because he wanted to.",
        "Doom built a time machine just to steal Blackbeard's treasure.",
        "Doom spent weeks mastering the piano just to outplay a man he hated.",
        "Doom cured the thing just to prove he could do what Reed Richards couldn't.",
        "Doom secretly paid for a brilliant student's education because he believed genius should never be wasted.",
        "Doom engineered crops that could grow in any environment to help end the world hunger.",
        "Doom delivered Christmas presents after Santa Claus got injured.",
        "Doom saved Susan Storm and her unborn baby when nobody else could, not even the Fantastic Four.",
        "Doom took a bullet to protect Iron Heart, while acting as Iron Man.",
        "Doom mastered Science and Magic, just to make his mother's soul free from hell.",
        "Doom protected Latveria from the Marvel Zombies Outbreak.",
        "Doom saved the multiverse by creating a battlefield for Secret Wars.",
        "Doom held off the mad celestials long enough for the Fantastic Four to save the universe.",
        "Doom transformed Latveria into one of the safest and most technologically advanced countries in the world.",
        "Doom killed Thanos by ripping out his spine in Secret Wars.",
        "Emporer Doom bought world peace and ended world hunger.",
        "Doom freed molecule man from the mental blocks limiting his powers.",
        "Doom became the infamous Iron Man and fought crime as a hero.",
        "Doom freed his mother's soul from Mephisto and helped her reach Heaven.",
        "Doom saved the multiverse from the Beyonder and his army of villains.",
        "Doom created an army of Doombots to protect Latveria and the world from threats.",
        "Doom defeated the Silver Surfer and took his powers to become a god.",
        "Doom created a device that could control the weather and used it to save Latveria from natural disasters.",
        "Doom created a device that could manipulate time and used it to prevent disasters and save lives.",
        "Doom created a device that could heal any disease and used it to cure the sick and injured.",
        "Doom created a device that could teleport people and used it to rescue hostages and victims of natural disasters.",
        "Doom created a device that could create force fields and used it to protect Latveria from attacks.",
        "Doom created a device that could create energy blasts and used it to defend Latveria from invaders.",
        "Doom created a device that could create holograms and used it to entertain and educate the people of Latveria."
    ];

    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    await respond({
        response_type: "in_channel",
        text: randomFact
    });
});

app.command("/doom-8ball", async ({ command, ack, respond }) => {
    await ack();
    const answers = [
        "It is certain.",
        "It is decidedly so.",
        "Without a doubt.",
        "Yes - definitely.",
        "You may rely on it.",
        "As I see it, yes.",
        "Most likely.",
        "Outlook good.",
        "Yes.",
        "Signs point to yes.",
        "Reply hazy, try again.",
        "Ask again later.",
        "Better not tell you now.",
        "Cannot predict now.",
        "Concentrate and ask again.",
        "Don't count on it.",
        "My reply is no.",
        "My sources say no.",
        "Outlook not so good.",
        "Very doubtful."
    ];

    const answer = answers[Math.floor(Math.random() * answers.length)];
    await respond({
        response_type: "in_channel",
        text: answer
    });
});

app.command("/doom-roll", async ({ command, ack, respond }) => {
    await ack();
    const roll = Math.floor(Math.random() * 6) + 1;
    await respond({
        response_type: "in_channel",
        text: `Doom rolled a dice and got: ${roll}`
    });
});

app.command("/doom-joke", async ({ command, ack, respond }) => {
    await ack();
    const jokes = [
        "Why did Doom cross the road? To get to the other side of Latveria.",
        "Why did Doom go to the doctor? Because he was feeling a little villainous.",
        "Why did Doom go to the bar? To get a drink and plot his next evil scheme.",
        "Why did Doom go to the bank? To deposit his evil plans.",
        "Why did Doom go to the library? To check out some books on world domination.",
        "Why did Doom go to the gym? To work on his evil muscles.",
        "Why did Doom go to the park? To take a stroll and plot his next evil move.",
        "Why did Doom go to the zoo? To see the animals and plan his next evil scheme.",
        "Why did Doom go to the beach? To soak up the sun and plot his next evil plan.",
        "Why did Doom go to the movies? To watch a film and plan his next evil scheme."
    ];

    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    await respond({
        response_type: "in_channel",
        text: joke
    });
});