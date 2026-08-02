require("dotenv").config();
const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
});


const divider = () => ({ type: "divider" });


const contextBlock = (text) => ({
    type: "context",
    elements: [{ type: "mrkdwn", text }],
});


app.command("/mridu-ping", async ({ command, ack, respond }) => {
    const start = Date.now();
    await ack();
    const latency = Date.now() - start;

    await respond({
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:ping_pong:  *Pong!*\n\`Latency: ${latency}ms\`  —  Mridu is online and responsive.`,
                },
            },
        ],
    });
});


app.command("/mridu-help", async ({ ack, respond }) => {
    await ack();

    await respond({
        response_type: "ephemeral", // only visible to the caller
        blocks: [
            {
                type: "header",
                text: { type: "plain_text", text: "🤖  Mridu Command Center", emoji: true },
            },
            divider(),
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Pick a command from the menu below to trigger it instantly, or just type it in chat:",
                },
                accessory: {
                    type: "static_select",
                    placeholder: { type: "plain_text", text: "Run a command…", emoji: true },
                    action_id: "help_command_select",
                    options: [
                        { text: { type: "plain_text", text: "🏓  Ping — Check latency" }, value: "/mridu-ping" },
                        { text: { type: "plain_text", text: "🐱  Cat Fact" }, value: "/mridu-catfact" },
                        { text: { type: "plain_text", text: "😂  Random Joke" }, value: "/mridu-joke" },
                        { text: { type: "plain_text", text: "📊  Launch a Poll" }, value: "/mridu-poll" },
                        { text: { type: "plain_text", text: "🍅  Pomodoro Timer" }, value: "/mridu-pomodoro" },
                        { text: { type: "plain_text", text: "📝  Submit Feedback" }, value: "/mridu-feedback" },
                        { text: { type: "plain_text", text: "📖  Channel TL;DR Summary" }, value: "/mridu-tldr" },
                        { text: { type: "plain_text", text: "💻  Code Snapshot Previewer" }, value: "/mridu-carbon" },
                    ],
                },
            },
            divider(),
            contextBlock(":zap: Built for Hack Club · Socket Mode · Powered by Slack Bolt"),
        ],
    });
});

// Action handler for the help dropdown — echoes back a reminder tip.
app.action("help_command_select", async ({ body, ack, respond }) => {
    await ack();
    const chosen = body.actions[0].selected_option.value;
    await respond({
        response_type: "ephemeral",
        replace_original: false,
        text: `:point_right:  Type *${chosen}* in this channel to run that command!`,
    });
});

app.command("/mridu-catfact", async ({ ack, respond }) => {
    await ack();

    try {
        const { data } = await axios.get("https://catfact.ninja/fact");

        await respond({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `:cat:  *Did you know?*\n\n${data.fact}`,
                    },
                    accessory: {
                        type: "image",
                        image_url: "https://cataas.com/cat",
                        alt_text: "A random cat photo",
                    },
                },
                divider(),
                contextBlock("Source: catfact.ninja · Use `/mridu-catfact` again for another one!"),
            ],
        });
    } catch (err) {
        console.error("[/mridu-catfact]", err.message);
        await respond({ text: ":warning:  Couldn't fetch a cat fact right now. Try again in a moment!" });
    }
});


app.command("/mridu-joke", async ({ ack, respond }) => {
    await ack();

    try {
        const { data } = await axios.get("https://official-joke-api.appspot.com/random_joke");

        await respond({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `:microphone:  *${data.setup}*`,
                    },
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        // Punchline is separated with a visual pause using em-dashes
                        text: `:drum_with_drumsticks:  _${data.punchline}_`,
                    },
                },
                divider(),
                contextBlock(`Category: ${data.type} · Source: official-joke-api`),
            ],
        });
    } catch (err) {
        console.error("[/mridu-joke]", err.message);
        await respond({ text: ":warning:  Couldn't fetch a joke right now. Try again later!" });
    }
});

const polls = {};

