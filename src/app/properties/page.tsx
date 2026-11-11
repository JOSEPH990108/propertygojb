import type { Metadata } from "next";
import Link from "next/link";
import {
  discoverProperties,
  parseDiscoveryQuery,
  sortOptions,
} from "../../prototypes/properties/discovery";
import {
  properties,
  propertyAreas,
  propertyTypes,
} from "../../prototypes/properties/fixtures";
import { PropertyArt } from "../../prototypes/properties/property-art";
import { PropertyCard } from "../../prototypes/properties/property-card";
import styles from "../property-listings.module.css";

export const metadata: Metadata = {
  title: "Explore Johor property concepts",
  description:
    "Search fictional property concepts inspired by Johor. No real listings, verified prices or availability are currently published.",
};

export default async function PropertiesPage({
  searchParams,
}: PageProps<"/properties">) {
  const { filters, issues } = parseDiscoveryQuery(await searchParams);
  const results = discoverProperties(properties, filters);
  const hasSelection =
    Boolean(filters.query || filters.type || filters.area) ||
    filters.sort !== "featured";

  return (
    <>
      <section className={styles.hero} aria-labelledby="discovery-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Johor / Home concepts / Demo collection
          </p>
          <h1 id="discovery-title">
            Find a different
            <br />
            sense of home.
          </h1>
          <p className={styles.intro}>
            Search a small collection of fictional concepts inspired by Johor
            neighbourhoods. Every detail is illustrative, not a real property
            listing.
          </p>
        </div>
        <figure className={styles.heroFigure}>
          <div className={styles.figureHeading}>
            <span>PLACE / FORM / LIFE</span>
            <span>PG / 01</span>
          </div>
          <PropertyArt property={properties[0]} />
          <figcaption>
            <span>Canopy Court / fictional concept</span>
            <span>Original vector artwork</span>
          </figcaption>
        </figure>
      </section>

      <section
        id="collection"
        className={styles.collection}
        aria-labelledby="collection-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Search and compare</p>
            <h2 id="collection-title">Explore the demo collection.</h2>
          </div>
          <p>No real listings or verified pricing are available yet.</p>
        </div>

        <form
          action="/properties"
          method="get"
          className={styles.filters}
          aria-label="Search and filter fictional property concepts"
        >
          <div className={styles.field}>
            <label htmlFor="property-search">Search concepts</label>
            <input
              id="property-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="Name, area or home type"
              defaultValue={filters.query}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="property-type">Property type</label>
            <select id="property-type" name="type" defaultValue={filters.type}>
              <option value="">All property types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="property-area">Johor area</label>
            <select id="property-area" name="area" defaultValue={filters.area}>
              <option value="">All areas</option>
              {propertyAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="property-sort">Sort by</label>
            <select id="property-sort" name="sort" defaultValue={filters.sort}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.button} type="submit">
            Search concepts <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className={styles.appliedSelection} aria-label="Applied selection">
          <span>Showing:</span> {filters.query || "All concepts"} /{" "}
          {filters.type || "All property types"} / {filters.area || "All areas"}{" "}
          / {sortOptions.find((option) => option.value === filters.sort)?.label}
        </p>
        {issues.length > 0 && (
          <div className={styles.validation} role="alert">
            <p>Please review your selection.</p>
            <ul>
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        <div className={styles.resultBar} role="status" aria-live="polite">
          <p>
            {results.length} fictional{" "}
            {results.length === 1 ? "concept" : "concepts"}
            {hasSelection ? " matching your selection" : " to explore"}
          </p>
          <p>Illustrative details / No verified prices</p>
        </div>
        {results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((property) => (
              <PropertyCard
                key={property.slug}
                property={property}
                hrefPrefix="/properties"
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.eyebrow}>Room to reconsider</p>
            <h2>No concepts match this search.</h2>
            <p>
              Try a different area, property type or search phrase, or return to
              the full demo collection.
            </p>
            <Link className={styles.button} href="/properties">
              Explore all demo concepts <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>
      <aside className={styles.endNote}>
        <span className={styles.eyebrow}>A note on this collection</span>
        <p>
          These fictional concepts are for design demonstration only. Names,
          specifications and artwork do not represent properties for sale.
        </p>
      </aside>
    </>
  );
}
