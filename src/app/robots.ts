import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mockmate.ai";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/login", "/register", "/privacy", "/terms", "/practice/"],
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
