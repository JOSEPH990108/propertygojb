import styles from "../property-listings.module.css";

export default function PropertiesLoading() {
  return (
    <div className={styles.empty} role="status" aria-live="polite">
      <p className={styles.eyebrow}>Fictional property collection</p>
      <h1 className={styles.loadingTitle}>Preparing the demo collection.</h1>
      <p>Loading fictional concepts...</p>
      <div className={styles.loadingFrames} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
