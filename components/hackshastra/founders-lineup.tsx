import { hackshastra, hackshastraFounders } from "@/data/hackshastra";
import BrandImage from "./brand-image";
import BrandLink from "./brand-link";
import styles from "./founders-lineup.module.css";

export default function FoundersLineup() {
  return (
    <div className={styles.lineup}>
      <div className={styles.topline}>
        <p className={styles.kicker}>J · I · T · S · U</p>
        <span className={styles.edition}>Five minds. One beginning.</span>
      </div>

      <div className={styles.header}>
        <div>
          <h2 id="hs-founders-title" className={styles.heading}>
            The founding <br />
            <span>collective.</span>
          </h2>
        </div>
        <p className={styles.intro}>
          Five people behind the beginning. A much wider community carrying it
          forward.
        </p>
      </div>

      <div className={styles.stage} data-hackshastra-image>
        <div className={styles.portraits}>
          {hackshastraFounders.map((founder, index) => (
            <figure
              key={founder.name}
              className={styles.founder}
              data-centre={founder.isTanmay ? "true" : undefined}
            >
              <div className={styles.portrait}>
                <span className={styles.index} aria-hidden="true">
                  0{index + 1}
                </span>
                <span className={styles.initial} aria-hidden="true">
                  {founder.initial}
                </span>
                {founder.isTanmay && (
                  <div className={styles.note} aria-hidden="true">
                    <span>That’s me</span>
                    <svg
                      className={styles.arrow}
                      viewBox="0 0 90 62"
                      fill="none"
                    >
                      <path
                        d="M76 8C57 1 30 2 19 18C12 28 13 39 19 51M10 43L19 51L24 39"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <div className={styles.imagePlane}>
                  <BrandImage
                    src={founder.image}
                    alt={founder.name}
                    sizes="(max-width: 767px) 24vw, (max-width: 1552px) 20vw, 300px"
                    className="object-contain object-bottom"
                  />
                </div>
              </div>
              <figcaption className={styles.caption}>
                <span className={styles.firstName}>{founder.firstName}</span>
                <span className={styles.lastName}>{founder.lastName}</span>
                {founder.isTanmay && (
                  <span className="sr-only"> — that’s me, Tanmay</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerNote}>
          <span className={styles.spark} aria-hidden="true">
            ✳
          </span>
          <span>
            Different minds.
            <br />A shared beginning.
          </span>
        </p>
        <BrandLink href={hackshastra.about} className={styles.communityLink}>
          Meet the community
        </BrandLink>
      </div>
    </div>
  );
}
