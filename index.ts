import { App } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import {
    getConfig,
    setConfig,
    statusFeature,
    saveFeature,
    getFeature,
} from "./db";

// Env variables
function env(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing env: ${name}`);
    }

    return value;
}

const USER_ID = env("USER_ID");
const PERSONAL_CHANNEL_ID = env("PERSONAL_CHANNEL_ID")
const PERMITTED_USER_IDS = (process.env.PERMITTED_USER_IDS ?? USER_ID).split(",").map(id => id.trim());
const LASTFM_USERNAME = env("LASTFM_USERNAME");
const LASTFM_TOKEN = env("LASTFM_TOKEN");
const OWNER_ID = process.env.OWNER_ID ?? USER_ID;
const SLACK_TOKEN = env("SLACK_TOKEN");
const SLACK_APP_TOKEN = env("SLACK_APP_TOKEN");
const SLACK_USER_TOKEN = env("SLACK_USER_TOKEN")
const TIMEZONE = process.env.TIMEZONE ?? "America/New_York"

// Variables
const startTime = Date.now();
const FEATURES = [
    "lastfm",
    "hackatime",
    "autodms",
    "autorespond",
    "welcome_message",
    "welcome_dm"
]
const RESPONSES = [
  {
    trigger: ["good bot", "best bot"],
    reply: "awww thank you :cat-heart:",
    reaction: "heart"
  },
  {
    trigger: ["ping"],
    reply: "pong!",
  },
  {
    trigger: ["nya"],
    reply: "nya~ :3"
  },
  {
    trigger: ["femboy"],
    reply: "UWU :cat-heart:",
    reaction: "uwu"
  },
  {
    trigger: ["cookie"],
    reply: "cookies are always appreciated 🍪"
  },
  {
    trigger: ["bad bot"],
    reply: "i'll do better next time... :(",
    reaction: "cry"
  },
  {
    trigger: ["hii", "hi", "hello"],
    reply: "Hello :doppel-hi: !",
    reaction: "hii"
  }
];

// Functions
function isAllowed(id: string):boolean {
    if (!PERMITTED_USER_IDS?.includes(id) && id !== USER_ID && id !== OWNER_ID){
        return false;
    } else {
        return true;
    }
}

function getToday() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

const app = new App({
  token: SLACK_TOKEN,
  appToken: SLACK_APP_TOKEN,
  socketMode: true,
});

const client = new WebClient(SLACK_USER_TOKEN);

// Prefix
let prefix = await getConfig("command_prefix");
if (!prefix) {
    prefix = Math.floor(1000 + Math.random() * 9000).toString();
    await setConfig("command_prefix", prefix);
}
console.log(String.raw`
  _  _     _ _       _   _                  _   ___      ___   _ 
 | || |___| | |___  | |_| |_  ___ _ _ ___  | | | \ \    / / | | |
 | __ / -_) | / _ \ |  _| ' \/ -_) '_/ -_) | |_| |\ \/\/ /| |_| |
 |_||_\___|_|_\___/  \__|_||_\___|_| \___|  \___/  \_/\_/  \___/ `)
console.log(`
                            ╱|、
                          (˚ˎ 。7
                          |、˜〵        
                          じしˍ,)ノ
                          
                          `)

console.log(`Command prefix: ${prefix}`);
console.log("------------------------------")
for (const feature of FEATURES){
    console.log(`${feature}: ${await statusFeature(feature) ? "enabled" : "disabled"}`)
}
console.log("------------------------------")

// LastFM Listening Message
let lastStatus = "";
async function currentlyListening(){
    try {
        const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_TOKEN}&format=json&limit=1`
        );
        if (!res.ok) {
            console.error(`LastFM returned ${res.status}`);
            return;
        }
        const data = await res.json() as any;
        if (!data.recenttracks?.track?.length) {
          console.error(`LastFM: There was an error.`)  
          return;
        }
        const track = data.recenttracks.track[0];

        const nowPlaying = track["@attr"]?.nowplaying === "true";
        if (!nowPlaying) {
            lastStatus = "";
            return;
        }
        if (nowPlaying) {
                const status = `${track.name} - ${track.artist["#text"]}`
                if (status !== lastStatus) {
                    lastStatus = status;
                    await client.chat.postMessage({
                        channel: PERSONAL_CHANNEL_ID,
                        text: `🎵 <@${OWNER_ID}> is now listening to *${track.name}* by *${track.artist["#text"]}*`
                    });
                }
            } 
    } catch (err) {
        console.error("LastFM:", err);
    await client.chat.postMessage({
        channel: PERSONAL_CHANNEL_ID,
        text: "There was an error, check the terminal",
    });
    }
}

