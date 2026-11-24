import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import theme from "../../content/theme.json";
import { prototypeNotice } from "../../prototypes/properties/fixtures";
import styles from "../property-listings.module.css";

export const metadata: Metadata = {
  title: {
    default: "Johor property concepts | PropertyGOJB",
    template: "%s | PropertyGOJB",
  },
  description:
    "Explore fictional Johor property concepts for demonstration only. These are not real listings and include no verified pricing or availability.",
  robots: { index: false, follow: false },
};

export default function PropertiesLayout({
  children,
}: LayoutProps<"/properties">) {
  const style: CSSProperties & Record<string, string> = {
    "--prototype-canvas": theme.background,
    "--prototype-ink": theme.foreground,
    "--prototype-accent": theme.accent,
    "--prototype-border": theme.border,
    "--prototype-radius": `${theme.cardRadius}px`,
    "--prototype-width": "1280px",
  };

  return (
    <div className={styles.propertyExperience} style={style}>
      <a className={styles.skip} href="#property-main">
        Skip to content
      </a>
      <div className={styles.notice}>
        Demo experience <span>Fictional concepts. Not real listings.</span>
      </div>
      <header className={`${styles.container} ${styles.header}`}>
        <Link className={styles.brand} href="/" aria-label="PropertyGOJB home">
          <span className={styles.brandMark} aria-hidden="true">
            PG
          </span>
          <span>
            PropertyGOJB<span className={styles.brandDot}>.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/properties">Explore concepts</Link>
        </nav>
      </header>
      <main id="property-main" className={styles.container}>
        {children}
      </main>
      <footer className={`${styles.container} ${styles.footer}`}>
        <div>
          <p className={styles.eyebrow}>
            A demonstration, not an offer for sale
          </p>
          <p>{prototypeNotice}</p>
        </div>
        <Link href="/">Return to PropertyGOJB home</Link>
      </footer>
    </div>
  );
}