app.command("/mridu-poll", async ({ command, ack, client, respond }) => {
    await ack();

    const parts = command.text.split("|").map((s) => s.trim()).filter(Boolean);

    if (parts.length < 3) {
        await respond({
            response_type: "ephemeral",
            text: ":information_source:  *Usage:* `/mridu-poll Question | Option 1 | Option 2 | Option 3`\nYou need a question and at least two options.",
        });
        return;
    }

    const [question, ...options] = parts;
    const trimmedOptions = options.slice(0, 5); // cap at 5 options

    // Generate a short unique poll ID from the current timestamp
    const pollId = `poll_${Date.now()}`;

    // Initialise vote store for this poll
    polls[pollId] = {
        question,
        options: trimmedOptions,
        votes: Object.fromEntries(trimmedOptions.map((_, i) => [i, new Set()])),
    };

    const buttonElements = trimmedOptions.map((option, i) => ({
        type: "button",
        text: { type: "plain_text", text: option, emoji: true },
        action_id: `poll_vote_${i}`,
        value: `${pollId}::${i}`,
    }));

    try {
        await client.chat.postMessage({
            channel: command.channel_id,
            blocks: [
                {
                    type: "header",
                    text: { type: "plain_text", text: `📊  ${question}`, emoji: true },
                },
                divider(),
                {
                    type: "actions",
                    block_id: pollId,
                    elements: buttonElements,
                },
                divider(),
                contextBlock(`Poll started by <@${command.user_id}> · Vote above! Results update live.`),
            ],
        });
    } catch (err) {
        console.error("[/mridu-poll postMessage]", err.message);
        await respond({ text: ":warning:  Failed to post the poll. Check the bot's channel permissions." });
    }
});

async function handlePollVote(optionIndex, { body, ack, client }) {
    await ack();

    try {
        const value = body.actions[0].value;          // "pollId::optionIndex"
        const pollId = value.split("::")[0];
        const poll = polls[pollId];

        if (!poll) {
            return;
        }

        const userId = body.user.id;

        if (poll.votes[optionIndex].has(userId)) {
            poll.votes[optionIndex].delete(userId);
        } else {
            for (const [idx, voters] of Object.entries(poll.votes)) {
                if (Number(idx) !== optionIndex) voters.delete(userId);
            }
            poll.votes[optionIndex].add(userId);
        }

        // Compute totals for the results bar
        const total = Object.values(poll.votes).reduce((sum, s) => sum + s.size, 0);

        const resultsText = poll.options
            .map((opt, i) => {
                const count = poll.votes[i].size;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
                return `*${opt}*\n\`${bar}\`  ${pct}%  (${count} vote${count !== 1 ? "s" : ""})`;
            })
            .join("\n\n");

        // Re-build the button row to preserve interactivity after update
        const buttonElements = poll.options.map((option, i) => ({
            type: "button",
            text: { type: "plain_text", text: option, emoji: true },
            action_id: `poll_vote_${i}`,
            value: `${pollId}::${i}`,
            // Highlight the option this user voted for
            style: poll.votes[i].has(userId) ? "primary" : undefined,
        }));

        await client.chat.update({
            channel: body.channel.id,
            ts: body.message.ts,
            blocks: [
                {
                    type: "header",
                    text: { type: "plain_text", text: `📊  ${poll.question}`, emoji: true },
                },
                divider(),
                {
                    type: "section",
                    text: { type: "mrkdwn", text: resultsText },
                },
                divider(),
                {
                    type: "actions",
                    block_id: pollId,
                    elements: buttonElements,
                },
                divider(),
                contextBlock(`${total} vote${total !== 1 ? "s" : ""} cast · Last updated by <@${userId}>`),
            ],
        });
    } catch (err) {
        console.error("[poll_vote]", err.message);
    }
}

// Register a handler for each of the 5 possible option slots
for (let i = 0; i < 5; i++) {
    app.action(`poll_vote_${i}`, (args) => handlePollVote(i, args));
}


app.command("/mridu-pomodoro", async ({ command, ack, client, respond }) => {
    await ack();

    const DURATION_MS = 25 * 60 * 1000; // 25 minutes
    const DURATION_LABEL = "25 minutes";
    const userId = command.user_id;

    // Immediate confirmation visible only to the user
    await respond({
        response_type: "ephemeral",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:tomato:  *Pomodoro started!*\nYour ${DURATION_LABEL} focus sprint is running. Stay in the zone — Mridu will DM you when it's time to take a break. :headphones:`,
                },
            },
        ],
    });

    setTimeout(async () => {
        try {
            // Open a DM channel with the user
            const dmResult = await client.conversations.open({ users: userId });
            const dmChannel = dmResult.channel.id;

            await client.chat.postMessage({
                channel: dmChannel,
                blocks: [
                    {
                        type: "header",
                        text: { type: "plain_text", text: "🍅  Pomodoro Complete!", emoji: true },
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `Great work, <@${userId}>! Your *${DURATION_LABEL}* focus sprint is done.\n\n:coffee:  Take a 5-minute break before the next one. You've earned it!`,
                        },
                    },
                    divider(),
                    contextBlock("Tip: After 4 Pomodoros, take a longer 15–30 minute break."),
                ],
            });
        } catch (err) {
            console.error("[/mridu-pomodoro DM]", err.message);
        }
    }, DURATION_MS);
});