// Hackatime Recap
async function hackatimeStats(text: string, sender_id:string){
    try {
        const mentions = [...text.matchAll(/<@([A-Z0-9]+)>/g)] as any;

        let target_id = sender_id as any;

        if (mentions.length >= 2) {
            target_id = mentions[1][1];
        }

        const today = getToday()
        
        const res = await fetch(
        `https://hackatime.hackclub.com/api/v1/users/${target_id}/stats?start_date=${today}`
        );
        if (res.status === 404) {
            return `<@${target_id}> doesn't have a Hackatime account linked.`;
        }

        if (res.status === 403) {
            return `<@${target_id}> has disabled public stats`;
        }

        if (!res.ok) {
            console.error(`Hackatime returned ${res.status}`);
            return `Hackatime returned an unexpected error (${res.status}).`;
        }
        const data = await res.json() as any;
        const totalSeconds = data.data.total_seconds;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        let status = `Coded ${hours}h ${minutes}m today`;
        if (hours < 1) {
            status = `Coded ${minutes}m today :sadge:`;
        } else {
            status = `Coded ${hours}h ${minutes}m today :yay:`;
        }
        const top = data.data.languages?.[0];
        let topLanguage;

        if (top) {
            topLanguage = `*${top.name}* (${top.text})`;
        } else {
            topLanguage = "None";
        }
        const message = `<@${target_id}>'s daily coding recap:

${status}
Top language: ${topLanguage}
🔥 Current streak: ${data.data.streak} days`
        return message;
    } catch (err) {
        console.error("Hackatime:", err);
    }
}

// Autorespond to DMs
app.message(async ({ message }) => {
  if (!await statusFeature("autodms"))return;
  try {
    if (message.subtype) return;
    if ("bot_id" in message && message.bot_id) return;
    if (!message.channel.startsWith("D")) return;

    const text = message.text?.toLowerCase() ?? "";

    if (text.includes("hello")) {
        await client.chat.postMessage({
            channel: message.channel,
            text: `Hello there :hii: ! I'm Whiskers, your cool little selfbot :cat-heart:`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `I can do some cool stuff like:
- Send a welcome message in personal channels when people join and also DM those people;
- Send an announcement for LastFM "Now Playing";
- Show Hackatime coding recaps;
- Auto respond to messages and DMs;

I'm also totally not a femboy...`
                }
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: "Type 'curious' for additional information on the bot"
                  }
                ]
              }
            ]

        });
    } else if (text.includes("curious")) {
        const uptime = Date.now() - startTime;
        const seconds = Math.floor(uptime / 1000) % 60;
        const minutes = Math.floor(uptime / 60000) % 60;
        const hours = Math.floor(uptime / 3600000);
        await client.chat.postMessage({
            channel: message.channel,
            text: `Here' some additional information about me:`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `Here's some additional information about me:
I was created by <@U09TNMQ9MCZ> :happy:
My code's runtime is: ${hours}h ${minutes}m ${seconds}s`
                }
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: "Yes, I'm a femboy :3"
                  }
                ]
              }
            ]

        });
    }
  } catch (err) {
    console.error("AutoDM: ", err)
    await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text: "There was an error, check the terminal",
    });
  }
});

