import type { Metadata } from "next";
import { PrintButton } from "../_components/print-button";
import { SiteFooter, SiteHeader } from "../_components/site-chrome";
import { EMAIL, GITHUB, LINKEDIN, WELE } from "../links";
import styles from "./resume.module.css";

export const metadata: Metadata = {
  title: "Resume — Nguyễn Văn Cao",
  description:
    "Senior full-stack engineer in Hanoi. Lead engineer on Rework's platform, co-founder of WELE-Learn.",
  openGraph: {
    title: "Resume — Nguyễn Văn Cao",
    description:
      "Senior full-stack engineer in Hanoi. Developer at Go1, former lead engineer on Rework's platform, co-founder of WELE-Learn.",
    type: "profile",
  },
};

export default function ResumePage() {
  return (
    <>
      <SiteHeader current="resume" />

      <main className={`shell ${styles.main}`}>
        <header className={styles.masthead}>
          <h1 className={styles.name}>Nguyễn Văn Cao</h1>
          <p className={styles.role}>Senior Full-Stack Engineer</p>
          <ul className={styles.contact}>
            <li>
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </li>
            <li>Hanoi Capital Region</li>
            <li>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                linkedin.com/in/kaonguyen1701
              </a>
            </li>
            <li>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer">
                github.com/caobo171
              </a>
            </li>
          </ul>
          <div className={styles.actions}>
            <PrintButton className={styles.printButton} />
          </div>
        </header>

        <section className={styles.section} aria-labelledby="summary-heading">
          <h2 id="summary-heading" className={styles.sectionTitle}>
            Summary
          </h2>
          <p className={styles.summary}>
            Senior full-stack engineer (6+ yrs) shipping production multi-tenant
            SaaS and AI features end-to-end. Currently a developer at Go1
            (Australia) on Immersive Simulations, an AI avatar roleplay
            product for compliance training. Previously lead engineer behind
            Rework&apos;s platform ($0 → ~$500K ARR across 4 years; lead on Rework Agent, the
            platform&apos;s user-facing AI agent builder) and co-founder of
            WELE-Learn — a podcast-based English-learning platform serving
            50,000 registered learners across web, iOS, and Android.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="experience-heading">
          <h2 id="experience-heading" className={styles.sectionTitle}>
            Experience
          </h2>

          <div className={styles.entry}>
            <div className={styles.entryHead}>
              <h3 className={styles.roleLine}>
                Developer <span className={styles.org}>· Go1 (Australia)</span>
              </h3>
              <span className={styles.meta}>Sep 2026 – Present</span>
            </div>
            <p className={styles.sub}>Remote</p>
            <ul className={styles.bullets}>
              <li>
                <strong>
                  Building Go1 Immersive Simulations, an AI roleplay product for
                  compliance training.
                </strong>{" "}
                Learners talk to AI avatars by voice or text in realistic
                workplace scenarios and get behavior-based feedback. Assignments sync to enterprise
                LMSs including Workday, SAP SuccessFactors, Oracle, and Litmos.
              </li>
            </ul>
          </div>

          <div className={styles.entry}>
            <div className={styles.entryHead}>
              <h3 className={styles.roleLine}>
                Lead Software Engineer{" "}
                <span className={styles.org}>· Rework.com (Base Global)</span>
              </h3>
              <span className={styles.meta}>Jun 2022 – Aug 2026</span>
            </div>
            <p className={styles.sub}>Hanoi</p>
            <ul className={styles.bullets}>
              <li>
                <strong>Built the platform&apos;s foundational primitives.</strong>{" "}
                Joined pre-product with no customers and architected the
                block/form editors, Excel I/O pipeline, dynamic-table datasets
                engine, scheduler, and message queue inside the in-house PHP
                framework — informed by deep study of n8n, Teable, Affine, and
                NocoDB. These primitives became{" "}
                <strong>the substrate for all 8 subsequent Rework products</strong>.
              </li>
              <li>
                <strong>
                  Brought Rework&apos;s first revenue product to market.
                </strong>{" "}
                Led the Work Ops suite — Projects, Workflows, Automation —
                including a visual node-based automation engine with branches,
                loops, JS injection, and delayed execution, plus a custom-field
                type system, reporting framework with formulas, and Gantt/Kanban
                views.{" "}
                <strong>
                  Drove Work Ops to 50% active rate and underpinned platform
                  growth from $0 to ~$500K ARR across 100 customers
                </strong>{" "}
                in the Philippines, Malaysia, Vietnam, Australia, and South
                Africa.
              </li>
              <li>
                <strong>
                  Shipped Rework Agent — a product that lets users build their
                  own AI agents.
                </strong>{" "}
                Researched and synthesized patterns from CrewAI, LangChain,
                Google ADK, and Dify into a Rework-native agent builder;
                designed the orchestration model, tool-calling interface, and
                execution runtime so{" "}
                <strong>non-engineers can compose agents</strong> against the
                platform&apos;s existing data and automation primitives.{" "}
                <strong>
                  Opened the platform&apos;s first user-facing AI surface.
                </strong>
              </li>
              <li>
                <strong>
                  Became the platform&apos;s security reviewer and knowledge
                  keeper.
                </strong>{" "}
                Authored 2 formal platform security reviews covering{" "}
                <strong>130+ files and 55+ findings</strong> (hardcoded keys,
                race conditions, multi-tenant isolation gaps, timing attacks);
                wrote the engineering documentation playbook and built a 7-phase
                platform-mastery curriculum.{" "}
                <strong>
                  Established the gatekeeping process for new code and the
                  standard onboarding path for new engineers.
                </strong>
              </li>
            </ul>
          </div>

          <div className={styles.entry}>
            <div className={styles.entryHead}>
              <h3 className={styles.roleLine}>
                Software Engineer → Senior{" "}
                <span className={styles.org}>· Base.vn</span>
              </h3>
              <span className={styles.meta}>2019 – 2022</span>
            </div>
            <p className={styles.sub}>Hanoi</p>
            <ul className={styles.bullets}>
              <li>
                <strong>Owned Vietnam&apos;s #1 SaaS revenue line.</strong> Grew
                from mobile developer to senior full-stack, taking ownership of
                Base Work+ — the company&apos;s most valuable package,{" "}
                <strong>contributing 70–80% of annual revenue</strong>. Built
                Base Process (an N8N-like cross-app workflow connector inside
                the Base Platform) from scratch and shipped Base Overtime from
                concept to launch.{" "}
                <strong>
                  Sustained the company&apos;s flagship revenue line
                </strong>{" "}
                and drafted the architectural patterns I&apos;d later ship at
                Rework.
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="projects-heading">
          <h2 id="projects-heading" className={styles.sectionTitle}>
            Projects
          </h2>

          <div className={styles.entry}>
            <div className={styles.entryHead}>
              <h3 className={styles.roleLine}>
                WELE-Learn.com{" "}
                <span className={styles.org}>
                  · Podcast-based English-learning platform
                </span>
              </h3>
              <span className={styles.meta}>Jan 2020 – Present</span>
            </div>
            <p className={styles.sub}>
              <a href={WELE} target="_blank" rel="noopener noreferrer">
                wele-learn.com
              </a>
            </p>
            <ul className={styles.bullets}>
              <li>
                <strong>Built and run a multi-language SaaS end-to-end.</strong>{" "}
                Shipped WELE from schema up — TypeScript/Express backend,
                Next.js frontend, MySQL, Stripe + LemonSqueezy payments,
                transcription engine, coin economy, and 7 language variants for
                Vietnamese, Japanese, German, French, and others.{" "}
                <strong>
                  Grew to 50,000 registered users and 500 daily active learners.
                </strong>
              </li>
              <li>
                <strong>
                  Shipped pronunciation assessment with Facebook wav2vec2.
                </strong>{" "}
                Integrated the wav2vec2 speech model to score learner
                pronunciation phoneme-by-phoneme against native reference audio,
                surfacing per-syllable feedback inside the transcription flow —{" "}
                <strong>
                  turning passive listening into active speaking practice
                </strong>
                .
              </li>
              <li>
                <strong>Launched iOS + Android from scratch (2025).</strong>{" "}
                Built the Expo + React Native app — global player engine,
                offline caching, gamification, deep links, auto-generated SVG
                icon system, and home-screen streak widgets in 8 locales (iOS
                WidgetKit + Android).{" "}
                <strong>
                  Shipped as a true cross-platform product on both stores.
                </strong>
              </li>
              <li>
                <strong>Turned WELE into a production SaaS (2026).</strong>{" "}
                Consolidated three apps into a unified monorepo; shipped a
                Course/teacher product, FSRS spaced repetition, an AI
                podcast-automation pipeline (Gemini + Imagen + ffmpeg), and a
                platform-wide performance sprint (Redis-cached streaks,
                parallelized queries, hot-path indexing).{" "}
                <strong>
                  Sub-100ms response times on hot paths; content production
                  reduced from hours to minutes.
                </strong>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="education-heading">
          <h2 id="education-heading" className={styles.sectionTitle}>
            Education
          </h2>
          <div className={styles.entry}>
            <div className={styles.entryHead}>
              <h3 className={styles.roleLine}>
                Hanoi University of Science and Technology
              </h3>
              <span className={styles.meta}>Aug 2018 – Feb 2023</span>
            </div>
            <p className={styles.sub}>Master&apos;s degree, Computer Science</p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="skills-heading">
          <h2 id="skills-heading" className={styles.sectionTitle}>
            Skills
          </h2>
          <dl className={styles.skills}>
            <div>
              <dt>Technical</dt>
              <dd>
                Multi-tenant SaaS architecture · PHP · TypeScript · Next.js ·
                React Native (Expo) · MySQL · Redis · Socket.io · AI product dev
                (Gemini, Imagen, wav2vec2) · Conversational AI (voice and text
                avatars) · Agent orchestration (LangChain, CrewAI, Google ADK,
                Dify) · Automation engines · Enterprise LMS integration
                (Workday, SAP SuccessFactors, Oracle, Litmos) · iOS/Android ·
                Security review · System design
              </dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>Vietnamese (native) · English (professional)</dd>
            </div>
          </dl>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
