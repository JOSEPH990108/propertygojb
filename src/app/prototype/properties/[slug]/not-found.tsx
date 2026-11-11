import Link from "next/link";
import styles from "../../../property-listings.module.css";

export default function ConceptNotFound() {
  return (
    <section className={styles.empty}>
      <p className={styles.eyebrow}>Fictional collection / Not found</p>
      <h1>This concept is not in the collection.</h1>
      <p>
        Explore the five fictional examples instead. No real listings are
        available here.
      </p>
      <Link className={styles.button} href="/prototype/properties">
        Back to the collection
      </Link>
    </section>
  );
}
