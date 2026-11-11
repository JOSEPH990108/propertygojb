import Link from "next/link";
import { formatFloorArea, type SyntheticProperty } from "./fixtures";
import { PropertyArt } from "./property-art";
import styles from "../../app/property-listings.module.css";

export function PropertyCard({
  property,
  hrefPrefix = "/prototype/properties",
}: {
  property: SyntheticProperty;
  hrefPrefix?: string;
}) {
  return (
    <article className={styles.card}>
      <Link className={styles.cardLink} href={`${hrefPrefix}/${property.slug}`}>
        <div className={styles.cardMedia}>
          <PropertyArt property={property} />
          <span className={styles.mediaLabel}>
            Fictional architectural artwork
          </span>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardLocation}>{property.area}</p>
          <h3>
            {property.name}
            <span aria-hidden="true">↗</span>
          </h3>
          <p className={styles.cardType}>{property.type}</p>
          <p className={styles.cardDescription}>{property.introduction}</p>
          <p className={styles.smallNote}>Illustrative specifications only</p>
          <p className={styles.cardSpecs}>
            <span>
              <strong>{property.bedrooms}</strong> bedrooms
            </span>
            <span>
              <strong>{property.bathrooms}</strong> bathrooms
            </span>
            <span
              aria-label={`Floor area: ${formatFloorArea(property.floorAreaSqFt)}`}
            >
              {formatFloorArea(property.floorAreaSqFt)}
            </span>
          </p>
          <span className={styles.cardFoot}>
            Explore demo concept <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
