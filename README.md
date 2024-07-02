
# cc-bot

An easy to use custom card database search and upload bot, inspired by [Dysis](https://github.com/Qxe5/dysis) and [EXU](https://github.com/LimitlessSocks/EXU-Database)



## Run Locally

Make a Discord bot at the [Discord Developer Portal](https://discord.com/developers/) and copy the bot token and client ID

Make a new atlas database [here](https://cloud.mongodb.com/v2/) and go to connect -> copy connection string and copy the URI.

Clone the project

```bash
  git clone https://github.com/0kihS/cc-bot
```

Go to the project directory

```bash
  cd cc-bot
```
Open the .env file and fill it in with the required information

Install dependencies

```bash
  npm install
```

Start the bot

```bash
  node ./index.js
```


## Usage

To upload cards, Go to a DuelingBook deck link with the cards you want to upload and save the page (with ctrl + S)

In Discord use the `/upload` command and attach the downloaded HTML file. 
After uploading, restart the bot by using /restart to make sure all recent cards are shown.

NOTE: only users with moderator priviledges can upload cards or restart the bot.

To search cards, simply use `/search-custom`, and while searching autocomplete should be active.

If emojis don't show up, edit the icons.js file to link to emojis that are present in your server.