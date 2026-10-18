import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section
      className="section-shell"
      style={{
        minHeight: "75vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "120px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <div className="eyebrow" style={{ margin: "0 auto 20px", display: "inline-flex" }}>
          <span className="pulse-red" />
          <span>MISSED THE WEB // 404 DETECTED</span>
        </div>

        <h1
          className="display"
          style={{
            fontSize: "clamp(88px, 16vw, 180px)",
            color: "var(--spidey-red)",
            lineHeight: 0.9,
            margin: "0 0 20px",
            textShadow: "0 0 40px var(--spidey-red-glow)",
          }}
        >
          404
        </h1>

        <p className="hero-lede" style={{ margin: "0 auto 36px" }}>
          This page swung off somewhere into another multiverse. Let’s get you safely back to headquarters.
        </p>

        <Link href="/" className="button button-primary">
          <ArrowLeft size={18} /> Return To Headquarters
        </Link>
      </div>
    </section>
  );
}
