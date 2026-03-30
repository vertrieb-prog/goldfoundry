import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: "https://goldfoundry.de", lastModified: new Date() },
    { url: "https://goldfoundry.de/risikohinweis", lastModified: new Date() },
    { url: "https://goldfoundry.de/impressum", lastModified: new Date() },
    { url: "https://goldfoundry.de/datenschutz", lastModified: new Date() },
    { url: "https://goldfoundry.de/agb", lastModified: new Date() },
    { url: "https://goldfoundry.de/auth/login", lastModified: new Date() },
    { url: "https://goldfoundry.de/auth/register", lastModified: new Date() },
  ];
}
