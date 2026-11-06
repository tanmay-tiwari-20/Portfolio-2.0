import { MapPin } from "lucide-react";
import ContactMotion from "@/components/contact/contact-motion";
import ContactChannels from "@/components/contact/contact-channels";
import { published, publicSocials, repos } from "@/lib/db";
import { resolveContactLinks } from "@/lib/contact-links";
import "./contact.css";
import { pageMetadata, pageGraph } from "@/lib/seo";
import SeoJsonLd from "@/components/seo-json-ld";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("contact");

export default async function Contact() {
  const [socials, profiles] = await Promise.all([
    publicSocials(),
    published(repos.profile),
  ]);
  const person = profiles[0];

  return (
    <ContactMotion className="contact-page">
      <SeoJsonLd data={pageGraph("contact")} />
      <div className="contact-container">
        <div className="contact-layout">
          <section className="contact-hero" aria-labelledby="contact-title">
            <p className="contact-eyebrow" data-contact-intro>
              <span aria-hidden="true" /> CONTACT{" "}
              {person?.name || "Tanmay Tiwari"}
            </p>
            <h1
              id="contact-title"
              className="contact-title"
              aria-label={`Contact ${person?.name || "Tanmay Tiwari"}: Good things start with hello.`}
            >
              <span data-contact-line>Good things</span>{" "}
              <span data-contact-line>start with</span>{" "}
              <em data-contact-line>hello.</em>
            </h1>
            <p className="contact-hero-copy" data-contact-intro>
              A project, a collaboration, or an idea to share.
              <br />
              I’d love to hear from you.
            </p>
          </section>

          <section className="contact-panel" aria-label="Get in touch">
            <div className="contact-spark" aria-hidden="true">
              <svg viewBox="0 0 120 120" fill="none">
                <path
                  d="M60 0C60 39 81 60 120 60C81 60 60 81 60 120C60 81 39 60 0 60C39 60 60 39 60 0Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <ContactChannels
              email={person?.email}
              socials={resolveContactLinks(socials)}
            />
          </section>
        </div>

        <footer className="contact-colophon">
          <p>{person?.name || "Tanmay Tiwari"}</p>
          {person?.location && (
            <p className="contact-location">
              <MapPin size={14} strokeWidth={1.6} aria-hidden="true" />
              {person.location}
            </p>
          )}
        </footer>
      </div>
    </ContactMotion>
  );
}
