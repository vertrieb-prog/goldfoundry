import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: "https://goldfoundry.de", lastModified: new Date() },
    { url: "https://goldfoundry.de/dashboard", lastModified: new Date() },
  ];
}
