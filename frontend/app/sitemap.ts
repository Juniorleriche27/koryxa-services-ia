import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "/", priority: 1, changeFrequency: "monthly" },
    { url: "/services-ia", priority: 0.9, changeFrequency: "monthly" },
  ];
}
