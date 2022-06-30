import { Client } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

client.once("ready", () => {
  console.log("Ready");
});

client.on("message", (message) => {
  // BOT からのメッセージは無視する.
  if (message.author.bot) {
    return;
  }

  if (message.content === "テスト") {
    message.channel.send("こんにちは");
  }
});

client.login(process.env.TOKEN);