import styles from "../prototype.module.css";

export default function PrototypeLoading() {
  return (
    <div className={styles.empty} role="status" aria-live="polite">
      <p className={styles.eyebrow}>Fictional property collection</p>
      <p className={styles.loadingTitle}>Preparing your next point of view.</p>
      <p>Loading demonstration concepts...</p>
      <div className={styles.loadingFrames} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
