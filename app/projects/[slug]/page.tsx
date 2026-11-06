import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import ProjectCaseStudy from "@/components/work/project-case-study";
import { projectMetadata, projectGraph } from "@/lib/seo";
import SeoJsonLd from "@/components/seo-json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = (await published(repos.projects)).find((x) => x.slug === slug);
  if (!p) notFound();
  return projectMetadata(p);
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = await published(repos.projects);
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  return (
    <>
      <SeoJsonLd data={projectGraph(p)} />
      <ProjectCaseStudy project={p} projects={projects} />
    </>
  );
}
