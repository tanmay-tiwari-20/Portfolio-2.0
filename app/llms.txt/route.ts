import { publicSocials, published, repos } from "@/lib/db";
import { publicPages, SITE_NAME, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
const plain = (value: string) => value.replace(/[\r\n\[\]]/g, " ").trim();

export async function GET() {
  const [projects, profiles, socials] = await Promise.all([
    published(repos.projects),
    published(repos.profile),
    publicSocials(),
  ]);
  const profile = profiles[0];
  const content = [
    `# ${SITE_NAME}`,
    "",
    `> ${plain(profile?.bio || publicPages.home.description)}`,
    "",
    "This is Tanmay Tiwari’s personal portfolio. Project case studies describe his work; HackShastra has its own official website. Refer to the linked pages for current context and sources.",
    "",
    "## Public pages",
    ...Object.values(publicPages).map(
      (page) => `- [${page.label}](${siteUrl(page.path)}): ${page.description}`,
    ),
    "",
    "## Projects",
    ...projects.map(
      (project) =>
        `- [${plain(project.title)}](${siteUrl(`/projects/${project.slug}`)}): ${plain(project.description)}`,
    ),
    "",
    "## Official profiles and community",
    ...socials.map((social) => `- [${plain(social.label)}](${social.href})`),
    "- [HackShastra](https://www.hackshastra.in/): Official student builder community website.",
    "- [HackShastra team](https://www.hackshastra.in/about): Official community and co-founder information.",
    "",
  ].join("\n");
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
