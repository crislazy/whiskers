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
const PERSONAL_CHANNEL_IDS = env("PERSONAL_CHANNEL_IDS").split(",").map(id => id.trim());
const PERMITTED_USER_IDS = (process.env.PERMITTED_USER_IDS ?? USER_ID).split(",").map(id => id.trim());
const LASTFM_USERNAME = env("LASTFM_USERNAME");
const LASTFM_TOKEN = env("LASTFM_TOKEN");
const HACKATIME_USER_ID = process.env.HACKATIME_USER_ID ?? USER_ID;
const SLACK_TOKEN = env("SLACK_TOKEN");
const SLACK_APP_TOKEN = env("SLACK_APP_TOKEN");
const SLACK_USER_TOKEN = env("SLACK_USER_TOKEN");

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
  }
];

// Functions
function isAllowed(id: string):boolean {
    if (!PERMITTED_USER_IDS?.includes(id) && id !== USER_ID){
        return false;
    } else {
        return true;
    }
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

// LastFM Listening Status
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
        if (nowPlaying) {
            const status = `${track.name} - ${track.artist["#text"]}`
            if (status !== lastStatus) {
                await client.users.profile.set ({
                    profile: {
                        status_text: status,
                        status_emoji: ":headphones:"
                    }
                })
                lastStatus = status
                console.log("LastFM Status: "+status)
            } else return;
        } else {
            const status = ``
            if (status !== lastStatus) {
                await client.users.profile.set ({
                    profile: {
                        status_text: status,
                        status_emoji: "",
                        status_expiration: 0
                    }
                })
                lastStatus = status
                console.log("LastFM Status: "+status)
            } else return;
        }
    } catch (err) {
        console.error("LastFM:", err);
    }
} 

// Hackatime Coding Time Stats
let lastStatusCode = ""
async function hackatimeStats(){
    try {
        const today = new Date().toISOString().split("T")[0];

        const res = await fetch(
        `https://hackatime.hackclub.com/api/v1/users/${HACKATIME_USER_ID}/stats?start_date=${today}`
        );
        if (!res.ok) {
            console.error(`Hackatime returned ${res.status}`);
            return;
        }
        const data = await res.json() as any;
        const totalSeconds = data.data.total_seconds;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        let status = `Coded ${hours}h ${minutes}m today`;
        if (hours < 1) {
            status = `Coded ${minutes}m today`;
        } else {
            status = `Coded ${hours}h ${minutes}m today`;
        }

        if (status !== lastStatusCode) {
            await client.users.profile.set({
                profile: {
                    pronouns: status,
                },
            });

            lastStatusCode = status;
            console.log("Hackatime status: "+status);
        }
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
- Set status automatically based on LastFM status;
- Change the pronouns to the total time coded today;
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
  }
});

// Autorespond to messages in channels the bot is (with mentions)
app.message(async ({ message }) => {
    const requiresMention = !PERSONAL_CHANNEL_IDS.includes(message.channel);
    if (!requiresMention) return;
    if (!await statusFeature("autorespond"))return;
    if (message.subtype) return;
    if ("bot_id" in message && message.bot_id) return;
    const text = message.text?.toLowerCase() ?? "";

    if (!text.includes(`<@${USER_ID}>`) && !text.includes("whiskers")) {
        return;
    }

    for (const response of RESPONSES) {
        if (response.trigger.some(trigger => text.includes(trigger))) {
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
});

// Autorespond to messages in personal channel
app.message(async ({ message }) => {
    if (!await statusFeature("autorespond"))return;
    if (message.subtype) return;
    if ("bot_id" in message && message.bot_id) return;
    const text = message.text?.toLowerCase() ?? "";

    for (const response of RESPONSES) {
        if (response.trigger.some(trigger => text.includes(trigger))) {
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
});

// Welcome message
app.event("member_joined_channel", async ({ event }) => {
    try{
        const welcomeMessageEnabled = await statusFeature("welcome_message");
        const welcomeDmEnabled = await statusFeature("welcome_dm");
        const channel = event.channel
        const user = event.user
        if (!PERSONAL_CHANNEL_IDS.includes(channel)) return;

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

Welcome! I'm *Whiskers*, your friendly selfbot. :cat-heart:

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

if (await statusFeature("hackatime")) {
    await hackatimeStats();
}

setInterval(async () => {
    if (await statusFeature("hackatime")) {
        await hackatimeStats();
    }
}, 60_000);