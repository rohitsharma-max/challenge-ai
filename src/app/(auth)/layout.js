// src/app/(auth)/layout.js
import styles from './auth.module.css';

export default function AuthLayout({ children }) {
  return (
    <div className={styles.authLayout}>
      <div className={styles.orb} />
      <div className={styles.orb2} />
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⚡</span>
          <span className={styles.brandName}>DailyAI</span>
        </div>
        {children}
      </div>
    </div>
  );
}
