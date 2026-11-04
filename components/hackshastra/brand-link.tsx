import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export default function BrandLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("https:") ? "_blank" : undefined}
      rel={href.startsWith("https:") ? "noopener noreferrer" : undefined}
      className={`hs-link inline-flex min-h-12 items-center justify-between gap-6 ${className}`}
      data-hackshastra-link
    >
      <span>{children}</span>
      <ArrowUpRight size={20} aria-hidden="true" data-hackshastra-arrow />
      {href.startsWith("https:") && (
        <span className="sr-only"> (opens in a new tab)</span>
      )}
    </a>
  );
}
