import Link from "next/link";
import Image from "next/image";
import { PublicProject } from "@/app/actions/property-actions";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BaseCard } from "@/components/shared/base-card";
import { MapPin, BedDouble, Bath, Ruler, ArrowRight } from "lucide-react";

interface PropertyCardProps {
  project: PublicProject;
}

export function PropertyCard({ project }: PropertyCardProps) {
  // Format price
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

  return (
    <BaseCard
      className="overflow-hidden group"
      withPadding={false}
      data={project}
    >
      <Link href={`/properties/${project.slug}`} className="block relative aspect-[4/3] overflow-hidden">
        {project.images.featured ? (
          <Image
            src={project.images.featured}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-2">
            {project.isHotDeal && (
                <Badge variant="destructive">
                    Hot Deal
                </Badge>
            )}
            <Badge variant="tech">
                {project.status}
            </Badge>
        </div>
      </Link>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
            <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                    {project.type} • {project.location.area}
                </p>
                <Link href={`/properties/${project.slug}`} className="hover:underline">
                    <h3 className="font-sans text-xl font-semibold tracking-tight line-clamp-1 group-hover:gradient-text transition-all duration-300">
                        {project.displayName || project.name}
                    </h3>
                </Link>
            </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span className="truncate">{project.location.region}, {project.location.state}</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border my-2">
            <div className="flex flex-col items-center justify-center gap-1 text-center">
                <BedDouble className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium">
                    {project.specs.minBedrooms === project.specs.maxBedrooms
                        ? project.specs.minBedrooms
                        : `${project.specs.minBedrooms}-${project.specs.maxBedrooms}`} Beds
                </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 text-center border-l border-border">
                <Bath className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium">
                    {project.specs.minBathrooms === project.specs.maxBathrooms
                        ? project.specs.minBathrooms
                        : `${project.specs.minBathrooms}-${project.specs.maxBathrooms}`} Baths
                </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 text-center border-l border-border">
                <Ruler className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium">
                    {project.specs.minSqft} sqft
                </span>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Starting from</span>
            <span className="font-semibold text-lg gradient-text">
                {formatPrice(project.price.min, project.price.max)}
            </span>
        </div>
        <Link
            href={`/properties/${project.slug}`}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-tech-sm hover:shadow-tech-md hover:scale-105 transition-all duration-200"
        >
            <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </BaseCard>
  );
}
