import { getApiBaseUrl } from "@/lib/api-base-url";
import { LINKEDIN_POST_TITLE } from "@/lib/linkedin-post-template";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function fetchPostForMeta(postId: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/posts/${postId}/get_post`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ postContent?: string; userName?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPostForMeta(id);
  const description = String(post?.postContent || "View this post on Affiliate Chat Box.").slice(0, 200);
  const url = `${getSiteUrl()}/post/${encodeURIComponent(id)}`;
  const image = `${url}/opengraph-image`;

  return {
    title: LINKEDIN_POST_TITLE,
    description,
    openGraph: {
      title: LINKEDIN_POST_TITLE,
      description,
      url,
      siteName: "Affiliate Chat Box",
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: LINKEDIN_POST_TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title: LINKEDIN_POST_TITLE,
      description,
      images: [image],
    },
  };
}

export { default } from "./post-page-client";
