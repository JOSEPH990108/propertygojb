import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import theme from "../../../content/theme.json";
import { prototypeNotice } from "../../../prototypes/properties/fixtures";
import styles from "./prototype.module.css";

export const metadata: Metadata = {
  title: "Fictional property discovery | PropertyGOJB prototype",
  description:
    "Explore five invented Johor-area property concepts. Demonstration content only, not real listings.",
  robots: { index: false, follow: false },
};

export default function PrototypeLayout({
  children,
}: LayoutProps<"/prototype/properties">) {
  const style: CSSProperties & Record<string, string> = {
    "--prototype-canvas": theme.background,
    "--prototype-ink": theme.foreground,
    "--prototype-accent": theme.accent,
    "--prototype-border": theme.border,
    "--prototype-radius": `${theme.cardRadius}px`,
    "--prototype-width": "1280px",
  };
  return (
    <div className={styles.prototype} style={style}>
      <a className={styles.skip} href="#prototype-main">
        Skip to content
      </a>
      <div className={styles.notice}>
        Design prototype <span>Fictional concepts. Not real listings.</span>
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
        <nav aria-label="Prototype navigation">
          <Link href="/prototype/properties">The collection</Link>
          <Link href="/">
            Main website <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>
      <main id="prototype-main" className={styles.container}>
        {children}
      </main>
      <footer className={`${styles.container} ${styles.footer}`}>
        <div>
          <p className={styles.eyebrow}>A study in place, not an offer</p>
          <p>{prototypeNotice}</p>
        </div>
        <Link href="/">
          Return to the main website <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </div>
  );
}
