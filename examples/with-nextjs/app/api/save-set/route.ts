// app/api/save-set/route.ts
import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { driveSaveFiles } from "@/lib/driveSaveFiles";

const mimeTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const resolveExtension = (fileName: string, fallback: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && extension.length ? extension : fallback;
};

const resolveMimeType = (file: File, fallbackExtension: string) => {
  if (file.type) return file.type;
  const extension = resolveExtension(file.name, fallbackExtension);
  return mimeTypeByExtension[extension] ?? "application/octet-stream";
};

export const runtime = "nodejs";

const ROOT_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

export async function POST(request: Request) {
  if (!ROOT_DRIVE_FOLDER_ID) {
    return NextResponse.json({ error: "Missing DRIVE_FOLDER_ID" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "Files are required." }, { status: 400 });
    }

    await driveSaveFiles({
      folderId: ROOT_DRIVE_FOLDER_ID,
      files,
      fileToUpload: async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const extension = resolveExtension(file.name, "jpeg");
        const mimeType = resolveMimeType(file, extension);
        const name = file.name || `capture-${Date.now()}.${extension}`;

        return { name, buffer, mimeType };
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("save-set failed:", err);
    return NextResponse.json({ error: "Failed to save files." }, { status: 500 });
  }
}
