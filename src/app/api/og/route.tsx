import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Google Fonts APIからフォントをfetch（Edge Function サイズ制限対策）
// CSSを取得 → フォントURL抽出 → 全サブセットを結合
async function fetchGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const cssRes = await fetch(cssUrl, {
    headers: {
      // 古いUser-AgentでTTF形式を返させる（woff2はSatoriで非対応）
      "User-Agent":
        "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+",
    },
  });
  const css = await cssRes.text();

  // CSSからフォントURLを全て抽出
  const fontUrls = [
    ...css.matchAll(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g
    ),
  ].map((m) => m[1]);

  if (fontUrls.length === 0) {
    throw new Error(`No font URLs found for ${family}`);
  }

  // 全サブセットをダウンロード
  const buffers = await Promise.all(
    fontUrls.map((url) => fetch(url).then((r) => r.arrayBuffer()))
  );

  // 最大のバッファを返す（CJKサブセットが最大）
  return buffers.reduce((max, buf) =>
    buf.byteLength > max.byteLength ? buf : max
  );
}

// JetBrains Mono もGoogle Fonts APIからTTF形式で取得
async function fetchJetBrainsMono(): Promise<ArrayBuffer> {
  return fetchGoogleFont("JetBrains Mono", 400);
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

  const [notoSansJPData, jetBrainsMonoData] = await Promise.all([
    fetchGoogleFont("Noto Sans JP", 500),
    fetchJetBrainsMono(),
  ]);

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
          data: notoSansJPData,
          weight: 500 as const,
          style: "normal" as const,
        },
        {
          name: "JetBrains Mono",
          data: jetBrainsMonoData,
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
