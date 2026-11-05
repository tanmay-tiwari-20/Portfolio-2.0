"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, ArrowUpRight, Asterisk } from "lucide-react";
import { hackshastra } from "@/data/hackshastra";
import PracticeDiagram from "./practice-diagram";
import styles from "./practice-explorer.module.css";

const pathways = [
  {
    id: "build",
    number: "01",
    verb: "Build",
    label: "Hackathons & events",
    eyebrow: "Make something that didn’t exist yesterday",
    title: "Gather. Make. Repeat.",
    description:
      "From a first meetup to national hackathons and a technology expo, the community creates occasions to turn ideas into working projects.",
    steps: ["Find a team", "Try an idea", "Make it real"],
    href: "#hs-events",
    action: "Explore the gatherings",
    note: "A little curiosity. A room full of possibility.",
  },
  {
    id: "learn",
    number: "02",
    verb: "Learn",
    label: "Mentorship & feedback",
    eyebrow: "A fresh perspective can change the whole build",
    title: "A little guidance. A big leap.",
    description:
      "Grand Hack IPEC paired an online mentorship phase with an in-person hackathon, bringing guidance and expert feedback into the building process.",
    steps: ["Bring an idea", "Get feedback", "Keep improving"],
    href: hackshastra.contact,
    action: "Talk about mentorship",
    note: "You bring the questions. We make room for them.",
  },
  {
    id: "lead",
    number: "03",
    verb: "Lead",
    label: "Campus chapters",
    eyebrow: "Big communities begin with a few people",
    title: "Bring it to your campus.",
    description:
      "Campus chapters carry the community locally. IPEC and SRM–AP chapters have hosted their own gatherings, giving students a place to start.",
    steps: ["Find your people", "Start local", "Grow together"],
    href: hackshastra.chapters,
    action: "Start a campus chapter",
    note: "Your campus could be where the next story begins.",
  },
] as const;

export default function PracticeExplorer() {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % pathways.length;
        break;
      case "ArrowLeft":
        next = (index + pathways.length - 1) % pathways.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = pathways.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.topline}>
        <p className="hs-mono">Three ways to get involved</p>
        <p className={styles.hint}>
          Pick your starting point <ArrowRight size={14} aria-hidden="true" />
        </p>
      </div>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Ways to get involved"
      >
        {pathways.map((pathway, index) => (
          <button
            key={pathway.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${pathway.id}`}
            aria-controls={`${id}-panel-${pathway.id}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            className={styles.tab}
            onClick={() => setActive(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className={styles.tabTop} aria-hidden="true">
              <span className="hs-mono">{pathway.number}</span>
              <ArrowUpRight size={22} strokeWidth={1.5} />
            </span>
            <span className={styles.tabVerb}>
              {pathway.verb}
              <span>.</span>
            </span>
            <span className={styles.tabLabel}>{pathway.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.panels}>
        {pathways.map((pathway, index) => {
          const external = pathway.href.startsWith("https:");
          return (
            <div
              key={pathway.id}
              id={`${id}-panel-${pathway.id}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${pathway.id}`}
              hidden={active !== index}
              tabIndex={0}
              className={styles.panel}
            >
              <div className={styles.copy}>
                <p className={`${styles.eyebrow} hs-mono`}>
                  <Asterisk size={18} aria-hidden="true" />
                  {pathway.eyebrow}
                </p>
                <h3 className={styles.title}>{pathway.title}</h3>
                <p className={styles.description}>{pathway.description}</p>
                <ol className={styles.steps} aria-label="The path in practice">
                  {pathway.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <a
                  href={pathway.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className={styles.action}
                >
                  {pathway.action}
                  <ArrowUpRight size={20} aria-hidden="true" />
                  {external && (
                    <span className="sr-only"> (opens in a new tab)</span>
                  )}
                </a>
              </div>
              <div className={styles.art}>
                <div className={`${styles.artHeader} hs-mono`}>
                  <span>From curiosity to community</span>
                  <span aria-hidden="true">/ {pathway.number}</span>
                </div>
                <PracticeDiagram mode={pathway.id} />
                <p className={styles.artNote}>{pathway.note}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.footer}>
        <span className="hs-mono">
          Different ways in. The same hands-on spirit.
        </span>
        <span className={styles.footerMark} aria-hidden="true">
          <Asterisk size={17} /> Built together
        </span>
      </div>
    </div>
  );
}
