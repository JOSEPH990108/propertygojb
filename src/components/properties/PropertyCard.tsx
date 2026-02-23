import Link from "next/link";
import Image from "next/image";
import { PublicProject } from "@/app/actions/property-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
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
                <Badge variant="destructive" className="font-semibold shadow-sm">
                    Hot Deal
                </Badge>
            )}
            <Badge variant="secondary" className="font-semibold shadow-sm backdrop-blur-md bg-background/80">
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
                    <h3 className="font-serif text-xl font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {project.displayName || project.name}
                    </h3>
                </Link>
            </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{project.location.region}, {project.location.state}</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50 my-2">
            <div className="flex flex-col items-center justify-center gap-1 text-center">
                <BedDouble className="h-4 w-4 text-primary/70" />
                <span className="text-xs font-medium">
                    {project.specs.minBedrooms === project.specs.maxBedrooms
                        ? project.specs.minBedrooms
                        : `${project.specs.minBedrooms}-${project.specs.maxBedrooms}`} Beds
                </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 text-center border-l border-border/50">
                <Bath className="h-4 w-4 text-primary/70" />
                <span className="text-xs font-medium">
                    {project.specs.minBathrooms === project.specs.maxBathrooms
                        ? project.specs.minBathrooms
                        : `${project.specs.minBathrooms}-${project.specs.maxBathrooms}`} Baths
                </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 text-center border-l border-border/50">
                <Ruler className="h-4 w-4 text-primary/70" />
                <span className="text-xs font-medium">
                    {project.specs.minSqft} sqft
                </span>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Starting from</span>
            <span className="font-semibold text-lg text-primary">
                {formatPrice(project.price.min, project.price.max)}
            </span>
        </div>
        <Link
            href={`/properties/${project.slug}`}
            className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
            <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
