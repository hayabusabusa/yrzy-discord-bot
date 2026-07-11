import { exec } from "child_process";

export interface GcpInstance {
  name: string
  zone: string
  status: string
}

interface GcloudInstanceListItem {
  name?: unknown
  zone?: unknown
  status?: unknown
}

/**
 * 非同期でコマンドを実行する.
 * @param command 実行したいコマンド.
 */
export const execPromise = async (command: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error != null) {
        reject(error)
        return
      }

      resolve(stdout)
    })
  })
}

const extractZoneName = (zone: string) => {
  return zone.split("/").pop() ?? zone
}

/**
 * GCP のインスタンス一覧を取得する.
 * @returns GCP インスタンス一覧.
 */
export const listGcpInstances = async (): Promise<GcpInstance[]> => {
  const stdout = await execPromise(`gcloud --account ${process.env.GCP_SERVICE_ACCOUNT_ID} compute instances list --format=json`)
  const parsed = JSON.parse(stdout) as unknown

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.flatMap((value: GcloudInstanceListItem) => {
    if (typeof value.name !== "string" || typeof value.zone !== "string" || typeof value.status !== "string") {
      return []
    }

    return [
      {
        name: value.name,
        zone: extractZoneName(value.zone),
        status: value.status
      }
    ]
  })
}

/**
 * GCP のインスタンス一覧から指定したインスタンス情報を返す.
 * @param instances GCP インスタンス一覧.
 * @param name インスタンス名.
 * @returns GCP インスタンス情報.
 */
export const findGcpInstance = (instances: GcpInstance[], name: string) => {
  return instances.find((instance) => instance.name === name)
}
