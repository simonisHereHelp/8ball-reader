// app/api/summarize/route.ts

import { NextResponse } from "next/server";

import { GPT_Router } from "@/lib/gptRouter";
import { PROMPTS_MODE_READER_SOURCE } from "@/lib/jsonCanonSources";


export async function POST(req: Request) {

  const apiKey = process.env.OPENAI_API_KEY;

  const PROMPT_ID = PROMPTS_MODE_READER_SOURCE;

  try {
    // 1️⃣ 取得 Prompt 設定

    const [systemPrompt, userPrompt] = await Promise.all([

      GPT_Router.getSystemPrompt(PROMPT_ID),

      GPT_Router.getUserPrompt(PROMPT_ID)

    ]);



    // 2️⃣ 圖片處理邏輯 (與先前一致)

    const formData = await req.formData();

    const imageFiles = formData.getAll("image").filter((f): f is File => f instanceof File);

    const imageUrls = await Promise.all(

      imageFiles.map(async (file) => {

        const buffer = Buffer.from(await file.arrayBuffer()).toString("base64");

        return `data:${file.type};base64,${buffer}`;

      })

    );



    // 3️⃣ 呼叫 OpenAI

    const content = [

      { type: "text", text: userPrompt },

      ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),

    ];



    const response = await fetch("https://api.openai.com/v1/chat/completions", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${apiKey}`,

      },

      body: JSON.stringify({

        model: "gpt-4o-mini",

        messages: [

          { role: "system", content: systemPrompt },

          { role: "user", content },

        ],

        temperature: 0,

      }),

    });



    const data = await response.json();

    return NextResponse.json({ summary: data?.choices?.[0]?.message?.content ?? "" });



  } catch (err: any) {

    console.error("Summarize Error:", err);

    return NextResponse.json({ error: err.message }, { status: 500 });

  }

}
