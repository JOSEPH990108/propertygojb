import Form from "next/form";
import Link from "next/link";
import {
  discoverProperties,
  parseDiscoveryQuery,
  sortOptions,
} from "../../../prototypes/properties/discovery";
import {
  properties,
  propertyAreas,
  propertyTypes,
} from "../../../prototypes/properties/fixtures";
import { PropertyArt } from "../../../prototypes/properties/property-art";
import { PropertyCard } from "../../../prototypes/properties/property-card";
import styles from "../../property-listings.module.css";

export default async function DiscoveryPage({
  searchParams,
}: PageProps<"/prototype/properties">) {
  const { filters, issues } = parseDiscoveryQuery(await searchParams);
  const results = discoverProperties(properties, filters);
  const formKey = `${filters.query}/${filters.type}/${filters.area}/${filters.sort}`;
  return (
    <>
      <section className={styles.hero} aria-labelledby="discovery-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>The Johor collection / Edition 01</p>
          <h1 id="discovery-title">
            Find a different
            <br />
            sense of home.
          </h1>
          <p className={styles.intro}>
            From a quiet courtyard to a planted terrace. Explore five imagined
            ways to live, with Johor as a starting point.
          </p>
          <a
            className={`${styles.button} ${styles.heroCta}`}
            href="#collection"
          >
            Explore the collection <span aria-hidden="true">↓</span>
          </a>
        </div>
        <figure className={styles.heroFigure}>
          <div className={styles.figureHeading}>
            <span>PLACE / FORM / LIFE</span>
            <span>PG / 01</span>
          </div>
          <PropertyArt property={properties[0]} view="courtyard" />
          <figcaption>
            <span>Canopy Court</span>
            <span>Fictional architectural artwork</span>
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
            <p className={styles.eyebrow}>Considered spaces</p>
            <h2 id="collection-title">A place for your point of view.</h2>
          </div>
          <p>
            Five fictional concepts.
            <br />A few thoughtful starting points.
          </p>
        </div>
        <div className={styles.filterBar}>
          <details key={formKey} className={styles.filterDisclosure}>
            <summary>
              Filter & sort{" "}
              <span className={styles.disclosureHint}>Type, area & order</span>
            </summary>
            <Form
              key={formKey}
              action="/prototype/properties"
              scroll={false}
              className={styles.filters}
              aria-label="Search and filter fictional properties"
            >
              <div className={styles.field}>
                <label htmlFor="prototype-property-search">
                  Search concepts
                </label>
                <input
                  id="prototype-property-search"
                  name="q"
                  type="search"
                  maxLength={100}
                  defaultValue={filters.query}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="property-type">Property type</label>
                <select
                  id="property-type"
                  name="type"
                  defaultValue={filters.type}
                >
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
                <select
                  id="property-area"
                  name="area"
                  defaultValue={filters.area}
                >
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
                <select
                  id="property-sort"
                  name="sort"
                  defaultValue={filters.sort}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className={styles.button} type="submit">
                Apply selection <span aria-hidden="true">→</span>
              </button>
            </Form>
          </details>
          <Link
            className={styles.clear}
            href="/prototype/properties"
            scroll={false}
          >
            Clear filters & sort
          </Link>
        </div>
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
            {filters.query || filters.type || filters.area
              ? " matching your selection"
              : " to explore"}
          </p>
          <p>Invented specifications / No pricing</p>
        </div>
        {results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((property) => (
              <PropertyCard key={property.slug} property={property} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.eyebrow}>Room to reconsider</p>
            <h3>No concepts match this combination.</h3>
            <p>
              Try another area or property type, or return to all five fictional
              examples.
            </p>
            <Link
              className={styles.button}
              href="/prototype/properties"
              scroll={false}
            >
              Explore all concepts <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>
      <aside className={styles.endNote}>
        <span className={styles.eyebrow}>The next chapter</span>
        <p>
          This is a design exploration, not a property marketplace. Enquiries,
          viewings and bookings are not available.
        </p>
      </aside>
    </>
  );
}
