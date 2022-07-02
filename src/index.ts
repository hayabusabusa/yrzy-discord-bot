import { exec } from "child_process";
import { Client } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

// BOT 起動時の動作
client.once("ready", async () => {
  console.log("Ready");

  // コマンドの登録
  await client.application?.commands.set([
    {
      name: "server",
      description: "Start or stop game server",
      options: [
        {
          type: "SUB_COMMAND",
          name: "start",
          description: "Start server",
          options: [
            {
              type: "STRING",
              name: "game",
              description: "Select game title",
              required: true,
              choices: [
                {
                  name: "Terraria",
                  value: "terraria"
                },
                {
                  name: "Minecraft",
                  value: "minecraft"
                }
              ]
            }
          ]
        },
        {
          type: "SUB_COMMAND",
          name: "stop",
          description: "Stop server",
          options: [
            {
              type: "STRING",
              name: "game",
              description: "Select game title",
              required: true,
              choices: [
                {
                  name: "Terraria",
                  value: "terraria"
                },
                {
                  name: "Minecraft",
                  value: "minecraft"
                }
              ]
            }
          ]
        },
      ]
    }
  ], process.env.SERVER_ID ?? "");
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

const execPromise = async (command: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error != null) reject(error);

      resolve(stdout);
    })
  })
}

const isRunning = async (game: string) => {
  const stdout = await execPromise("gcloud compute instances list");
  // インスタンスの状態をログから取り出し
  const splited = stdout.split(/\r\n|\n/)
  return splited.find((value) => value.includes(game))?.includes("RUNNING") ?? true;
}

// `/` コマンドが実行された時の動作
client.on("interactionCreate", async (interaction) => {
  // コマンド以外は無視する
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "server") {
    // コマンドのオプションからゲームのタイトルを取り出し
    const game = interaction.options.getString("game");

    if (game == null) {
      await interaction.reply({
        content: "ゲーム名を教えてねー",
      });
      return;
    }

    // インスタンスの立ち上げには時間がかかるので `defer` 指定にしておく
    await interaction.deferReply();

    switch (interaction.options.getSubcommand()) {
      case "start":
        const isServerRunningForStart = await isRunning(game);

        if (isServerRunningForStart) {
          await interaction.editReply("すでにサーバーは起動されているっぽいよ？？");
          return;
        }

        try {
          const _ = await execPromise(`gcloud --account ${process.env.GCP_SERVICE_ACCOUNT_ID} compute instances start ${game + process.env.GCP_SERVER_INSTANCE_NAME_SUFFIX} --zone ${process.env.GCP_SERVER_INSTANCE_ZONE}`);
        } catch (error) {
          await interaction.editReply({
            content: `サーバー起動時にエラーが発生したみたい...`,
            embeds: [
              {
                color: 0xf44336,
                description: `${error}`
              }
            ]
          });
          return;
        }
        
        await interaction.editReply(`${game} のサーバーを起動したよー`);

        break;
      case "stop":
        const isServerRunningForStop = await isRunning(game);

        if (!isServerRunningForStop) {
          await interaction.editReply("すでにサーバーは停止されているっぽいよ？？");
          return;
        }

        try {
          const _ = await execPromise(`gcloud --account ${process.env.GCP_SERVICE_ACCOUNT_ID} compute instances stop ${game + process.env.GCP_SERVER_INSTANCE_NAME_SUFFIX} --zone ${process.env.GCP_SERVER_INSTANCE_ZONE}`);
        } catch (error) {
          await interaction.editReply({
            content: `サーバー起動時にエラーが発生したみたい...`,
            embeds: [
              {
                color: 0xf44336,
                description: `${error}`
              }
            ]
          });
          return;
        }

        await interaction.editReply(`${game} のサーバーを停止したよー`);

        break;
      default:
        await interaction.editReply("コマンドに間違いがあるかも💦");

        break;
    }
  }
});

client.login(process.env.TOKEN);