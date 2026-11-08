import Link from "next/link";
import { formatFloorArea, type SyntheticProperty } from "./fixtures";
import { PropertyArt } from "./property-art";
import styles from "../../app/prototype/properties/prototype.module.css";

export function PropertyCard({ property }: { property: SyntheticProperty }) {
  return (
    <article className={styles.card}>
      <Link
        className={styles.cardLink}
        href={`/prototype/properties/${property.slug}`}
      >
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
            Explore the concept <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
