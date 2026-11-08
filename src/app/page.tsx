import type { CSSProperties } from "react";
import homepage from "../content/homepage.json";
import theme from "../content/theme.json";

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
          <a href="#our-approach">Our point of view</a>
          <a href="#about-website">Availability</a>
        </nav>
      </header>

      <main id="main-content" className="home-container">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="home-eyebrow">{homepage.heroEyebrow}</p>
            <h1 id="home-title">{homepage.headline}</h1>
            <p className="home-intro">{homepage.subheading}</p>
            <div className="home-actions">
              <a
                className="home-button home-button-primary"
                href="#our-approach"
              >
                {homepage.primaryCtaLabel}
                <span aria-hidden="true">↗</span>
              </a>
              <a className="home-text-link" href="#about-website">
                {homepage.secondaryCtaLabel}
              </a>
            </div>
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
              {homepage.indexCaption}
            </figcaption>
          </figure>
        </section>

        <section
          id="our-approach"
          className="home-section home-approach"
          aria-labelledby="approach-title"
        >
          <div className="home-section-heading">
            <p className="home-eyebrow">{homepage.approachEyebrow}</p>
            <h2 id="approach-title">{homepage.approachTitle}</h2>
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
          <p className="home-eyebrow">{homepage.statusEyebrow}</p>
          <h2 id="status-title">{homepage.statusTitle}</h2>
          <p>{homepage.availabilityDescription}</p>
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