app.command("/mridu-feedback", async ({ command, ack, client }) => {
    await ack();

    try {
        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                type: "modal",
                callback_id: "feedback_submit",
                title: { type: "plain_text", text: "💬  Share Feedback", emoji: true },
                submit: { type: "plain_text", text: "Submit", emoji: true },
                close: { type: "plain_text", text: "Cancel", emoji: true },
                private_metadata: command.channel_id, // pass channel for the thank-you post
                blocks: [
                    {
                        type: "input",
                        block_id: "feedback_category_block",
                        label: { type: "plain_text", text: "Category" },
                        element: {
                            type: "static_select",
                            action_id: "feedback_category",
                            placeholder: { type: "plain_text", text: "What is this about?" },
                            options: [
                                { text: { type: "plain_text", text: "💡  Idea or Feature Request" }, value: "idea" },
                                { text: { type: "plain_text", text: "🐛  Bug or Issue" }, value: "bug" },
                                { text: { type: "plain_text", text: "👏  General Praise" }, value: "praise" },
                                { text: { type: "plain_text", text: "🔧  Something to Improve" }, value: "improve" },
                            ],
                        },
                    },
                    {
                        type: "input",
                        block_id: "feedback_title_block",
                        label: { type: "plain_text", text: "Short Title" },
                        element: {
                            type: "plain_text_input",
                            action_id: "feedback_title",
                            placeholder: { type: "plain_text", text: "One line summary…" },
                            max_length: 80,
                        },
                    },
                    {
                        type: "input",
                        block_id: "feedback_body_block",
                        label: { type: "plain_text", text: "Details" },
                        element: {
                            type: "plain_text_input",
                            action_id: "feedback_body",
                            multiline: true,
                            placeholder: { type: "plain_text", text: "Tell us more…" },
                            max_length: 1000,
                        },
                    },
                    {
                        type: "input",
                        block_id: "feedback_rating_block",
                        label: { type: "plain_text", text: "Overall Rating" },
                        element: {
                            type: "static_select",
                            action_id: "feedback_rating",
                            placeholder: { type: "plain_text", text: "Pick a rating" },
                            options: ["⭐ 1 — Poor", "⭐⭐ 2 — Fair", "⭐⭐⭐ 3 — Good", "⭐⭐⭐⭐ 4 — Great", "⭐⭐⭐⭐⭐ 5 — Excellent"]
                                .map((label, i) => ({
                                    text: { type: "plain_text", text: label },
                                    value: String(i + 1),
                                })),
                        },
                    },
                ],
            },
        });
    } catch (err) {
        console.error("[/mridu-feedback modal open]", err.message);
    }
});

// Handle the modal submission
app.view("feedback_submit", async ({ ack, view, body, client }) => {
    await ack(); // Always ack first — Slack requires this within 3 seconds

    try {
        const values = view.state.values;
        const category = values.feedback_category_block.feedback_category.selected_option.text.text;
        const title = values.feedback_title_block.feedback_title.value;
        const details = values.feedback_body_block.feedback_body.value;
        const rating = values.feedback_rating_block.feedback_rating.selected_option.text.text;
        const userId = body.user.id;
        const channel = view.private_metadata; // channel saved at modal open time

        // Post a formatted summary of the feedback to the originating channel
        await client.chat.postMessage({
            channel,
            blocks: [
                {
                    type: "header",
                    text: { type: "plain_text", text: "📝  New Feedback Received", emoji: true },
                },
                {
                    type: "section",
                    fields: [
                        { type: "mrkdwn", text: `*Category:*\n${category}` },
                        { type: "mrkdwn", text: `*Rating:*\n${rating}` },
                        { type: "mrkdwn", text: `*From:*\n<@${userId}>` },
                        { type: "mrkdwn", text: `*Title:*\n${title}` },
                    ],
                },
                {
                    type: "section",
                    text: { type: "mrkdwn", text: `*Details:*\n${details}` },
                },
                divider(),
                contextBlock("Submitted via /mridu-feedback · Mridu Bot"),
            ],
        });
    } catch (err) {
        console.error("[feedback_submit view handler]", err.message);
    }
});


