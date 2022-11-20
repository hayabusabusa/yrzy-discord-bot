import { exec } from "child_process";
import { Client } from "discord.js";
import dotenv from "dotenv";

import { Command, ServerCommand } from "./command";

dotenv.config();

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

const commands = new Map<string, Command>([
  ["server", new ServerCommand()],
]);

// BOT 起動時の動作
client.once("ready", async () => {
  // 登録するコマンドの準備
  const resolvedCommands = Array.from(commands.values())
    .map((element) => { return element.resolved() });
    
  // コマンドの登録
  await client.application?.commands.set(resolvedCommands, process.env.SERVER_ID ?? "");
});

// `/` コマンドが実行された時の動作
client.on("interactionCreate", async (interaction) => {
  // コマンド以外は無視する
  if (!interaction.isCommand()) return;

  // 定義ずみのコマンドかどうかを確認.
  const command = commands.get(interaction.commandName);
  if (command == null) {
    return;
  }

  await command.execute(interaction);
});

// メンション付きのメッセージが送信された時の動作
// client.on("messageCreate", async (message) => {
//   // BOT からのメッセージは無視する.
//   if (message.author.bot) return;

//   const isMentioned = message.mentions.has(client.user?.id ?? "");
  
//   if (isMentioned) {
//     await message.channel.send(`${message.author.toString()} メッセージを送信しましたー`);
//   }
// });

client.login(process.env.TOKEN);