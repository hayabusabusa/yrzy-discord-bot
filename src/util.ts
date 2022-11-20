import { exec } from "child_process";

/**
 * 非同期でコマンドを実行する.
 * @param command 実行したいコマンド.
 */
export const execPromise = async (command: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error != null) reject(error);

      resolve(stdout);
    })
  })
}

/**
 * GCP のインスタンスが起動しているかどうかを返す.
 * @param name インスタンス名(一部のみでも可能).
 * @returns インスタンスが起動していれば `True` を返す.
 */
export const isRunning = async (name: string) => {
  const stdout = await execPromise("gcloud compute instances list");
  // インスタンスの状態をログから取り出し
  const splited = stdout.split(/\r\n|\n/)
  return splited.find((value) => value.includes(name))?.includes("RUNNING") ?? true;
}