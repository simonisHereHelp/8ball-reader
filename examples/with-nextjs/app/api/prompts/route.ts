import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PROMPTS_MODE_READER_SOURCE } from "@/lib/jsonCanonSources";

type PromptsPayload = {
  prompts: Record<string, { system: string; user: string }>;
};

export async function POST(request: Request) {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const promptsSource = PROMPTS_MODE_READER_SOURCE;
  const promptsLinkId =
    promptsSource && (promptsSource.startsWith("/") || promptsSource.endsWith(".json"))
      ? null
      : promptsSource;

  if (!accessToken) {
    return NextResponse.json(
      { link: null, error: "Authentication required." },
      { status: 401 },
    );
  }

  if (!folderId) {
    return NextResponse.json(
      {
        link: promptsLinkId
          ? `https://drive.google.com/file/d/${promptsLinkId}/view?usp=drive_link`
          : null,
        error: "Drive folder not configured.",
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

  const linkId = promptsLinkId || fileId;
  return NextResponse.json({
    link: `https://drive.google.com/file/d/${linkId}/view?usp=drive_link`,
  });
}
