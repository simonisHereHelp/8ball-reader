import { NextResponse } from "next/server";
import { createSign } from "crypto";

type PromptsPayload = {
  prompts: Record<string, { system: string; user: string }>;
};

const toBase64Url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const getAccessToken = async () => {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = toBase64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );

  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(privateKey);

  const assertion = `${header}.${claim}.${toBase64Url(signature)}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  return tokenData.access_token ?? null;
};

export async function POST(request: Request) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const promptsPath = process.env.PROMPTS_MODE_READER_PATH;
  const accessToken = await getAccessToken();

  if (!folderId || !accessToken) {
    return NextResponse.json(
      {
        link: promptsPath
          ? `https://drive.google.com/file/d/${promptsPath}/view?usp=drive_link`
          : null,
        error: "Drive credentials not configured.",
      },
      { status: 501 },
    );
  }

  const { prompts } = (await request.json()) as PromptsPayload;
  const metadata = {
    name: "prompts_mode_reader.json",
    parents: [folderId],
  };
  const fileContent = JSON.stringify(prompts, null, 2);
  const boundary = `boundary_${Math.random().toString(16).slice(2)}`;

  const multipartBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    fileContent,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  if (!uploadResponse.ok) {
    return NextResponse.json(
      { link: null, error: "Drive upload failed." },
      { status: 500 },
    );
  }

  const uploadData = (await uploadResponse.json()) as { id?: string };
  const fileId = uploadData.id;

  if (!fileId) {
    return NextResponse.json(
      { link: null, error: "Drive upload missing file id." },
      { status: 500 },
    );
  }

  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    },
  );

  const linkId = promptsPath ?? fileId;
  return NextResponse.json({
    link: `https://drive.google.com/file/d/${linkId}/view?usp=drive_link`,
  });
}
