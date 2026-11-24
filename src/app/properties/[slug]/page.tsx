import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findProperty,
  formatFloorArea,
  properties,
} from "../../../prototypes/properties/fixtures";
import { createDemoInquiryHref } from "../../../prototypes/properties/inquiries";
import { PropertyArt } from "../../../prototypes/properties/property-art";
import { PropertyCard } from "../../../prototypes/properties/property-card";
import styles from "../../property-listings.module.css";

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const property = findProperty((await params).slug);
  return {
    title: property
      ? `${property.name} demo concept`
      : "Property concept not found",
    description: property
      ? `Fictional demonstration only. ${property.introduction}`
      : "This fictional property concept is not in the demo collection.",
  };
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/properties/[slug]">) {
  const property = findProperty((await params).slug);
  if (!property) notFound();

  const specifications: readonly (readonly [string, string])[] = [
    ["Property type (concept)", property.type],
    ["Area inspiration only", property.area],
    ["Illustrative bedrooms", String(property.bedrooms)],
    ["Illustrative bathrooms", String(property.bathrooms)],
    ["Illustrative floor area", formatFloorArea(property.floorAreaSqFt)],
    ["Pricing and availability", "Not verified or provided"],
  ];
  const relatedProperties = properties.filter(
    (related) =>
      related.slug !== property.slug && related.area === property.area,
  );
  const related =
    relatedProperties.length > 0
      ? relatedProperties
      : properties
          .filter((related) => related.slug !== property.slug)
          .slice(0, 3);

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/properties">Demo collection</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{property.name}</span>
      </nav>
      <section
        className={styles.detailHeading}
        aria-labelledby="property-title"
      >
        <div>
          <p className={styles.eyebrow}>
            {property.area} inspiration / {property.type} concept
          </p>
          <h1 id="property-title">{property.name}</h1>
        </div>
        <p className={styles.intro}>{property.introduction}</p>
      </section>
      <section
        className={styles.gallery}
        aria-label="Fictional architectural illustrations"
      >
        <figure>
          <PropertyArt property={property} />
          <figcaption>
            01 / Exterior study <span>Fictional illustration</span>
          </figcaption>
        </figure>
        <figure>
          <PropertyArt property={property} view="courtyard" />
          <figcaption>
            02 / Courtyard study <span>Fictional illustration</span>
          </figcaption>
        </figure>
      </section>
      <p className={styles.galleryNote}>
        These original vector illustrations are design placeholders, not
        photographs, floor plans or representations of a real development.
      </p>
      <div className={styles.detailGrid}>
        <div>
          <section
            className={styles.detailSection}
            aria-labelledby="highlights-title"
          >
            <p className={styles.eyebrow}>The idea behind the space</p>
            <h2 id="highlights-title">A few considered details.</h2>
            <ul className={styles.highlights}>
              {property.highlights.map((highlight, index) => (
                <li key={highlight}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <p>{highlight}</p>
                </li>
              ))}
            </ul>
          </section>
          <section
            className={styles.detailSection}
            aria-labelledby="location-title"
          >
            <p className={styles.eyebrow}>Regional inspiration only</p>
            <h2 id="location-title">An imagined place in {property.area}.</h2>
            <p>{property.locationDescription}</p>
            <p className={styles.smallNote}>
              No real address, map pin, amenity or travel-time claim is
              provided.
            </p>
          </section>
        </div>
        <aside className={styles.specPanel} aria-labelledby="spec-title">
          <p className={styles.eyebrow}>Fictional demo concept</p>
          <h2 id="spec-title">Illustrative specifications</h2>
          <dl>
            {specifications.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.smallNote}>
            All details are invented for design testing. This is not a property
            offer or a real development.
          </p>
        </aside>
      </div>
      <section className={styles.inquiry} aria-labelledby="inquiry-title">
        <div>
          <p className={styles.eyebrow}>Have a question?</p>
          <h2 id="inquiry-title">Prepare a WhatsApp message.</h2>
          <p>
            The message identifies this fictional concept and asks about current
            verified listings. No PropertyGOJB number is configured; choose a
            recipient in WhatsApp before sending.
          </p>
        </div>
        <a
          className={styles.button}
          href={createDemoInquiryHref(property)}
          target="_blank"
          rel="noreferrer"
        >
          Prepare WhatsApp enquiry <span aria-hidden="true">↗</span>
        </a>
      </section>
      <section className={styles.related} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Continue exploring</p>
            <h2 id="related-title">Related demo concepts.</h2>
          </div>
          <Link href="/properties">View all concepts</Link>
        </div>
        <div className={styles.grid}>
          {related.map((relatedProperty) => (
            <PropertyCard
              key={relatedProperty.slug}
              property={relatedProperty}
              hrefPrefix="/properties"
            />
          ))}
        </div>
      </section>
      <div className={styles.detailReturn}>
        <p>Explore the full demo collection.</p>
        <Link className={styles.button} href="/properties">
          Back to all concepts <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
