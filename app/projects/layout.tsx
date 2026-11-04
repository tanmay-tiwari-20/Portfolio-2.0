import type { ReactNode } from "react";
import "./work.css";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return <div className="work-experience min-w-0">{children}</div>;
}
