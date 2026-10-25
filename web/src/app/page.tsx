import Image from "next/image";
import { SiteFooter, SiteHeader } from "./_components/site-chrome";
import { GITHUB, LINKEDIN, WELE, X } from "./links";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <SiteHeader current="home" />

      <main className={`shell ${styles.main}`}>
        <div className={styles.intro}>
          <Image
            className={styles.portrait}
            src="/profile.jpg"
            alt="Nguyễn Văn Cao"
            width={400}
            height={400}
            priority
          />
          <div className={styles.introCopy}>
            <p className={styles.lead}>
              Still trying to become a real engineer.
            </p>

            <div className={styles.prose}>
              <p>
                I&apos;m a developer in Vietnam. I work at{" "}
                <a
                  href="https://rework.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Rework
                </a>
                , and most of the rest of my time goes into products I build
                myself — usually alone, usually late.
              </p>
              <p>
                Nine years and fifty-odd repositories in, I still describe myself
                as someone trying to become a real engineer. That&apos;s the honest
                version.
              </p>
            </div>
          </div>
        </div>

        <section className={styles.section} aria-labelledby="wele-heading">
          <h2 id="wele-heading" className={styles.sectionTitle}>
            WELE
          </h2>
          <div className={styles.prose}>
            <p>
              The one thing I can talk about openly. WELE teaches English listening
              through dictation. You play real audio — podcasts, interviews, the
              news — type what you hear, and find out precisely which words your ear
              keeps missing. I built it for Vietnamese learners who couldn&apos;t pay
              for a course. It has been free for ten years, and it stays free.
            </p>
          </div>
          <ul className={styles.stats}>
            <li>
              <strong>10,000+</strong> learners
            </li>
            <li>
              <strong>200,000+</strong> dictation submissions
            </li>
            <li>
              <strong>10 years</strong> online, free the entire time
            </li>
          </ul>
          <div className={styles.links}>
            <a href={WELE} target="_blank" rel="noopener noreferrer">
              wele-learn.com
            </a>
            <a
              href="https://apps.apple.com/vn/app/wele-learn/id6449467539"
              target="_blank"
              rel="noopener noreferrer"
            >
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.welelearnapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Play
            </a>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="oss-heading">
          <h2 id="oss-heading" className={styles.sectionTitle}>
            Open source
          </h2>
          <div className={styles.prose}>
            <p>
              Four out of every five commits still land in private repos. The public
              ones that found an audience:
            </p>
          </div>
          <ul className={styles.projectList}>
            <li>
              <strong>
                <a
                  href="https://github.com/caobo171/node-zklib"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  node-zklib
                </a>
              </strong>{" "}
              — talk to ZKTeco biometric attendance terminals from Node.
            </li>
            <li>
              <strong>
                <a
                  href="https://github.com/caobo171/easy-devtools"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  easy-devtools
                </a>
              </strong>{" "}
              — small tools I reach for every day, in one place.
            </li>
            <li>
              <strong>
                <a
                  href="https://github.com/caobo171/rework-mcp-server"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  rework-mcp-server
                </a>
              </strong>{" "}
              — MCP server that gives agents access to Rework.
            </li>
            <li>
              <strong>
                <a
                  href="https://github.com/caobo171/jqueryflow"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  jqueryflow
                </a>
              </strong>{" "}
              — react-flow, rebuilt for codebases that still run jQuery.
            </li>
            <li>
              <strong>
                <a
                  href="https://github.com/caobo171/auto-transcript"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  auto-transcript
                </a>
              </strong>{" "}
              — turn an audio file into a transcript.
            </li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="contact-heading">
          <h2 id="contact-heading" className={styles.sectionTitle}>
            Elsewhere
          </h2>
          <div className={styles.links}>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={X} target="_blank" rel="noopener noreferrer">
              X
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
