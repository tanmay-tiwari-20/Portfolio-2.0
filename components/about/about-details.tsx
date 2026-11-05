import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import type {
  AboutMoment,
  AboutPageContent,
  Experience,
  Hackathon,
  ImageAsset,
} from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { hackathonMoments } from "@/data/hackathon-moments";
import AboutPracticeStory from "./about-practice-story";
import styles from "./about-details.module.css";

type ProjectImage = {
  src: string;
  alt: string;
  title?: string;
  fit?: "contain" | "cover";
};

type AboutDetailsProps = {
  content: AboutPageContent;
  builders: number;
  location: string;
  moments: AboutMoment[];
  experiences: Experience[];
  hackathons: Hackathon[];
  practiceImage?: ImageAsset;
  practiceImage2?: ImageAsset;
  workImage?: ProjectImage;
  craftImage?: ProjectImage;
};

export default function AboutDetails({
  content,
  builders,
  location,
  moments,
  experiences,
  hackathons,
  practiceImage,
  practiceImage2,
  workImage,
  craftImage,
}: AboutDetailsProps) {
  return (
    <div className={styles.details} data-about-details>
      <AboutPracticeStory
        content={content.practice}
        builders={builders}
        workImage={workImage}
        craftImage={craftImage}
        practiceImage={
          practiceImage
            ? {
                src: practiceImage.url,
                alt: practiceImage.alt,
                fit: practiceImage.fit,
              }
            : undefined
        }
        practiceImage2={
          practiceImage2
            ? {
                src: practiceImage2.url,
                alt: practiceImage2.alt,
                fit: practiceImage2.fit,
              }
            : undefined
        }
        communityImage={{
          src: getOptimizedUrl(moments[0].url, 1200),
          alt: moments[0].alt,
          width: hackathonMoments[0].width,
          height: hackathonMoments[0].height,
        }}
      />

      <section
        id="community"
        className={styles.community}
        aria-labelledby="community-title"
      >
        <div className={styles.shell}>
          <SectionLabel
            number="02"
            label="The people"
            detail="HackShastra & beyond"
          />
          <div className={styles.communityHead}>
            <h2
              id="community-title"
              className={styles.display}
              data-about-heading
            >
              {content.community.title}
              <br />
              <em>{content.community.accent}</em>
            </h2>
            <div className={styles.communityIntro} data-about-reveal>
              <ArrowDownRight size={36} strokeWidth={1} aria-hidden="true" />
              <p>{content.community.lead}</p>
              <p>{content.community.body}</p>
              <Link
                className={styles.textLink}
                href="https://hackshastra.in"
                target="_blank"
                rel="noreferrer"
              >
                Inside HackShastra <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className={styles.photoEssay}>
            <div className={styles.leadPhoto}>
              <MomentPhoto moment={moments[0]} index={0} />
              <div className={styles.mentoringNote} data-about-reveal>
                <span className={styles.smallLabel}>
                  The part I keep coming back for
                </span>
                <p>
                  {content.community.noteTitle}{" "}
                  <em>{content.community.noteAccent}</em>
                </p>
                <span className={styles.noteBody}>
                  {content.community.noteBody}
                </span>
              </div>
            </div>
            <div className={styles.sidePhotos}>
              {moments.slice(1, 3).map((moment, index) => (
                <MomentPhoto
                  moment={moment}
                  index={index + 1}
                  key={moment.id}
                />
              ))}
            </div>
          </div>

          <div className={styles.impact}>
            <span className={styles.rule} data-about-line aria-hidden="true" />
            <div className={styles.impactNumber} data-about-reveal>
              <strong>
                {builders.toLocaleString("en-IN")}
                <span>+</span>
              </strong>
              <span>builders mentored</span>
            </div>
            <p data-about-reveal>{content.community.impactText}</p>
            <ArrowDownRight size={52} strokeWidth={1} aria-hidden="true" />
          </div>

          {hackathons.length > 0 && (
            <div className={styles.eventArchive}>
              <div className={styles.archiveIntro} data-about-reveal>
                <span className={styles.smallLabel}>
                  Selected stops along the way
                </span>
                <h3>{content.community.archiveTitle}</h3>
                <Link className={styles.textLink} href="/hackathons">
                  The full archive <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className={styles.events}>
                {hackathons.map((event, index) => (
                  <a
                    className={styles.event}
                    href={event.link || "/hackathons"}
                    target={event.link ? "_blank" : undefined}
                    rel={event.link ? "noreferrer" : undefined}
                    data-about-reveal
                    key={event.id}
                  >
                    <span className={styles.eventIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className={styles.eventName}>
                      <h4>{event.name}</h4>
                      <span>{event.organizer}</span>
                    </div>
                    <div className={styles.eventMeta}>
                      <span>{event.role}</span>
                      <span>{event.date}</span>
                    </div>
                    <ArrowUpRight
                      size={22}
                      strokeWidth={1.3}
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        id="experience"
        className={styles.experience}
        aria-labelledby="experience-title"
      >
        <div className={styles.shell}>
          <SectionLabel
            number="03"
            label="The experience"
            detail="Still learning. Still building."
          />
          <div className={styles.experienceHead}>
            <h2
              id="experience-title"
              className={styles.display}
              data-about-heading
            >
              {content.experience.title}
              <br />
              <em>{content.experience.accent}</em>
            </h2>
            <p data-about-reveal>{content.experience.body}</p>
          </div>

          <div className={styles.roles}>
            {experiences.map((experience, index) => (
              <article
                className={styles.role}
                data-about-experience
                key={experience.id}
              >
                <div className={styles.roleIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className={styles.roleIdentity}>
                  <span>{experience.role}</span>
                  <h3>{experience.company}</h3>
                  <p>
                    {experience.period}
                    <br />
                    {experience.location}
                  </p>
                </div>
                <div className={styles.roleBody}>
                  <p className={styles.roleDescription}>
                    {experience.description}
                  </p>
                  {experience.achievements.length > 0 && (
                    <ul className={styles.achievements}>
                      {experience.achievements
                        .slice(0, 2)
                        .map((achievement, i) => (
                          <li key={i}>{achievement}</li>
                        ))}
                    </ul>
                  )}
                  {experience.achievements.length > 2 && (
                    <details className={styles.roleDetails}>
                      <summary>
                        More from this role{" "}
                        <Plus size={16} aria-hidden="true" />
                      </summary>
                      <ul className={styles.achievements}>
                        {experience.achievements
                          .slice(2)
                          .map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                      </ul>
                    </details>
                  )}
                  {experience.tech.length > 0 && (
                    <ul
                      className={styles.technologies}
                      aria-label="Technologies"
                    >
                      {experience.tech.map((technology) => (
                        <li key={technology}>{technology}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
            {experiences.length === 0 && (
              <p className={styles.emptyNote}>
                My next chapter is taking shape. In the meantime, explore what
                I’ve been building.
              </p>
            )}
          </div>
          <div className={styles.workLink} data-about-reveal>
            <span>The work puts it into practice.</span>
            <Link className={styles.textLink} href="/projects">
              Explore my projects <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.contact} aria-labelledby="about-contact-title">
        <div className={styles.shell}>
          <SectionLabel
            number="04"
            label="The next chapter"
            detail="Starts with a conversation"
          />
          <div className={styles.contactHead}>
            <h2 id="about-contact-title" data-about-heading>
              {content.contact.title}
              <br />
              <em>{content.contact.accent}</em>
            </h2>
            <Link
              className={styles.contactArrow}
              href="/contact"
              aria-label="Start a conversation with Tanmay"
            >
              <ArrowUpRight strokeWidth={0.9} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.contactBottom}>
            <p data-about-reveal>{content.contact.body}</p>
            <Link className={styles.contactLink} href="/contact">
              Let’s talk <ArrowUpRight size={23} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.signoff}>
            <span>{location}</span>
            <span>Code. Community. And what comes next.</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({
  number,
  label,
  detail,
}: {
  number: string;
  label: string;
  detail: string;
}) {
  return (
    <div className={styles.sectionLabel} data-about-reveal>
      <span>
        {number} <i aria-hidden="true">/</i> {label}
      </span>
      <span>{detail}</span>
    </div>
  );
}

function MomentPhoto({
  moment,
  index,
}: {
  moment: AboutMoment;
  index: number;
}) {
  return (
    <figure className={styles.moment}>
      <div className={styles.photoFrame} data-about-image>
        <Image
          src={getOptimizedUrl(moment.url, index === 0 ? 1400 : 900)}
          alt={moment.alt}
          width={hackathonMoments[index].width}
          height={hackathonMoments[index].height}
          sizes={
            index === 0
              ? "(max-width: 760px) 92vw, 62vw"
              : "(max-width: 760px) 92vw, 32vw"
          }
          unoptimized
          className={styles.photo}
          data-about-parallax
        />
        <span className={styles.photoNumber} aria-hidden="true">
          0{index + 1} / FIELD NOTES
        </span>
      </div>
      <figcaption className={styles.photoCaption}>
        <span>{moment.title}</span>
        <p>{moment.caption}</p>
      </figcaption>
    </figure>
  );
}
