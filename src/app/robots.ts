import { type MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rekhachitra.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/join"],
        disallow: ["/dashboard/", "/api/", "/join/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
