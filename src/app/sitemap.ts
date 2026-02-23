// src\app\sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allProjects = await db.query.projects.findMany({
    where: eq(projects.isPublished, true),
    columns: { slug: true, updatedAt: true },
    limit: 1000,
  });

  const projectUrls = allProjects.map((project) => ({
    url: `https://propertygojb.com/properties/${project.slug}`,
    lastModified: project.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://propertygojb.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://propertygojb.com/properties',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...projectUrls,
  ];
}
