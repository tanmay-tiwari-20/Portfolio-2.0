"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
  FaFacebookF,
  FaThreads,
  FaDiscord,
  FaTelegram,
  FaTiktok,
  FaDribbble,
  FaBehance,
  FaMedium,
  FaStackOverflow,
  FaLink,
} from "react-icons/fa6";
import type { ContactLink, ContactPlatform } from "@/lib/contact-links";

const icons = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  x: FaXTwitter,
  youtube: FaYoutube,
  facebook: FaFacebookF,
  threads: FaThreads,
  discord: FaDiscord,
  telegram: FaTelegram,
  tiktok: FaTiktok,
  dribbble: FaDribbble,
  behance: FaBehance,
  medium: FaMedium,
  stackoverflow: FaStackOverflow,
  website: FaLink,
} satisfies Record<ContactPlatform, typeof FaGithub>;

export default function ContactChannels({
  email,
  socials,
}: {
  email?: string;
  socials: ContactLink[];
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyEmail() {
    if (!email) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(email);
      if (mounted.current) setCopyState("copied");
    } catch {
      if (mounted.current) setCopyState("failed");
    }
    if (mounted.current)
      resetTimer.current = setTimeout(() => setCopyState("idle"), 4000);
  }

  return (
    <>
      {email && (
        <div className="contact-email-block">
          <p className="contact-small-label">DROP ME A LINE</p>
          <p className="contact-email-address">
            {email.split("@")[0]}
            <wbr />@{email.split("@").slice(1).join("@")}
          </p>
          <div className="contact-email-actions">
            <a
              className="contact-email-button"
              href={`mailto:${email}`}
              data-contact-action
            >
              <Mail size={18} aria-hidden="true" />
              <span>Say hello</span>
              <ArrowUpRight size={19} data-contact-arrow aria-hidden="true" />
            </a>
            <button
              type="button"
              className="contact-copy"
              onClick={copyEmail}
              aria-label={
                copyState === "copied"
                  ? "Email address copied"
                  : "Copy email address"
              }
              title={
                copyState === "copied"
                  ? "Email address copied"
                  : "Copy email address"
              }
            >
              {copyState === "copied" ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Copy size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="contact-copy-status" role="status">
            {copyState === "copied"
              ? "Ready to paste."
              : copyState === "failed"
                ? "Couldn’t copy. Select the address above."
                : ""}
          </p>
        </div>
      )}
      {socials.length > 0 && (
        <nav
          className="contact-socials"
          aria-label="Connect with me on social platforms"
        >
          <p className="contact-small-label">ELSEWHERE</p>
          <div className="contact-social-list">
            {socials.map(({ platform, label, href }) => {
              const Icon = icons[platform];
              return (
                <a
                  key={href}
                  className={`contact-social contact-social-${platform}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-contact-action
                  aria-label={`${label} — opens in a new tab`}
                >
                  <Icon
                    className="contact-brand-icon"
                    size={17}
                    aria-hidden="true"
                  />
                  <span className="contact-social-name">{label}</span>
                  <ArrowUpRight
                    className="contact-social-arrow"
                    size={14}
                    data-contact-arrow
                    aria-hidden="true"
                  />
                </a>
              );
            })}
          </div>
        </nav>
      )}
      {!email && socials.length === 0 && (
        <p className="contact-empty">
          Contact details are being updated. Please check back soon.
        </p>
      )}
    </>
  );
}
