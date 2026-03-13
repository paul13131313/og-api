import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OGP Image API — AI STUDIO PAUL",
  description:
    "URLにタイトルとカテゴリを渡すだけで、ブランド統一されたOGP画像を動的に生成するAPI。",
  metadataBase: new URL("https://og-api-self.vercel.app"),
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "OGP Image API",
    description:
      "URLにタイトルとカテゴリを渡すだけで、ブランド統一されたOGP画像を動的に生成するAPI。",
    images: [
      {
        url: "/api/og?title=OGP%20Image%20API&category=Developer%20Tool",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#1D9E75" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
