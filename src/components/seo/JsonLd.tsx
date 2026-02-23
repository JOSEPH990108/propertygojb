// src\components\seo\JsonLd.tsx
import { PublicProject } from "@/app/actions/property-actions";

export function JsonLd({ project }: { project: PublicProject }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": project.displayName || project.name,
    "description": project.description,
    "image": project.images.featured ? [project.images.featured] : [],
    "datePosted": project.launchYear ? `${project.launchYear}-01-01` : undefined,
    "url": `https://propertygojb.com/properties/${project.slug}`, // Assuming domain
    "offers": {
        "@type": "Offer",
        "priceCurrency": "MYR",
        "price": project.price.min || undefined,
        "availability": "https://schema.org/InStock", // Defaulting for simplicity
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": project.address,
      "addressLocality": project.location.area || project.location.region || "Johor Bahru",
      "addressRegion": project.state,
      "addressCountry": "MY",
    },
    "numberOfBedrooms": project.specs.minBedrooms,
    "numberOfBathroomsTotal": project.specs.minBathrooms,
    "floorSize": {
        "@type": "QuantitativeValue",
        "value": project.specs.minSqft,
        "unitCode": "FTK"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
