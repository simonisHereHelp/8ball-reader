// @/lib/driveEditFile.ts
import { auth } from "@/auth";

/**
 * canonicals.json format (target):
 * [
 *   { "兆豐": "兆豐銀行" },
 *   { "兆豐": "兆豐國際銀行" }
 * ]
 */
function addNew(
  canonicals: Array<Record<string, string>>,
  issuer?: string,
  alias?: string
): Array<Record<string, string>> {
  const canonical = (issuer ?? "").trim();
  const a = (alias ?? "").trim();

  // Nothing to add
  if (!canonical || !a) return canonicals;

  // Prevent duplicates: same canonical+alias pair already exists
  const exists = canonicals.some((item) => item?.[canonical] === a);
  if (exists) return canonicals;

  // Append new mapping
  canonicals.push({ [canonical]: a });
  return canonicals;
}

export async function driveEditFile(params: any) {
  const fileId = params?.fileId as string | undefined;
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
    throw new Error(`driveEditFile read failed: ${readRes.status} ${errText}`);
  }

  const raw = await readRes.text();

  let canonicals: Array<Record<string, string>> = [];
  try {
    const parsed = JSON.parse(raw);
    canonicals = Array.isArray(parsed) ? parsed : [];
  } catch {
    // If file isn't valid JSON yet, treat it as empty list
    canonicals = [];
  }

  // 2) UPDATE
  const updated = addNew(canonicals, params?.issuer, params?.alias);
  const updated_content = JSON.stringify(updated, null, 2);

  // 3) PATCH back
  const uploadUrl =
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`;

  const writeRes = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: updated_content,
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text().catch(() => "");
    throw new Error(`driveEditFile write failed: ${writeRes.status} ${errText}`);
  }

  // optional: return updated list (or Drive file metadata if you prefer)
  return updated;
}
