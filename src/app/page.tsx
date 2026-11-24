import type { CSSProperties } from "react";
import Link from "next/link";
import homepage from "../content/homepage.json";
import theme from "../content/theme.json";
import {
  properties,
  propertyAreas,
  propertyTypes,
} from "../prototypes/properties/fixtures";
import { createDemoInquiryHref } from "../prototypes/properties/inquiries";
import { PropertyCard } from "../prototypes/properties/property-card";

const homepageEditorialCopy = {
  heroEyebrow: "A considered start to your Johor property search",
  indexCaption:
    "A place is more than its walls. Explore the details that shape a life.",
  approachEyebrow: "The details that make a place",
  approachTitle: "Notice what matters day to day.",
  statusEyebrow: "A note on availability",
  statusTitle: "No verified property listings are published yet.",
  availabilityDescription:
    "This site currently shows fictional demo concepts only. No prices or availability are provided.",
};

type HomepageStyle = CSSProperties &
  Record<
    | "--home-background"
    | "--home-foreground"
    | "--home-accent"
    | "--home-border"
    | "--home-gap"
    | "--home-radius"
    | "--home-width",
    string
  >;

export default function Home() {
  const style: HomepageStyle = {
    "--home-background": theme.background,
    "--home-foreground": theme.foreground,
    "--home-accent": theme.accent,
    "--home-border": theme.border,
    "--home-gap": `${theme.sectionGap}px`,
    "--home-radius": `${theme.cardRadius}px`,
    "--home-width": `${theme.contentWidth}px`,
  };
  const features = [
    {
      id: "01",
      title: homepage.feature1Title,
      description: homepage.feature1Description,
    },
    {
      id: "02",
      title: homepage.feature2Title,
      description: homepage.feature2Description,
    },
    {
      id: "03",
      title: homepage.feature3Title,
      description: homepage.feature3Description,
    },
  ];
  const featuredProperties = properties.slice(0, 3);

  return (
    <div className="homepage" style={style}>
      <a className="home-skip" href="#main-content">
        Skip to content
      </a>
      <header className="home-header home-container">
        <a className="home-brand" href="/" aria-label="PropertyGOJB home">
          <span className="home-brand-mark" aria-hidden="true">
            PG
          </span>
          <span className="home-brand-name">
            PropertyGOJB<span aria-hidden="true">.</span>
          </span>
        </a>
        <p className="home-location">JOHOR BAHRU&nbsp; /&nbsp; MY</p>
        <nav className="home-nav" aria-label="Main navigation">
          <Link href="/properties">Explore properties</Link>
          <a href="#areas">Johor areas</a>
          <a href="#about-website">About this demo</a>
        </nav>
      </header>

      <main id="main-content" className="home-container">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="home-eyebrow">{homepageEditorialCopy.heroEyebrow}</p>
            <h1 id="home-title">{homepage.headline}</h1>
            <p className="home-intro">{homepage.subheading}</p>
            <div className="home-actions">
              <Link
                className="home-button home-button-primary"
                href="/properties"
              >
                {homepage.primaryCtaLabel}
                <span aria-hidden="true">↗</span>
              </Link>
              <a className="home-text-link" href="#areas">
                {homepage.secondaryCtaLabel}
              </a>
            </div>
            <form
              className="home-search"
              action="/properties"
              method="get"
              aria-label="Search demo property concepts"
            >
              <div className="home-search-field">
                <label htmlFor="home-search-query">
                  What are you looking for?
                </label>
                <input
                  id="home-search-query"
                  name="q"
                  type="search"
                  maxLength={100}
                  placeholder="Name, area or home type"
                />
              </div>
              <div className="home-search-field">
                <label htmlFor="home-property-type">Property type</label>
                <select id="home-property-type" name="type" defaultValue="">
                  <option value="">All property types</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="home-search-field">
                <label htmlFor="home-property-area">Johor area</label>
                <select id="home-property-area" name="area" defaultValue="">
                  <option value="">All areas</option>
                  {propertyAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
              <button className="home-button home-button-primary" type="submit">
                Search concepts <span aria-hidden="true">→</span>
              </button>
              <p className="home-search-note">
                Fictional demo content only. No real listings or verified
                prices.
              </p>
            </form>
          </div>

          <figure className="home-index">
            <div className="home-index-heading">
              <span>THE JOHOR BAHRU INDEX</span>
              <span>PLACE / FORM / LIFE</span>
            </div>
            <div className="home-index-art">
              <svg
                className="home-elevation"
                viewBox="0 0 640 400"
                role="img"
                aria-labelledby="elevation-title elevation-description"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title id="elevation-title">
                  An abstract architectural elevation
                </title>
                <desc id="elevation-description">
                  A geometric composition of building forms, an open frame, and
                  a warm circle against a quiet field.
                </desc>
                <defs>
                  <pattern
                    id="elevation-grid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M32 0H0V32"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity=".09"
                      strokeWidth="1"
                    />
                  </pattern>
                  <pattern
                    id="elevation-windows"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M1 1h14v18H1z"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity=".6"
                      strokeWidth="1"
                    />
                  </pattern>
                  <pattern
                    id="elevation-windows-light"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M1 1h14v18H1z"
                      fill="none"
                      stroke="var(--home-background)"
                      strokeOpacity=".6"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="640" height="400" fill="url(#elevation-grid)" />
                <circle cx="496" cy="96" r="48" fill="#c47b58" />
                <path
                  d="M64 320V128h144v192"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity=".5"
                  strokeWidth="1.5"
                />
                <path
                  d="M80 320V160h112v160"
                  fill="#d8ddd1"
                  stroke="currentColor"
                  strokeOpacity=".55"
                  strokeWidth="1.5"
                />
                <path d="M80 160h112v160H80z" fill="url(#elevation-windows)" />
                <path
                  d="M224 320V96h160v224z"
                  fill="var(--home-accent)"
                  stroke="currentColor"
                  strokeOpacity=".65"
                  strokeWidth="1.5"
                />
                <path
                  d="M240 120h128v176H240z"
                  fill="url(#elevation-windows-light)"
                  opacity=".8"
                />
                <path
                  d="M384 320V160h192v160z"
                  fill="#e7e5d9"
                  stroke="currentColor"
                  strokeOpacity=".6"
                  strokeWidth="1.5"
                />
                <path
                  d="M408 184h144v112H408z"
                  fill="url(#elevation-windows)"
                />
                <path
                  d="M48 320h544M64 336h528"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity=".7"
                  strokeWidth="1.5"
                />
                <path
                  d="M224 80h160M208 96h176M384 144h192"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity=".6"
                  strokeWidth="1"
                />
              </svg>
              <span className="home-index-coordinate home-index-coordinate-top">
                PG / 01
              </span>
              <span className="home-index-coordinate home-index-coordinate-bottom">
                A STUDY IN PLACE
              </span>
            </div>
            <figcaption className="home-index-caption">
              {homepageEditorialCopy.indexCaption}
            </figcaption>
          </figure>
        </section>

        <section
          id="featured"
          className="home-section"
          aria-labelledby="featured-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">A first look / Fictional concepts</p>
              <h2 id="featured-title">Ideas for a place of your own.</h2>
            </div>
            <Link className="home-section-link" href="/properties">
              Explore all demo concepts <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="home-property-grid">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.slug}
                property={property}
                hrefPrefix="/properties"
              />
            ))}
          </div>
        </section>

        <section
          id="property-types"
          className="home-section"
          aria-labelledby="types-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">Find your kind of space</p>
              <h2 id="types-title">Different ways to feel at home.</h2>
            </div>
            <p>These links explore fictional concepts, not available homes.</p>
          </div>
          <div className="home-category-grid">
            <article className="home-category">
              <p className="home-eyebrow">01 / Condominium</p>
              <h3>Consider a more connected pace.</h3>
              <p>Explore imagined vertical homes and their use of space.</p>
              <Link href="/properties?type=Condominium">
                Explore condo concepts <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="home-category">
              <p className="home-eyebrow">02 / Landed living</p>
              <h3>Room for a different rhythm.</h3>
              <p>Browse fictional terrace and detached-home concepts.</p>
              <Link href="/properties?q=home">
                Explore landed concepts <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="home-category">
              <p className="home-eyebrow">03 / New developments</p>
              <h3>Verified projects are still to come.</h3>
              <p>No real developments or project claims are published here.</p>
              <Link href="/properties">
                View demo concepts <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </section>

        <section
          id="areas"
          className="home-section"
          aria-labelledby="areas-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">Johor / Begin with a place</p>
              <h2 id="areas-title">Explore the region, one area at a time.</h2>
            </div>
            <p>
              Area names are broad inspiration, not verified property locations.
            </p>
          </div>
          <ul className="home-area-list">
            {propertyAreas.map((area, index) => (
              <li key={area}>
                <Link href={`/properties?area=${encodeURIComponent(area)}`}>
                  <span className="home-area-number">0{index + 1} / JOHOR</span>
                  <span>{area}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="our-approach"
          className="home-section home-approach"
          aria-labelledby="approach-title"
        >
          <div className="home-section-heading">
            <p className="home-eyebrow">
              {homepageEditorialCopy.approachEyebrow}
            </p>
            <h2 id="approach-title">{homepageEditorialCopy.approachTitle}</h2>
          </div>
          <ol className="home-features">
            {features.map((feature) => (
              <li key={feature.id} className="home-feature">
                <span className="home-step">{feature.id}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="about-website"
          className="home-status"
          aria-labelledby="status-title"
        >
          <p className="home-eyebrow">{homepageEditorialCopy.statusEyebrow}</p>
          <h2 id="status-title">{homepageEditorialCopy.statusTitle}</h2>
          <p>{homepageEditorialCopy.availabilityDescription}</p>
        </section>
        <section className="home-contact" aria-labelledby="contact-title">
          <div>
            <p className="home-eyebrow">Keep the conversation open</p>
            <h2 id="contact-title">Ask us about verified Johor listings.</h2>
            <p>
              Prepare a WhatsApp message. A PropertyGOJB number is not
              configured yet, so choose a recipient in WhatsApp before sending.
            </p>
          </div>
          <a
            className="home-button home-button-primary"
            href={createDemoInquiryHref()}
            target="_blank"
            rel="noreferrer"
          >
            Prepare a WhatsApp message <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="home-footer home-container">
        <a className="home-brand home-brand-footer" href="/">
          <span className="home-brand-mark" aria-hidden="true">
            PG
          </span>
          <span className="home-brand-name">
            PropertyGOJB<span aria-hidden="true">.</span>
          </span>
        </a>
        <p>Johor Bahru, Malaysia</p>
        <a href="#main-content">Back to top ↑</a>
      </footer>
    </div>
  );
}
