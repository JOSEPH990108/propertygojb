"use client";

import Link from "next/link";
import styles from "../property-listings.module.css";

export default function PropertiesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className={styles.empty} aria-labelledby="properties-error-title">
      <p className={styles.eyebrow}>Property concepts / Something went wrong</p>
      <h1 id="properties-error-title">The demo collection could not load.</h1>
      <p>Please try again, or return to the PropertyGOJB homepage.</p>
      <div className={styles.errorActions}>
        <button className={styles.button} type="button" onClick={reset}>
          Try again
        </button>
        <Link className={styles.clear} href="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
