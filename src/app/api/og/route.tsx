import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Node.js runtime（Edge Runtimeだとローカルフォント読み込みに制約がある）
export const runtime = "nodejs";

// フォントキャッシュ
let notoSansJPData: Buffer | null = null;
let jetBrainsMonoData: Buffer | null = null;

async function loadFonts() {
  const fontsDir = join(process.cwd(), "public", "fonts");

  if (!notoSansJPData) {
    notoSansJPData = await readFile(join(fontsDir, "NotoSansJP-Medium.otf"));
  }
  if (!jetBrainsMonoData) {
    jetBrainsMonoData = await readFile(
      join(fontsDir, "JetBrainsMono-Regular.ttf")
    );
  }

  return { notoSansJPData, jetBrainsMonoData };
}

// 日本語禁則処理: 助詞・句読点の後にゼロ幅スペースを挿入
function processJapaneseBreaks(title: string): string {
  const breakable =
    /([はがのをにへでとやかもばけどなら、。！？）」』】])/g;
  return title.replace(breakable, "$1\u200B");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title");
  const category = searchParams.get("category");

  if (!title || !category) {
    return new Response("Missing required parameters: title, category", {
      status: 400,
    });
  }

  const fonts = await loadFonts();

  const processedTitle = processJapaneseBreaks(title);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          backgroundColor: "#111114",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景メッシュグラデーション */}
        {/* Green 1: 右下寄り */}
        <div
          style={{
            position: "absolute",
            top: "55%",
            right: "8%",
            width: "50%",
            height: "65%",
            transform: "translate(50%, -50%)",
            background:
              "radial-gradient(ellipse at center, rgba(29, 158, 117, 0.28) 0%, transparent 70%)",
          }}
        />
        {/* Purple: 中央下寄り */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "18%",
            width: "45%",
            height: "55%",
            transform: "translate(50%, -50%)",
            background:
              "radial-gradient(ellipse at center, rgba(83, 74, 183, 0.23) 0%, transparent 70%)",
          }}
        />
        {/* Green 2: 右端寄り */}
        <div
          style={{
            position: "absolute",
            top: "45%",
            right: "5%",
            width: "35%",
            height: "45%",
            transform: "translate(50%, -50%)",
            background:
              "radial-gradient(ellipse at center, rgba(29, 158, 117, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* 上部: ブランド名（右上） */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "18px",
              color: "#F5F5F5",
              letterSpacing: "0.12em",
            }}
          >
            AI STUDIO PAUL
          </div>
        </div>

        {/* 下部: カテゴリ + タイトル + バッジ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
          }}
        >
          {/* 左下: カテゴリ + タイトル */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "75%",
            }}
          >
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "16px",
                color: "#1D9E75",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              {category.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "Noto Sans JP",
                fontSize: "44px",
                fontWeight: 500,
                color: "#F5F5F5",
                lineHeight: 1.4,
                overflow: "hidden",
              }}
            >
              {processedTitle}
            </div>
          </div>

          {/* 右下: バッジ */}
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "16px",
              color: "#555555",
              letterSpacing: "0.12em",
              whiteSpace: "nowrap",
            }}
          >
            MADE WITH VIBE CODING
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fonts.notoSansJPData,
          weight: 500 as const,
          style: "normal" as const,
        },
        {
          name: "JetBrains Mono",
          data: fonts.jetBrainsMonoData,
          weight: 400 as const,
          style: "normal" as const,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
