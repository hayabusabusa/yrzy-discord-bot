import { Client } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

client.once("ready", () => {
  console.log("Ready");
  console.log(client.user?.toString() ?? "null");
});

client.on("messageCreate", async (message) => {
  // BOT からのメッセージは無視する.
  if (message.author.bot) {
    return;
  }

  const isMentioned = message.mentions.has(client.user?.id ?? "");
  
  if (isMentioned) {
    await message.channel.send(`${message.author.toString()} メッセージを送信しましたー`);
  }
});

client.login(process.env.TOKEN);