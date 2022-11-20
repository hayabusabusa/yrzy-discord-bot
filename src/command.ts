import { ApplicationCommandData, CommandInteraction, CacheType } from "discord.js";
import { execPromise, isRunning } from "./util";

/**
 * Discord で実行できるコマンドのインターフェース.
 */
export interface Command {
  /**
   * Discord BOT のクライアントに登録する形に変換したものを返す.
   */
  resolved(): ApplicationCommandData

  /**
   * コマンドの処理を実行する.
   * 
   * @param interaction 実行されたコマンドの情報.
   */
  execute(interaction: CommandInteraction<CacheType>): Promise<void>
}

/**
 * `/server` コマンドの定義.
 * 
 * 任意のゲームサーバーの起動、停止を行う.
 * 
 * 例) `/server start terraria`
 */
export class ServerCommand implements Command {
  resolved(): ApplicationCommandData {
    return{
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
                },
                {
                  name: "ARK",
                  value: "ark"
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
                },
                {
                  name: "ARK",
                  value: "ark"
                }
              ]
            }
          ]
        },
      ]
    };
  }

  async execute(interaction: CommandInteraction<CacheType>): Promise<void> {
    // コマンドのオプションからゲームのタイトルを取り出し
    const game = interaction.options.getString("game");

    // ゲームのタイトルが指定されていない場合はメッセージを返して終了する.
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
        await this.executeStartCommand(interaction, game);
        break;
      case "stop":
        await this.executeStopCommand(interaction, game);
        break;
      default:
        await interaction.editReply("コマンドに間違いがあるかも💦");
        break;
    }

    // 追加でメッセージを送る必要があれば送る( 補足情報など ).
    await this.messageIfNeeded(interaction, game);
  }

  /**
   * サーバーの開始コマンドを実行する.
   * @param interaction 実行されたコマンドの情報.
   * @param game 実行するゲームのタイトル.
   */
  private async executeStartCommand(interaction: CommandInteraction, game: string) {
    // すでにサーバーが起動されている場合はメッセージを返して終了する.
    const isServerRunning = await isRunning(game);
    if (isServerRunning) {
      await interaction.editReply("すでにサーバーは起動されているっぽいよ？？");
      return;
    }

    // サーバーの起動コマンドを実行.
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
  }

  /**
   * サーバーの停止コマンドを実行する.
   * @param interaction 実行されたコマンドの情報.
   * @param game 停止するゲームのタイトル.
   */
  private async executeStopCommand(interaction: CommandInteraction, game: string) {
    // すでにサーバーが停止されている場合はメッセージを返して終了する.
    const isServerStopped = await isRunning(game);
    if (!isServerStopped) {
      await interaction.editReply("すでにサーバーは停止されているっぽいよ？？");
      return;
    }

    // サーバーの停止コマンドを実行する.
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
  }

  /**
   * 追加でメッセージを送信する.
   * @param interaction 実行されたコマンドの情報.
   * @param game 対象になっているゲームのタイトル.
   */
  private async messageIfNeeded(interaction: CommandInteraction<CacheType>, game: string) {
    // 開始時かつ ARK だけ手動でサーバーの停止を行う必要があるのでメッセージを残す.
    if (interaction.options.getSubcommand() === "start" && game === "ark") {
      await interaction.channel?.send({
        content: `${interaction.user} ARK は手動でサーバーを落として保存してあげてね！`,
        embeds: [
          {
            color: 0xffc107,
            title: "☝️ ARK サーバーの落としかた",
            description: "以下の手順でサーバーを落とさないと正常に保存が行われないから注意してね💦\n\n1. TAB キーを押してコンソールを開いてね。\n2. `enablecheats admin` をコンソールで実行してね。\n3. 最後に `admincheats doexit` を実行して完了！"
          }
        ]
      });
    }
  }
}