import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, MapPin } from "lucide-react";
import ContactMotion from "@/components/contact/contact-motion";
import ContactChannels from "@/components/contact/contact-channels";
import { published, repos } from "@/lib/db";
import { resolveContactLinks } from "@/lib/contact-links";
import "./contact.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Contact — Let’s make something matter",
  description:
    "A project, a collaboration, or a conversation. Contact Tanmay Tiwari to build something thoughtful together.",
};

export default async function Contact() {
  const [socials, profiles] = await Promise.all([
    published(repos.socials),
    repos.profile.getAll(),
  ]);
  const person = profiles[0];

  return (
    <ContactMotion className="contact-page">
      <div className="contact-container">
        <div className="contact-layout">
          <section className="contact-hero" aria-labelledby="contact-title">
            <p className="contact-eyebrow" data-contact-intro>
              <span aria-hidden="true" /> A GOOD PLACE TO BEGIN
            </p>
            <h1
              id="contact-title"
              className="contact-title"
              aria-label="Let’s make something matter."
            >
              <span className="contact-line-mask">
                <span data-contact-line>Let’s make</span>
              </span>
              <span className="contact-line-mask">
                <span data-contact-line>something</span>
              </span>
              <span className="contact-line-mask">
                <span data-contact-line>
                  <em>matter.</em>
                </span>
              </span>
            </h1>
            <p className="contact-hero-copy" data-contact-intro>
              A new project, a collaboration, or a simple hello. I’d love to
              hear what you’re thinking.
            </p>
            <a
              className="contact-hero-link"
              href={
                person?.email ? `mailto:${person.email}` : "#contact-channels"
              }
              data-contact-action
              data-contact-intro
            >
              {person?.email ? "Send me an email" : "Find me online"}{" "}
              <ArrowDownRight size={20} data-contact-arrow aria-hidden="true" />
            </a>
            {person?.location && (
              <p className="contact-location" data-contact-intro>
                <MapPin size={15} strokeWidth={1.7} aria-hidden="true" />
                {person.location}
                <span>Connected everywhere.</span>
              </p>
            )}
          </section>

          <section
            id="contact-channels"
            className="contact-panel"
            aria-labelledby="contact-channels-title"
            data-contact-reveal
          >
            <div className="contact-panel-heading">
              <div className="contact-panel-overline">
                <span className="contact-kicker">LET’S CONNECT</span>
                <ArrowUpRight size={22} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h2 id="contact-channels-title">Say hello.</h2>
              <p>Email me directly or connect with me below.</p>
            </div>
            <ContactChannels
              email={person?.email}
              socials={resolveContactLinks(socials)}
            />
          </section>
        </div>

        <footer className="contact-colophon">
          <p>
            {person?.name || "Tanmay Tiwari"}
            <span>Good conversations make good beginnings.</span>
          </p>
          <a href="#top" data-contact-action>
            Back to top{" "}
            <ArrowUpRight size={16} data-contact-arrow aria-hidden="true" />
          </a>
        </footer>
      </div>
    </ContactMotion>
  );
}
