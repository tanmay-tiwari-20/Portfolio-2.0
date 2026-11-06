// One preferred origin for metadata, search files and permanent host redirects.
// Preview/local deployments intentionally keep the production canonical.
export const SITE_URL = "https://takneekitanmay.tech";
export const SITE_NAME = "Tanmay Tiwari";
export const SITE_ALIASES = [
  "takneekitanmay.vercel.app",
  "www.takneekitanmay.tech",
];

export function siteUrl(path = "/") {
  return `${SITE_URL}${path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`}`;
}

export const publicPages = {
  home: {
    path: "/",
    label: "Home",
    title: "Tanmay Tiwari | Full-Stack Developer & HackShastra Co-founder",
    description:
      "Tanmay Tiwari is a full-stack developer and HackShastra co-founder in New Delhi. Explore interactive web projects, hackathon mentoring and community work.",
  },
  about: {
    path: "/about",
    label: "About",
    title: "About Tanmay Tiwari | Developer & Community Builder",
    description:
      "Meet Tanmay Tiwari, a full-stack developer in New Delhi and HackShastra co-founder. Read about his technical practice, experience and community involvement.",
  },
  projects: {
    path: "/projects",
    label: "Projects",
    title: "Software & Interactive Web Projects | Tanmay Tiwari",
    description:
      "Explore Tanmay Tiwari’s projects: Unoverse, Spools, Baithak and more. Browse real-time apps, 3D web experiences, source code and technical case studies.",
  },
  hackathons: {
    path: "/hackathons",
    label: "Hackathons",
    title: "Hackathon Mentoring & Judging | Tanmay Tiwari",
    description:
      "Explore Tanmay Tiwari’s hackathon journal, with event-specific mentoring, judging and organizing roles, builder experiences and links to the events.",
  },
  hackshastra: {
    path: "/hackshastra",
    label: "HackShastra",
    title: "HackShastra Community & Events | Tanmay Tiwari",
    description:
      "Discover HackShastra, the student builder community co-founded by Tanmay Tiwari. Explore its hackathons, campus chapters, community events and official links.",
  },
  contact: {
    path: "/contact",
    label: "Contact",
    title: "Contact Tanmay Tiwari | Projects & Collaborations",
    description:
      "Contact Tanmay Tiwari for software projects, creative collaborations or community conversations. Find his email and official professional profiles.",
  },
} as const;

export type PublicPage = keyof typeof publicPages;
