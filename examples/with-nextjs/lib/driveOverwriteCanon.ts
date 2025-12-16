// @/lib/driveOverwriteCanon.ts

import { auth } from "@/auth";
import { Buffer } from "buffer"; 

/**
 * canonicals.json format (target):
 * [
 * { "兆豐": "兆豐銀行" },
 * { "兆豐": "兆豐國際銀行" }
 * ]
 */
function addNew(
  canonicals: Array<Record<string, string>>,
  canonical: string,
  alias: string
): Array<Record<string, string>> {
  const c = canonical.trim();
  const a = alias.trim();

  // Nothing to add
  if (!c || !a) return canonicals;

  // Prevent duplicates: same canonical+alias pair already exists
  const exists = canonicals.some((item) => item?.[c] === a);
  if (exists) return canonicals;

  // Append new mapping
  canonicals.push({ [c]: a });
  return canonicals;
}

/**
 * 從 Google Drive 讀取、更新 Canonical JSON 檔案，然後使用 PATCH 寫回更新後的內容。
 * @param fileId Google Drive 檔案 ID (process.env.DRIVE_FILE_ID_CANONICALS)
 * @param canonical 要新增或更新的 Canonical 名稱
 * @param alias 要新增的 Alias 名稱
 */
export async function driveOverwriteCanon(params: { 
    fileId: string, 
    canonical: string, 
    alias: string 
}) {
  const { fileId, canonical, alias } = params;
  if (!fileId) throw new Error("Missing fileId");

  const session = await auth();
  if (!session) throw new Error("Not authenticated.");

  const accessToken = (session as any)?.accessToken as string | undefined;
  if (!accessToken) throw new Error("Missing Google Drive access token on session.");

  // 1) LOAD current file content
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
  const readRes = await fetch(downloadUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!readRes.ok) {
    const errText = await readRes.text().catch(() => "");
    throw new Error(`driveOverwriteCanon read failed: ${readRes.status} ${errText}`);
  }

  const raw = await readRes.text();

  let canonicals: Array<Record<string, string>> = [];
  try {
    const parsed = JSON.parse(raw);
    canonicals = Array.isArray(parsed) ? parsed : [];
  } catch {
    // If file isn't valid JSON yet, treat it as empty list
    console.warn("Canonical file is not valid JSON, starting with empty list.");
    canonicals = [];
  }

  // 2) UPDATE
  const updated = addNew(canonicals, canonical, alias);
  const updated_content = JSON.stringify(updated, null, 2);

  // 3) PATCH back
  const uploadUrl =
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`;

  const writeRes = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8", // Correct MIME type for JSON content
    },
    body: updated_content,
  });
  
  if (!writeRes.ok) {
    const errText = await writeRes.text().catch(() => "");
    throw new Error(`Drive PATCH failed: ${writeRes.status} ${errText}`);
  }
  
  // Return the full updated content for logging/verification (optional)
  return updated_content;
}