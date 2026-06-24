import { getApiBaseUrl } from "@/lib/api-base-url";
import { LINKEDIN_POST_TITLE } from "@/lib/linkedin-post-template";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = LINKEDIN_POST_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = {
  params: Promise<{ id: string }>;
};

export default async function Image({ params }: OgProps) {
  const { id } = await params;
  let excerpt = "Connect with global affiliates online.";
  let author = "Affiliate Chat Box";

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/posts/${id}/get_post`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const post = (await res.json()) as { postContent?: string; userName?: string };
      const content = String(post.postContent || "").trim();
      if (content) excerpt = content.length > 220 ? `${content.slice(0, 219)}…` : content;
      if (post.userName) author = post.userName;
    }
  } catch {
    // fallback copy
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(145deg, #0A7EA4 0%, #054a61 100%)",
          padding: "48px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#fff", fontSize: 34, fontWeight: 700 }}>Affiliate Chat Box</div>
            <div style={{ color: "#bae6fd", fontSize: 20, marginTop: 4 }}>affiliatechatbox.com</div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            marginTop: 36,
            background: "rgba(255,255,255,0.97)",
            borderRadius: 20,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ color: "#0A7EA4", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
            New posting update
          </div>
          <div
            style={{
              color: "#1A1A2E",
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.45,
              flex: 1,
            }}
          >
            {excerpt}
          </div>
          <div style={{ color: "#64748b", fontSize: 20, marginTop: 24 }}>— {author}</div>
        </div>

        <div style={{ color: "#e0f2fe", fontSize: 20, marginTop: 24, fontWeight: 600 }}>
          #Affiliatechatbox • Download on Android & iPhone
        </div>
      </div>
    ),
    { ...size }
  );
}
