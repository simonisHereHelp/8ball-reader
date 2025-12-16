// app/api/save-set/route.ts
import { NextResponse } from "next/server";
import { Buffer } from "buffer"; 
import { driveSaveFiles } from "@/lib/driveSaveFiles";
import { fetchCanonicalFileContent } from "@/lib/driveCanonUtils"; 

// 🎯 新增：Canonical 更新所需的函式與常數
import { driveUpdateCanon } from "@/lib/driveUpdateCanon"; 
import { driveOverwriteCanon } from "@/lib/driveOverwriteCanon"; 
const CANONICAL_FILE_ID = process.env.DRIVE_FILE_ID_CANONICALS; 

export const runtime = "nodejs"; 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID; 

const PROMPTS_URL =
  process.env.PROMPTS_URL ??
  "https://drive.google.com/uc?export=download&id=1srQP_Ekw79v45jgkwgeV67wx6j9OcmII";


type PromptConfig = {
  system: string;
  user: string;
  wordTarget?: number;
};

let cachedPrompts: PromptConfig | null = null;

// 讀取遠端 prompts.json（靜態 Prompt 模板）
async function fetchPrompts(): Promise<PromptConfig> {
  if (cachedPrompts) return cachedPrompts;

  const res = await fetch(PROMPTS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const prompts = (await res.json()) as Partial<PromptConfig>;
  if (!prompts.system || !prompts.user) {
    throw new Error("Missing prompt fields");
  }

  cachedPrompts = {
    system: prompts.system,
    user: prompts.user,
    wordTarget:
      typeof prompts.wordTarget === "number" ? prompts.wordTarget : 100,
  };

  return cachedPrompts;
}


function buildUserPrompt(template: string, words: number) {
  return template.replace(/\{\{\s*wordTarget\s*\}\}/gi, String(words));
}

// 用 ChatGPT 根據 summary 與 Canonicals 產生「單位-性質-行動」，再加上日期 => setName
async function deriveSetNameFromSummary(
  summary: string,
  canonicalsJson: string, 
): Promise<string> {
  const trimmed = summary.trim();

  // 日期部分：YYYYMMDD
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // fallback 標題（如果 GPT 失敗）
  const fallbackTitle = trimmed
    .replace(/\s+/g, " ")
    .split(" ")
    .slice(0, 4)
    .join("-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "document";

  // 沒有 OPENAI_API_KEY 就直接用 fallback
  if (!OPENAI_API_KEY) {
    return `${fallbackTitle}-${datePart}`;
  }

  try {
    const prompts = await fetchPrompts(); 
    const wordTarget = prompts.wordTarget ?? 100;
    const userPromptTemplate = buildUserPrompt(prompts.user, wordTarget);

    // 將 Canonicals 清單和 Summary 注入 User Prompt
    const userContent = userPromptTemplate
      .replace("{{CANONICALS_JSON}}", canonicalsJson) 
      .replace("{{SUMMARY}}", trimmed);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompts.system },
          { role: "user", content: userContent },
        ],
        max_tokens: 64,
        temperature: 0, 
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Labeling completion failed:", res.status, errText);
      return `${fallbackTitle}-${datePart}`;
    }

    const data = await res.json();
    let label = data?.choices?.[0]?.message?.content ?? "";
    if (typeof label !== "string") {
      label = String(label ?? "");
    }
    label = label.trim();

    // 安全處理成檔名可用格式
    const safeLabel =
      label
        .replace(/[\\\/:*?"<>|]/g, "-") 
        .replace(/\s+/g, "") 
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || fallbackTitle;

    return `${safeLabel}-${datePart}`;
  } catch (err) {
    console.error("deriveSetNameFromSummary GPT error:", err);
    return `${fallbackTitle}-${datePart}`;
  }
}

export async function POST(request: Request) {
  if (!DRIVE_FOLDER_ID) {
    return NextResponse.json(
      { error: "Missing DRIVE_FOLDER_ID environment variable." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  // ✅ NEW: 接收原始 LLM 輸出的摘要，用於 Canonical Learning
  const draftSummary = (formData.get("draftSummary") as string | null)?.trim() ?? "";
  // 這是使用者編輯後的最終摘要 (用於產生最終 setName)
  const summary = (formData.get("summary") as string | null)?.trim() ?? "";
  const files = formData
    .getAll("files")
    .filter((file): file is File => file instanceof File);

  if (!summary) {
    return NextResponse.json(
      { error: "Summary is required before saving." },
      { status: 400 },
    );
  }

  if (!files.length) {
    return NextResponse.json(
      { error: "No files provided for upload." },
      { status: 400 },
    );
  }
  
  try {
    // 1. 獲取 Canonicals 清單 (動態數據)
    const canonicalsJson = await fetchCanonicalFileContent(); 

    // 2. 決定 setName：
    // 通過 GPT 從編輯後摘要 (summary) 生成
    const setName = deriveSetNameFromSummary(summary, canonicalsJson); 

    // 3. 執行 Drive 儲存操作 (File Saving)
    await driveSaveFiles({
      folderId: DRIVE_FOLDER_ID, 
      files,
      fileToUpload: async (file) => {
        const baseName = setName.replace(/[\\/:*?"<>|]/g, "_"); 
        const extension = file.name.split(".").pop();

        let fileName: string;
        if (file.name === "summary.json") {
            fileName = `${baseName}.json`;
        } else {
            // 找到非 summary.json 檔案的索引
            const imageIndex = files.filter(f => f.name !== "summary.json").indexOf(file) + 1;
            fileName = `${baseName}-p${imageIndex}.${extension ?? "dat"}`;
        }
        
        return {
          name: fileName,
          buffer: Buffer.from(await file.arrayBuffer()),
          mimeType: file.type,
        };
      },
    });

    // ⭐ 4. Canonical Update (Learning) - 確保在文件儲存後執行
    // 這一步是為了實現：Canonical(勞保局) -> Alias(勞保單位)
    if (draftSummary && summary && CANONICAL_FILE_ID) {
        try {
            // 4a. 呼叫 GPT 輔助函數，比較 draft/edited summary，以獲取 Canonical/Alias
            const { canonical, alias } = await driveUpdateCanon({
                canonicalBibleJson: canonicalsJson,
                draftSummary: draftSummary, // 原始 LLM 輸出
                editableSummary: summary,    // 最終編輯內容
            });

            // 4b. 若需要更新，則執行 Drive 寫入操作
            if (canonical && alias) {
                await driveOverwriteCanon({
                    fileId: CANONICAL_FILE_ID,
                    canonical: canonical,
                    alias: alias,
                });
                console.log(`✅ Canonical update in save-set: ${canonical} -> ${alias}`);
            }
        } catch (e) {
            // Canonical update 是非關鍵的 side effect，不應中斷文件儲存的成功回應
            console.error("Canonical update failed (non-critical):", e);
        }
    }

    // ✅ success response
    return NextResponse.json({ setName }, { status: 200 });
  } catch (err: any) {
    console.error("save-set failed:", err);
    // ❌ error response
    return new NextResponse(err.message || "save-set failed.", { status: 500 });
  }
}