app.command("/mridu-tldr", async ({ command, ack, client, respond }) => {
    await ack();

    try {
        // Fetch the 20 most recent messages from the current channel
        const result = await client.conversations.history({
            channel: command.channel_id,
            limit: 20,
        });

        const messages = result.messages;

        if (!messages || messages.length === 0) {
            await respond({ text: ":information_source:  No messages found in this channel to summarise." });
            return;
        }

        // Filter out bot messages and sub-type system events for cleaner output
        const humanMessages = messages
            .filter((m) => !m.subtype && !m.bot_id && m.text?.trim())
            .reverse(); // chronological order (Slack returns newest first)

        if (humanMessages.length === 0) {
            await respond({ text: ":information_source:  No human messages found to summarise." });
            return;
        }

        // ── STRUCTURED RECAP ─────────────────────────────────────────────────
        // Each line is: "• <@userId>: message text (truncated to 120 chars)"
        // Replace this block with an AI completion call for a prose summary.
        const bulletPoints = humanMessages
            .slice(-10) // last 10 for brevity
            .map((m) => {
                const author = m.user ? `<@${m.user}>` : "_Unknown_";
                const snippet = m.text.length > 120 ? m.text.slice(0, 117) + "…" : m.text;
                return `• ${author}: ${snippet}`;
            })
            .join("\n");

        await respond({
            blocks: [
                {
                    type: "header",
                    text: { type: "plain_text", text: "📖  Channel TL;DR", emoji: true },
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `Here's a recap of the last *${humanMessages.length}* messages in this channel:`,
                    },
                },
                divider(),
                {
                    type: "section",
                    text: { type: "mrkdwn", text: bulletPoints },
                },
                divider(),
                contextBlock(`Requested by <@${command.user_id}> · Showing up to 10 recent messages`),
            ],
        });
    } catch (err) {
        console.error("[/mridu-tldr]", err.message);
        await respond({ text: ":warning:  Could not fetch channel history. Make sure Mridu has the `channels:history` scope." });
    }
});


app.command("/mridu-carbon", async ({ command, ack, respond }) => {
    await ack();

    const rawText = command.text?.trim();

    if (!rawText) {
        await respond({
            response_type: "ephemeral",
            text: ":information_source:  *Usage:* `/mridu-carbon lang=python\\nprint('Hello, Hack Club!')` — Paste your code after the optional `lang=` line.",
        });
        return;
    }

    // ── Parse optional language tag on the first line ─────────────────────
    const lines = rawText.split("\n");
    let language = "code"; // default label
    let codeBody = rawText;

    if (lines[0].toLowerCase().startsWith("lang=")) {
        language = lines[0].split("=")[1]?.trim() || "code";
        codeBody = lines.slice(1).join("\n").trim();
    }

    if (!codeBody) {
        await respond({ response_type: "ephemeral", text: ":warning:  No code body found after the `lang=` declaration." });
        return;
    }

    // Capitalise language label for display (e.g. "python" → "Python")
    const langLabel = language.charAt(0).toUpperCase() + language.slice(1);

    // Line count for the footer metadata
    const lineCount = codeBody.split("\n").length;

    await respond({
        blocks: [
            {
                type: "header",
                text: { type: "plain_text", text: `💻  Code Snapshot — ${langLabel}`, emoji: true },
            },
            divider(),
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    // Wrap in triple-backtick code fence with the language tag for syntax hints
                    text: `\`\`\`${language.toLowerCase()}\n${codeBody}\n\`\`\``,
                },
            },
            divider(),
            contextBlock(
                `:hash:  Language: *${langLabel}*  ·  Lines: *${lineCount}*  ·  Shared by <@${command.user_id}>`
            ),
        ],
    });
});


