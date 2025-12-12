// @/lib/driveEditFile.ts
export async function driveEditFile(params: any) {
  const accessToken = params?.accessToken;
  const fileId = params?.fileId;
  const content = params?.content ?? "";
  const contentType = params?.contentType ?? "text/plain; charset=utf-8";

  if (!accessToken) throw new Error("Missing accessToken");
  if (!fileId) throw new Error("Missing fileId");

  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

  const res = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body: content,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`driveEditFile failed: ${res.status} ${errText}`);
  }

  // Drive usually returns JSON metadata for this PATCH
  return res.json().catch(() => null);
}
