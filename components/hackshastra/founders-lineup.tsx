import { hackshastra, hackshastraFounders } from "@/data/hackshastra";
import BrandImage from "./brand-image";
import BrandLink from "./brand-link";
import styles from "./founders-lineup.module.css";

export default function FoundersLineup() {
  return (
    <div className={styles.lineup}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-10">
        <div className="min-w-0">
          <p className="hs-mono mb-3 text-[var(--hs-red)]">J · I · T · S · U</p>
          <h2 id="hs-founders-title" className={styles.heading}>
            The founding collective.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-[1.8] text-[var(--hs-dim)]">
          Five people behind the beginning. A much wider community carrying it
          forward.
        </p>
      </div>

      <div className={styles.stage} data-hackshastra-image>
        <div className={styles.annotation}>
          <div className={styles.note}>
            <span>That’s me</span>
            <svg
              className={styles.arrow}
              viewBox="0 0 90 62"
              fill="none"
              aria-hidden="true"
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
        </div>

        <div className={styles.portraits}>
          {hackshastraFounders.map((founder) => (
            <figure
              key={founder.name}
              className={styles.founder}
              data-centre={founder.isTanmay ? "true" : undefined}
            >
              <div className={styles.portrait}>
                <span className={styles.initial} aria-hidden="true">
                  {founder.initial}
                </span>
                <div className={styles.imagePlane}>
                  <BrandImage
                    src={founder.image}
                    alt={founder.name}
                    sizes="(max-width: 639px) 21vw, (max-width: 1279px) 19vw, 240px"
                    className="object-contain object-bottom"
                  />
                </div>
              </div>
              <figcaption className={styles.caption}>
                <span className="block">{founder.firstName}</span>
                <span className="block">{founder.lastName}</span>
                {founder.isTanmay && (
                  <span className="sr-only"> — that’s me, Tanmay</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[var(--hs-line)] pt-4 sm:mt-8">
        <p className="hs-mono text-[var(--hs-dim)]">
          Different minds. A shared beginning.
        </p>
        <BrandLink href={hackshastra.about} className="text-sm">
          Meet the community
        </BrandLink>
      </div>
    </div>
  );
}
