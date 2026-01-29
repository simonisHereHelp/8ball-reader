// @/lib/gptRouter.ts
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export class GPT_Router {
  /**
   * 通用 Fetch 工具：根據 ID 獲取檔案並解析為 JSON
   */
  static async _fetchFile(fileID: string, useAuth: boolean = false): Promise<any> {
    if (!fileID) throw new Error("File ID is required");

    const resolvedPath = this._resolveLocalPath(fileID);

    if (resolvedPath) {
      const fileContent = await fs.readFile(resolvedPath, "utf-8");
      return JSON.parse(fileContent);
    }

    let url = `https://drive.google.com/uc?export=download&id=${fileID}`;
    const headers: HeadersInit = {};

    if (useAuth) {
      const session = await auth();
      const accessToken = (session as any)?.accessToken;
      if (!accessToken) throw new Error("Missing Google Drive access token");

      // 使用 API 格式讀取私有媒體內容
      url = `https://www.googleapis.com/drive/v3/files/${fileID}?alt=media&supportsAllDrives=true`;
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Fetch file ${fileID} failed (Status: ${res.status})`);

    return res.json();
  }

  /**
   * Fetch arbitrary JSON sources using the same ID/path resolution.
   */
  static async fetchJsonSource(source: string, useAuth: boolean = false): Promise<any> {
    return this._fetchFile(source, useAuth);
  }

  /**
   * 獲取 System Prompt
   */
  static async getSystemPrompt(promptFileID: string): Promise<string> {
    const config = await this._fetchFile(promptFileID);
    return config.system;
  }

    static async getUserPrompt(promptFileID: string): Promise<string> {
    const config = await this._fetchFile(promptFileID);
    return config.user;
  }

  /**
   * Use GPT to extract the "Issuer Name" (the canonical master name) from a summary.
   */
  static async getIssuerName(summary: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "你是一位精確的實體提取助手。請從提供的摘要中僅提取『寄件單位』或『機構名稱』。只需回傳名稱，不要有標點符號或解釋。如果找不到，請回傳『其他單位』。",
          },
          { role: "user", content: summary },
        ],
        temperature: 0,
      }),
    });

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || "其他單位";
  }

  static async updateCanonicals(
    fileID: string,
    {
      issuerName,
      issuerAlias,
    }: {
      issuerName: string;
      issuerAlias: string;
    }
  ) {
    const localPath = this._resolveLocalPath(fileID);
    if (localPath) {
      throw new Error(
        "Updating local canonical files is not supported. Provide a Drive file ID via environment variable."
      );
    }

    const bibleData = await this._fetchFile(fileID, true);

    const masterEntry = bibleData.issuers.find((i: any) => i.master === issuerName);

    if (masterEntry) {
      // Master exists, check if alias is new
      if (issuerAlias !== issuerName && !masterEntry.aliases.includes(issuerAlias)) {
        masterEntry.aliases.push(issuerAlias);
      } else {
        return { status: "NO_CHANGE", message: "Alias already exists or matches master." };
      }
    } else {
      // New Master
      bibleData.issuers.push({
        master: issuerName,
        aliases: issuerAlias !== issuerName ? [issuerAlias] : [],
      });
    }

    // Save back to Drive
    const session = await auth();
    const accessToken = (session as any)?.accessToken;
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileID}?uploadType=media&supportsAllDrives=true`;

    const writeRes = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bibleData, null, 2),
    });

    if (!writeRes.ok) throw new Error("Failed to update Bible file on Drive");
    return { status: "UPDATED", issuerName, issuerAlias };
  }

  private static _resolveLocalPath(source: string) {
    const looksLikeDriveId = /^[a-zA-Z0-9_-]{10,}$/.test(source) && !source.includes("/");
    if (looksLikeDriveId || source.startsWith("http")) return null;

    return path.isAbsolute(source) ? source : path.join(process.cwd(), source);
  }
}
