// src\app\(main)\properties\page.tsx
import { Metadata } from "next";
import { getProperties } from "@/app/actions/property-actions";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { Pagination } from "@/components/shared/Pagination";

export const metadata: Metadata = {
  title: "Properties for Sale in Johor Bahru | PropertyGoJB",
  description: "Browse our curated list of premier properties in Johor Bahru, Bukit Indah, and surrounding areas. Find your dream home or investment opportunity today.",
  openGraph: {
    title: "Properties for Sale in Johor Bahru | PropertyGoJB",
    description: "Browse our curated list of premier properties in Johor Bahru, Bukit Indah, and surrounding areas.",
    type: "website",
  }
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categoryId?: string; regionId?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const categoryId = params.categoryId;
  const regionId = params.regionId;

  // We set limit to 9 for a 3x3 grid
  const { data, totalPages } = await getProperties({
      page,
      limit: 9,
      categoryId,
      regionId
  });

  return (
    <div className="container py-10 min-h-screen">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 pt-20 md:pt-10">
            <h1 className="text-4xl font-serif font-bold tracking-tight">Discover Properties</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
                Explore our exclusive collection of residential and commercial properties in Johor's most prime locations.
            </p>
        </div>

        {/* Future: Filter Component here */}

        <PropertyGrid projects={data} />

        <Pagination totalPages={totalPages} className="mt-8" />
      </div>
    </div>
  );
}
