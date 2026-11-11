import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findProperty,
  formatFloorArea,
  properties,
} from "../../../../prototypes/properties/fixtures";
import { PropertyArt } from "../../../../prototypes/properties/property-art";
import styles from "../../../property-listings.module.css";

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/prototype/properties/[slug]">): Promise<Metadata> {
  const property = findProperty((await params).slug);
  return {
    title: property
      ? `${property.name} | Fictional PropertyGOJB concept`
      : "Concept not found | PropertyGOJB prototype",
    description: property
      ? `Fictional demonstration only. ${property.introduction}`
      : "This fictional concept does not exist.",
  };
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/prototype/properties/[slug]">) {
  const property = findProperty((await params).slug);
  if (!property) notFound();
  const specifications: readonly (readonly [string, string])[] = [
    ["Property type", property.type],
    ["Regional inspiration", property.area],
    ["Bedrooms", String(property.bedrooms)],
    ["Bathrooms", String(property.bathrooms)],
    ["Illustrative floor area", formatFloorArea(property.floorAreaSqFt)],
    ["Pricing", "Not provided in this prototype"],
  ];
  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/prototype/properties">The collection</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{property.name}</span>
      </nav>
      <section
        className={styles.detailHeading}
        aria-labelledby="property-title"
      >
        <div>
          <p className={styles.eyebrow}>
            {property.area} / {property.type}
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
        Visual placeholders only. These illustrations are not photographs, floor
        plans or representations of an actual development.
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
            <p className={styles.eyebrow}>Regional inspiration</p>
            <h2 id="location-title">An imagined place in {property.area}.</h2>
            <p>{property.locationDescription}</p>
            <p className={styles.smallNote}>
              No real address or map is provided.
            </p>
          </section>
        </div>
        <aside className={styles.specPanel} aria-labelledby="spec-title">
          <p className={styles.eyebrow}>Concept at a glance</p>
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
            All specifications are invented for design testing. This is not an
            offer for sale.
          </p>
        </aside>
      </div>
      <div className={styles.detailReturn}>
        <p>Another way to imagine home.</p>
        <Link className={styles.button} href="/prototype/properties">
          Back to all concepts <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
