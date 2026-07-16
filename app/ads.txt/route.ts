// 애드센스 ads.txt — 게시자 ID가 있으면 자동 생성된다.
// (ads.txt 가 없으면 애드센스가 "수익 손실 위험" 경고를 띄운다)

export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ""; // ca-pub-XXXXXXXXXXXXXXXX
  if (!/^ca-pub-\d+$/.test(client)) {
    return new Response("Not Found", { status: 404 });
  }
  const pub = client.replace(/^ca-/, ""); // pub-XXXXXXXXXXXXXXXX
  const body = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
