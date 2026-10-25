import Link from "next/link";
import { GITHUB, WELE } from "../links";
import styles from "./site-chrome.module.css";

type Page = "home" | "resume";

export function SiteHeader({ current }: { current?: Page }) {
  return (
    <header className={styles.siteHeader}>
      <div className={`shell ${styles.headerInner}`}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true" />
          Nguyễn Văn Cao
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <Link
            href="/resume"
            aria-current={current === "resume" ? "page" : undefined}
          >
            Resume
          </Link>
          <a href={WELE} target="_blank" rel="noopener noreferrer">
            WELE
          </a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div className="shell">
        <p>© {new Date().getFullYear()} Nguyễn Văn Cao</p>
      </div>
    </footer>
  );
}
