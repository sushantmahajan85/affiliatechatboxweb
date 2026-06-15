import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/chats",
        "/settings",
        "/notifications",
        "/login",
        "/auth",
        "/profile",
        "/email-templates",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
