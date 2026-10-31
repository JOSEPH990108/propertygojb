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
          PropertyGOJB<span aria-hidden="true">.</span>
        </a>
        <span className="home-location">Johor Bahru, Malaysia</span>
      </header>
      <main id="main-content" className="home-container">
        <section className="home-hero" aria-labelledby="home-title">
          <p className="home-eyebrow">Your next chapter starts here</p>
          <h1 id="home-title">{homepage.headline}</h1>
          <p className="home-intro">{homepage.subheading}</p>
          <div className="home-actions">
            <a className="home-button home-button-primary" href="#our-approach">
              {homepage.primaryCtaLabel}
            </a>
            <a className="home-button" href="#about-website">
              {homepage.secondaryCtaLabel}
            </a>
          </div>
        </section>
        <section
          id="our-approach"
          className="home-section"
          aria-labelledby="approach-title"
        >
          <p className="home-eyebrow">Made for the journey</p>
          <h2 id="approach-title">A place to begin, at your pace</h2>
          <ul className="home-features">
            {features.map((feature) => (
              <li key={feature.id} className="home-card">
                <span className="home-step" aria-hidden="true">
                  {feature.id}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section
          id="about-website"
          className="home-about home-section"
          aria-labelledby="about-title"
        >
          <h2 id="about-title">A foundation for what comes next</h2>
          <p>
            This is an informational website foundation. Property listings,
            accounts, enquiries and bookings are not available here yet.
          </p>
        </section>
      </main>
      <footer className="home-footer home-container">
        <p>PropertyGOJB &mdash; Johor Bahru, Malaysia</p>
        <a href="#main-content">Back to top</a>
      </footer>
    </div>
  );
}
