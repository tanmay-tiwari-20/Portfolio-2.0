import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { published, repos } from "@/lib/db";
import ProjectGallery from "@/components/project-gallery";
import WorkHero from "@/components/work/work-hero";
import WorkMotion from "@/components/work/work-motion";
import ContributionCity from "@/components/work/contribution-city";
import { MotionLayer } from "@/components/shell";
import { pageMetadata, pageGraph } from "@/lib/seo";
import SeoJsonLd from "@/components/seo-json-ld";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("projects");

export default async function ProjectsPage() {
  const items = await published(repos.projects);
  return (
    <div className="work-desk-surface">
      <SeoJsonLd data={pageGraph("projects")} />
      <WorkMotion className="work-paper relative overflow-hidden">
        <WorkHero projects={items} />
      </WorkMotion>
      <ContributionCity />
      <ProjectGallery projects={items} />
      <WorkMotion className="work-desk-surface px-5 pt-5 pb-16 sm:px-9 sm:pb-20 lg:px-14">
        <section className="relative mx-auto flex max-w-[1440px] flex-col justify-between gap-8 rounded-sm border border-[#6b3030] bg-[#712e36] px-7 py-10 text-[#fffaf7] shadow-[0_18px_35px_-20px_#553b3280] [--work-focus:#edbd83] sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:px-14">
          <span className="work-tape" aria-hidden="true" />
          <div data-work-reveal>
            <p className="mb-5 text-[10px] tracking-[0.15em] text-[#f0d0c4] uppercase">
              A note for the next project
            </p>
            <h2 className="font-display text-[clamp(2.2rem,min(4vw,7svh),4rem)] leading-[1.1] font-medium tracking-[-0.06em]">
              There’s room for
              <br />
              <em className="font-[Georgia,serif] font-normal text-[#edbd83]">
                your idea, too.
              </em>
            </h2>
          </div>
          <Link
            data-work-link
            data-work-reveal
            href="/contact"
            className="inline-flex min-h-14 w-fit items-center gap-10 rounded-full border border-white/30 px-7 py-4 text-sm transition-colors hover:border-[#fffaf7] hover:bg-[#fffaf7] hover:text-[#321b20]"
          >
            Start a conversation
            <ArrowUpRight data-work-arrow size={20} aria-hidden="true" />
          </Link>
        </section>
      </WorkMotion>
      <MotionLayer />
    </div>
  );
}
