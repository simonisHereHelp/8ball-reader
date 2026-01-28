import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { PROMPTS_MODE_READER_SOURCE } from "@/lib/jsonCanonSources";

export class GPT_Router {
  static createTraceId() {
    return crypto.randomUUID();
  }

  static async _fetchFile(
    fileID: string,
    useAuth: boolean = false,
  ): Promise<any> {
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
      const accessToken = (session as { accessToken?: string } | null)
        ?.accessToken;
      if (!accessToken) throw new Error("Missing Google Drive access token");

      url = `https://www.googleapis.com/drive/v3/files/${fileID}?alt=media&supportsAllDrives=true`;
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Fetch file ${fileID} failed (Status: ${res.status})`);
    }

    return res.json();
  }

  static async fetchJsonSource(
    source: string,
    useAuth: boolean = false,
  ): Promise<any> {
    return this._fetchFile(source, useAuth);
  }

  static async getPromptsMap(
    source: string = PROMPTS_MODE_READER_SOURCE,
  ): Promise<Record<string, any>> {
    return this._fetchFile(source);
  }

  static async getSystemPrompt(
    mode: string,
    source: string = PROMPTS_MODE_READER_SOURCE,
  ): Promise<string> {
    const config = await this._fetchFile(source);
    return config?.[mode]?.system ?? "";
  }

  static async getUserPrompt(
    mode: string,
    source: string = PROMPTS_MODE_READER_SOURCE,
  ): Promise<string> {
    const config = await this._fetchFile(source);
    return config?.[mode]?.user ?? "";
  }

  static async getGPTResponse(system: string, user: string) {
    const traceId = this.createTraceId();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const error = new Error("Missing OPENAI_API_KEY");
      (error as Error & { traceId?: string }).traceId = traceId;
      throw error;
    }

    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
    });

    if (!result.ok) {
      const errorBody = await result.text();
      const error = new Error(`OpenAI error ${result.status}: ${errorBody}`);
      (error as Error & { traceId?: string }).traceId = traceId;
      throw error;
    }

    const data = (await result.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      response:
        data.choices?.[0]?.message?.content?.trim() ?? "No response received.",
      traceId,
    };
  }

  private static _resolveLocalPath(source: string) {
    const looksLikeDriveId =
      /^[a-zA-Z0-9_-]{10,}$/.test(source) && !source.includes("/");
    if (looksLikeDriveId || source.startsWith("http")) return null;

    return path.isAbsolute(source) ? source : path.join(process.cwd(), source);
  }
}
