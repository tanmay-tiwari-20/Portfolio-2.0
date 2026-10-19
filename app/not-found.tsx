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
          <span className="eyebrow-accent-bar" />
          <span>PAGE NOT FOUND // ERROR 404</span>
        </div>

        <h1
          className="display"
          style={{
            fontSize: "clamp(88px, 16vw, 180px)",
            color: "var(--theme-red)",
            lineHeight: 0.9,
            margin: "0 0 20px",
            textShadow: "0 0 40px var(--theme-red-glow)",
          }}
        >
          404
        </h1>

        <p className="hero-lede" style={{ margin: "0 auto 36px" }}>
          The requested coordinate doesn't exist or has been relocated. Let’s guide you back to the home index.
        </p>

        <Link href="/" className="button button-primary">
          <ArrowLeft size={18} /> Return To Home
        </Link>
      </div>
    </section>
  );
}
