import Link from "next/link";
import styles from "../property-listings.module.css";

export default function PropertyNotFound() {
  return (
    <section className={styles.empty}>
      <p className={styles.eyebrow}>Fictional collection / Not found</p>
      <h1>This concept is not in the collection.</h1>
      <p>
        The requested page is not part of this fictional demo. No real property
        listing is represented.
      </p>
      <Link className={styles.button} href="/properties">
        Back to the demo collection
      </Link>
    </section>
  );
}