const DEBUGGING_TIPS = [
    "*Rubber Duck Debug* 🦆 — Explain your code line-by-line out loud (or in a thread here). The act of articulating often reveals the bug.",
    "*Console/Log Everything* 📋 — Add `console.log` / `print` / `Serial.println` at each step. Narrow down exactly where things diverge from expected.",
    "*Check the Stack Trace* 🔍 — The error message almost always contains the file name and line number. Start there, not at the top of your file.",
    "*Minimal Reproduction* ✂️ — Reduce your code to the smallest version that still shows the bug. Half the time the bug disappears — and that tells you something.",
    "*Take a Break* ☕ — A fresh pair of eyes (even your own after 10 minutes) spots things you've been staring past.",
];

// Match any of these keywords (case-insensitive, word-boundary aware)
const HELP_REGEX = /\b(stuck|error|bug|broken|not working|crash|help)\b/i;

app.message(HELP_REGEX, async ({ message, say }) => {
    // Don't respond to bots or system messages
    if (message.subtype || message.bot_id) return;

    // Pick a random tip from the list
    const tip = DEBUGGING_TIPS[Math.floor(Math.random() * DEBUGGING_TIPS.length)];

    try {
        await say({
            // Reply in a thread so it doesn't clutter the channel
            thread_ts: message.ts,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `:wave:  Hey <@${message.user}>! Sounds like you might be debugging something. Here's a tip:\n\n${tip}`,
                    },
                },
                divider(),
                contextBlock("Use `/mridu-help` to see all available commands · Mridu Community Bot"),
            ],
        });
    } catch (err) {
        console.error("[keyword trigger]", err.message);
    }
});


app.event("member_joined_channel", async ({ event, client }) => {
    try {
        // Don't greet bots joining channels
        if (event.user === "USLACKBOT") return;

        await client.chat.postMessage({
            channel: event.channel,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "👋  Welcome to the Channel!",
                        emoji: true,
                    },
                },
                divider(),
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `Hey <@${event.user}>! We're thrilled to have you here. 🎉\n\nHere's everything you need to hit the ground running:`,
                    },
                    // Replace with a real team photo or logo URL as needed
                    accessory: {
                        type: "image",
                        image_url: "https://assets.hackclub.com/flag-orpheus-top.svg",
                        alt_text: "Hack Club flag",
                    },
                },
                divider(),
                {
                    type: "section",
                    fields: [
                        { type: "mrkdwn", text: ":scroll:  *Channel Rules*\nBe kind, be curious, and share what you're building." },
                        { type: "mrkdwn", text: ":bulb:  *Getting Started*\nIntroduce yourself and tell us what you're working on!" },
                        { type: "mrkdwn", text: ":link:  *Resources*\nCheck the channel description for pinned links." },
                        { type: "mrkdwn", text: ":robot_face:  *Mridu Bot*\nType `/mridu-help` to see all available bot commands." },
                    ],
                },
                divider(),
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: { type: "plain_text", text: "🤖  Open Command Menu", emoji: true },
                            action_id: "welcome_open_help",
                            style: "primary",
                        },
                        {
                            type: "button",
                            text: { type: "plain_text", text: "🔗  Hack Club Website", emoji: true },
                            action_id: "welcome_hackclub_link",
                            url: "https://hackclub.com",
                        },
                    ],
                },
                contextBlock("This welcome card was sent automatically by Mridu · Hack Club Bot"),
            ],
        });
    } catch (err) {
        console.error("[member_joined_channel]", err.message);
    }
});

// Handle the "Open Command Menu" button on the welcome card
app.action("welcome_open_help", async ({ body, ack, client }) => {
    await ack();
    try {
        // Post an ephemeral help reminder directly to the new member
        await client.chat.postEphemeral({
            channel: body.channel.id,
            user: body.user.id,
            text: ":point_right:  Type `/mridu-help` in this channel to see all available commands!",
        });
    } catch (err) {
        console.error("[welcome_open_help]", err.message);
    }
});


app.action("welcome_hackclub_link", async ({ ack }) => { await ack(); });

(async () => {
    try {
        await app.start();
        console.log("✅  Mridu is online and ready! Socket Mode connected.");
        console.log("   Available slash commands:");
        console.log("   /mridu-ping · /mridu-help · /mridu-catfact · /mridu-joke");
        console.log("   /mridu-poll · /mridu-pomodoro · /mridu-feedback");
        console.log("   /mridu-tldr · /mridu-carbon");
    } catch (err) {
        console.error("❌  Failed to start Mridu:", err);
        process.exit(1);
    }
})();