// Autorespond to messages in channels the bot is (with mentions)
app.message(async ({ message }) => {
    try {
        if (!await statusFeature("autorespond"))return;
        if (message.subtype) return;
        if ("bot_id" in message && message.bot_id) return;
        const text = (message.text ?? "").toLowerCase();
        if (text.includes(`<@${USER_ID}> hackatime`.toLowerCase())) {
            const info = await client.conversations.info({
                channel: message.channel,
            });
            if (!info.channel?.is_member) return;
            const recap = await hackatimeStats(message.text ?? "", message.user);

            if (recap) {
                await client.chat.postMessage({
                    channel: message.channel,
                    thread_ts: message.thread_ts ?? message.ts,
                    text: recap,
                });
            }

            return;
        } else if (text.includes(`<@${USER_ID}> help`.toLowerCase())) {
            const info = await client.conversations.info({
                channel: message.channel,
            });
            if (!info.channel?.is_member) return;
            const responseList = RESPONSES.map(r =>
                `• ${r.trigger.join(" / ")} → ${r.reply}`
            ).join("\n");
            await client.chat.postMessage({
                channel: message.channel,
                thread_ts: message.thread_ts ?? message.ts,
                text: `🐱 <@${USER_ID}> Help

    *Commands*
    • <@${USER_ID}> help
    Shows this help menu.

    • <@${USER_ID}> hackatime
    Shows your coding recap.

    • <@${USER_ID}> hackatime @user
    Shows another user's coding recap.
                    
    *Auto Responses*
    ${responseList}

    Made with hate and anger by <@${OWNER_ID}>`,
                });

            return;
        }
        for (const response of RESPONSES) {
            for (const trigger of response.trigger) {
                if (text.includes(`<@${USER_ID}> ${trigger}`.toLowerCase())) {
                    const info = await client.conversations.info({
                        channel: message.channel,
                    });
                    if (!info.channel?.is_member) return;
                    await client.chat.postMessage({
                        channel: message.channel,
                        thread_ts: message.thread_ts ?? message.ts,
                        text: response.reply,
                    });

                    if (response.reaction) {
                        await client.reactions.add({
                            channel: message.channel,
                            timestamp: message.ts,
                            name: response.reaction,
                        });
                    }

                    return;
                }
            }
        }
    } catch (err) {
        console.error("AutoDM"+ err)
        await client.chat.postMessage({
            channel: message.channel,
            thread_ts: message.ts,
            text: "There was an error, check the terminal",
        });
    }
});


// Welcome message
app.event("member_joined_channel", async ({ event }) => {
    try{
        const welcomeMessageEnabled = await statusFeature("welcome_message");
        const welcomeDmEnabled = await statusFeature("welcome_dm");
        const channel = event.channel
        const user = event.user
        if (PERSONAL_CHANNEL_ID !== channel) return;

        if (welcomeMessageEnabled) {

            await client.chat.postMessage({
                channel: channel,
                text: `:nyan: Welcome <@${user}>! :nyan:`
            });
        }
        if (welcomeDmEnabled) {
            const dm = await client.conversations.open({
                users: user,
            });

            if (!dm.channel?.id) return;

            await client.chat.postMessage({
                channel: dm.channel.id,
                text: `Hi <@${user}>! 👋

Welcome to #${PERSONAL_CHANNEL_ID} :cat-heart:!

Send me "hello" to see what I can do.`
            });
        }
    } catch (err) {
        console.error("Welcome user :", err)
    }
});

// Slash commands
app.command(`/${prefix}-feature`, async ({ command, ack, respond }) => {
  await ack();
  try {
    if (!(isAllowed(command.user_id))) {
        await respond("You are not permitted to use this command.");
        return;
    }

    const args = command.text.trim().toLowerCase().split(/\s+/);
    const action = args[0] // "enable" or "disable"
    const feature = args[1]// feature_name

    if (!action || !feature) {
        await respond(
            "Usage: /" + prefix + "-feature <enable|disable> <feature>"
        );
        return;
    }
    if (action !== "enable" && action !== "disable") {
        await respond(
            "Action not found :sadge:\nUsage: /" + prefix + "-feature <enable|disable> <feature>"
        );
        return;
    }
    if (!FEATURES.includes(feature)) {
        await respond(`Unknown feature: ${feature}
Run /${prefix}-features to see all features and their status`);
        return;
    }
    
    if (action === "enable"){
      await saveFeature(feature, "enabled");
      await respond(`✅ Enabled ${feature}`);
    } else if (action === "disable"){
      await saveFeature(feature, "disabled");
      await respond(`❌ Disabled ${feature}`);
    }
  } catch (err) {
    console.error(`/${prefix}-feature :`, err)
  }
})

app.command(`/${prefix}-features`, async ({ command, ack, respond }) => {
    await ack()
    try{
        if (!(isAllowed(command.user_id))) {
            await respond("You are not permitted to use this command.");
            return;
        }
        let text = "*Current Features*\n\n";

        for(const feature of FEATURES) {
            const enabled = await statusFeature(feature);
            text += `${enabled ? "✅" : "❌"} ${feature}\n`;
        }

        await respond(text)
    } catch (err) {
        console.log(`/${prefix}-features :`, err)
    }
})

await app.start(); // Start bot
console.log("Whiskers is online! :3 \n");

// Runs features if enabled
if (await statusFeature("lastfm")) {
    await currentlyListening();
}

setInterval(async () => {
    if (await statusFeature("lastfm")) {
        await currentlyListening();
    }
}, 30_000);