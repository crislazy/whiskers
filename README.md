<h1 align="center">🐾 Whiskers</h1>
<p align="center">Your cool little selfbot :3</p>

<p align="center">
Whiskers is a Slack selfbot written in TypeScript using Bun and Slack Bolt.<br>
It can automatically update your Slack status, display Hackatime coding stats, autorespond to DMs, and more.
</p>

<p align="center">
  <img src="https://hackatime.hackclub.com/api/v1/badge/U09TNMQ9MCZ/slackselfbot" alt="Hackatime">
  <img src="https://img.shields.io/github/license/crislazy/whiskers" alt="License">
  <a href="https://slack.dev/bolt-js/">
    <img src="https://img.shields.io/badge/Slack-Bolt-4A154B?logo=slack" alt="Slack Bolt">
  </a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Bun-1.3+-fbf0df" alt="Bun">
  <a href="https://sqlite.org/">
    <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite" alt="SQLite">
  </a>
</p>

---

[Features](#features) | [Requirements](#requirements) | [Selfhosting](#selfhosting) | [Screenshots](#screenshots) | [Built with](#built-with) | [License](#license)

---

## Features

- LastFM "Now Playing" status
- Hackatime coding stats in pronouns
- Auto replies in DMs
- Responds when mentioned
- Welcome messages and welcome DMs
- Feature toggles with slash commands
- SQLite database for configuration

## Requirements

- Bun 1.3+
- A Slack App
- A Slack User Token
- SQLite (included with the sqlite3 package)
- LastFM API key (optional)

> Note: Whiskers is a Slack selfbot that runs on a user account rather than a bot account. Make sure you understand your workspace's policies before using it.

---

## Selfhosting

## 1. Clone the repository
``` bash
git clone https://github.com/crislazy/whiskers.git
cd whiskers
```

## 2. Install dependencies
```bash
bun install
```

## 3. Create a Slack App

Go to https://api.slack.com/apps and create a new app.

Enable:

Socket Mode
Event Subscriptions
Slash Commands

### Required OAuth Permissions:
Bot Scopes:
- commands

User Scopes:
- channels:history
- channels:read
- chat:write
- groups:history
- groups:read
- im:history
- mpim:history
- mpim:read
- reactions:write
- users.profile:write
- im:write

### Event Subscriptions:
Subscribe to events on behalf of users:
- member_joined_channel
- message.channels
- message.groups
- message.im
- message.mpim

## 4. Install the app

Install the app to your workspace.

Copy the following tokens:

- Slack Bot Token
- Slack App Token
- Slack User Token

## 5. Configure environment variables

Copy the example file:

``` bash
cp .env.example .env
```

Open .env and fill in every value.

## 6. Set up LastFM (Optional)

1. Create a LastFM account.
2. Go to https://www.last.fm/api/account/create.
3. Create an API application.
4. Copy your API Key.
5. Fill in these values in `.env`:

```env
LASTFM_USERNAME=your_username
LASTFM_TOKEN=your_api_key
```


## 7. Set up Hackatime (Optional)

If you want Whiskers to display your coding time in your Slack profile:

1. Find your Hackatime user ID.
2. Set it in `.env`:

```env
HACKATIME_USER_ID=U01234567
```

If left empty, Whiskers will use the value from `USER_ID`.


## 8. Run Whiskers

```bash
bun run index.ts
```

You should see something similar to:

```text
  _  _     _ _       _   _                  _   ___      ___   _ 
 | || |___| | |___  | |_| |_  ___ _ _ ___  | | | \ \    / / | | |
 | __ / -_) | / _ \ |  _| ' \/ -_) '_/ -_) | |_| |\ \/\/ /| |_| |
 |_||_\___|_|_\___/  \__|_||_\___|_| \___|  \___/  \_/\_/  \___/ 

                            ╱|、
                          (˚ˎ 。7
                          |、˜〵        
                          じしˍ,)ノ
                          
                        
Command prefix: 4827
------------------------------
lastfm: enabled
hackatime: enabled
autodms: enabled
autorespond: enabled
welcome_message: enabled
welcome_dm: enabled
------------------------------
Whiskers is online! :3 
```

On first launch, Whiskers generates a random 4-digit command prefix (stored in SQLite).

## 9. Slash Commands

1. Create a new slash command:

### Feature command
- **Command:** /prefix-feature
- **Description:** Enable/disable a feature
- **Usage Hint:** &lt;enable|disable&gt; &lt;feature&gt;

### Features command
- **Command:** /prefix-features
- **Description:** See all features and their status

Don't forget to replace `prefix` with the 4-digit command prefix generated on launch.

2. Using the commands:
Only the users listed in **USER_ID** and **PERMITTED_USER_IDS** can use these commands.

## Available Features

| Feature | Description |
|---------|-------------|
| lastfm | Updates your Slack status with your current LastFM track |
| hackatime | Displays today's coding time in your profile pronouns |
| autodms | Replies to supported messages in DMs |
| autorespond | Replies when Whiskers is mentioned |
| welcome_message | Sends a welcome message in configured channels |
| welcome_dm | Sends a welcome DM to new members |

> Note: On the first run, all the features are enabled.

## Screenshots

PLACEHOLDER

## Built With

- Bun
- TypeScript
- Slack Bolt
- Slack Web API
- SQLite


## License

MIT