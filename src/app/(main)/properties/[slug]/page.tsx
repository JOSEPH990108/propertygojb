import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { cache } from "react";
import { getPropertyBySlug } from "@/app/actions/property-actions";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedDouble, Bath, Ruler, MapPin, Calendar, CheckCircle2 } from "lucide-react";

// Deduplicate the DB call using React cache
const getProject = cache(async (slug: string) => {
  return await getPropertyBySlug(slug);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) return { title: "Property Not Found" };

  return {
    title: `${project.displayName || project.name} | PropertyGoJB`,
    description: project.description?.slice(0, 160),
    openGraph: {
      title: `${project.displayName || project.name} | PropertyGoJB`,
      description: project.description?.slice(0, 200),
      images: project.images.featured ? [project.images.featured] : [],
      url: `https://propertygojb.com/properties/${project.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.displayName || project.name} | PropertyGoJB`,
      description: project.description?.slice(0, 200),
      images: project.images.featured ? [project.images.featured] : [],
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  // Helper for formatting price
  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return "Price on Request";
    const formatter = new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      maximumFractionDigits: 0,
    });

    if (min && max && min !== max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    return formatter.format(min || max || 0);
  };

  const formatRange = (min: number | null, max: number | null) => {
      if (!min && !max) return "-";
      if (min === max) return min;
      return `${min} - ${max}`;
  };

  return (
    <>
      <JsonLd project={project} />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        {/* Hero Image */}
        <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
            {project.images.featured ? (
                <Image
                    src={project.images.featured}
                    alt={project.name}
                    fill
                    className="object-cover"
                    priority
                />
            ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">No Image</div>
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white container">
                <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90">
                    {project.status || "Project"}
                </Badge>
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-2 drop-shadow-md">
                    {project.displayName || project.name}
                </h1>
                <div className="flex items-center gap-2 text-lg md:text-xl text-white/90 drop-shadow-md">
                    <MapPin className="h-5 w-5" />
                    <span>{project.address ? `${project.address}, ` : ""}{project.location.area}, {project.location.state}</span>
                </div>
            </div>
        </div>

        <div className="container grid grid-cols-1 lg:grid-cols-3 gap-10 -mt-10 relative z-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                {/* Specs Card */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <BedDouble className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm text-muted-foreground">Bedrooms</span>
                            <span className="font-semibold text-lg">{formatRange(project.specs.minBedrooms, project.specs.maxBedrooms)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <Bath className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm text-muted-foreground">Bathrooms</span>
                            <span className="font-semibold text-lg">{formatRange(project.specs.minBathrooms, project.specs.maxBathrooms)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <Ruler className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm text-muted-foreground">Size (sqft)</span>
                            <span className="font-semibold text-lg">{formatRange(project.specs.minSqft, project.specs.maxSqft)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <Calendar className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm text-muted-foreground">Tenure</span>
                            <span className="font-semibold text-lg">{project.specs.tenure || "Freehold"}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold font-serif">About this Project</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                        {project.description}
                    </div>
                </div>

                {/* Amenities */}
                {project.amenities.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold font-serif">Amenities</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {project.amenities.map(amenity => (
                                <div key={amenity} className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar / CTA */}
            <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border sticky top-24">
                    <h3 className="text-lg font-semibold mb-1">Starting Price</h3>
                    <div className="text-3xl font-bold text-primary mb-6">
                        {formatPrice(project.price.min, project.price.max)}
                    </div>

                    <div className="space-y-4">
                        <Button size="lg" className="w-full text-lg font-semibold shadow-lg shadow-primary/20">
                            Book a Viewing
                        </Button>
                        <Button size="lg" variant="outline" className="w-full">
                            Request Brochure
                        </Button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center gap-4">
                            {project.developer.logo && (
                                <div className="relative h-12 w-12 rounded-full overflow-hidden border border-border shrink-0">
                                    <Image src={project.developer.logo} alt={project.developer.name} fill className="object-cover" />
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Developer</p>
                                <p className="font-semibold leading-tight">{project.developer.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
