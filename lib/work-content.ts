import type { Project } from "@/lib/validators/schemas";

export type ProjectTone =
  "scarlet" | "violet" | "amber" | "blue" | "sage" | "neutral";
export type ProjectLayout = "cinema" | "editorial" | "studio";
export type ProjectFeature = { title: string; body: string };
export type ProjectStack = { label: string; items: string[] };
export type ProjectArtDirection = {
  tone: ProjectTone;
  layout: ProjectLayout;
  shortTitle: string;
  statement: string;
  summary: string;
  features: ProjectFeature[];
  stack: ProjectStack[];
};

type EditorialContent = Omit<ProjectArtDirection, "stack"> & {
  sourceTitle: string;
  sourceDescription: string;
};

// The source copy is an explicit guard: admin edits or future data changes must
// never leave a case study presenting features from an older project description.
const editorial: Record<string, EditorialContent> = {
  unoverse: {
    sourceTitle: "Unoverse",
    sourceDescription:
      "Unoverse is a real-time 3D multiplayer UNO game built with Next.js, React Three Fiber, Express, Socket.IO, and TypeScript. It features a server-authoritative game engine, immersive 3D gameplay, WebRTC voice chat, customizable house rules, smart matchmaking with room codes, and seamless real-time multiplayer for an authentic UNO experience.",
    tone: "scarlet",
    layout: "cinema",
    shortTitle: "Unoverse",
    statement: "A familiar game.\nA new dimension.",
    summary:
      "Real-time multiplayer UNO, brought into 3D with voice chat and your own house rules.",
    features: [
      {
        title: "Around the table.",
        body: "A familiar UNO experience becomes an immersive 3D multiplayer game.",
      },
      {
        title: "Connected in real time.",
        body: "A server-authoritative game engine, smart matchmaking and room codes support multiplayer play.",
      },
      {
        title: "Play it your way.",
        body: "WebRTC voice chat and customizable house rules make room for conversation and different ways to play.",
      },
    ],
  },
  spools: {
    sourceTitle: "Spools",
    sourceDescription:
      "Spools is a social space for sharing ideas, finding your people, and building things together. It is a full-stack social app built with the MERN stack. Share short posts, explore beyond your feed, start interest-based Circles, collaborate on multi-part Spool series, and chat in real time.",
    tone: "violet",
    layout: "editorial",
    shortTitle: "Spools",
    statement: "Small posts.\nShared possibilities.",
    summary:
      "A social space for short posts, shared interests, collaborative series and real-time conversations.",
    features: [
      {
        title: "An idea starts here.",
        body: "Share short posts and explore beyond your feed.",
      },
      {
        title: "Find your circle.",
        body: "Start interest-based Circles to find people around the things you care about.",
      },
      {
        title: "Keep the thread going.",
        body: "Collaborate on multi-part Spool series and continue the conversation in real-time chat.",
      },
    ],
  },
  "hackshastra-website": {
    sourceTitle: "HackShastra Website",
    sourceDescription:
      "This is an interactive, high-performance community platform and event management system built for the HackShastra community.",
    tone: "amber",
    layout: "studio",
    shortTitle: "HackShastra",
    statement: "A home for\na community.",
    summary:
      "An interactive community platform and event management system for HackShastra.",
    features: [
      {
        title: "The community, online.",
        body: "An interactive platform built for the HackShastra community.",
      },
      {
        title: "Space for what’s next.",
        body: "Event management is part of the same community platform.",
      },
    ],
  },
  baithak: {
    sourceTitle: "Baithak",
    sourceDescription:
      "Baithak is a video meeting and collaboration app built with Next.js. Its dashboard brings meeting creation, joining, scheduling, personal rooms, meeting history, and recordings together in one place. Meetings use Stream Video for real-time calls, while Clerk handles sign-in.",
    tone: "blue",
    layout: "editorial",
    shortTitle: "Baithak",
    statement: "Make room\nfor conversation.",
    summary:
      "Video meetings, personal rooms, schedules and recordings, together in one dashboard.",
    features: [
      {
        title: "Bring everyone together.",
        body: "Create, join or schedule a meeting from the dashboard, with personal rooms available alongside them.",
      },
      {
        title: "A real-time conversation.",
        body: "Stream Video powers the calls, while Clerk handles sign-in.",
      },
      {
        title: "Pick up where you left off.",
        body: "Meeting history and recordings live in the same dashboard.",
      },
    ],
  },
  "3d-shirt-showcaser": {
    sourceTitle: "3D Shirt Showcaser",
    sourceDescription:
      "3D Shirt Showcaser is an interactive web app using React, Three.js, and Tailwind CSS that lets users customize 3D shirt models with various textures and colors in real time. It offers a dynamic and engaging way to visualize products online.",
    tone: "sage",
    layout: "studio",
    shortTitle: "Shirt Showcaser",
    statement: "A different\npoint of view.",
    summary:
      "An interactive 3D shirt customizer for exploring textures and colors in real time.",
    features: [
      {
        title: "Choose a new look.",
        body: "Customize the shirt model with different textures and colors in real time.",
      },
      {
        title: "See it in three dimensions.",
        body: "React and Three.js bring interactive product visualization into the browser.",
      },
    ],
  },
  resumify: {
    sourceTitle: "Resumify",
    sourceDescription:
      "Resumify is a full-stack resume review web app that lets users upload resumes, preview them, get ATS-based scores, and receive detailed feedback with improvement suggestions, all in a clean and interactive interface.",
    tone: "violet",
    layout: "editorial",
    shortTitle: "Resumify",
    statement: "A closer look\nat your résumé.",
    summary:
      "Resume previews, ATS-based scores and detailed suggestions in one review experience.",
    features: [
      {
        title: "Start with your résumé.",
        body: "Upload a resume and preview it in the application.",
      },
      {
        title: "See the score.",
        body: "Get an ATS-based score as part of the resume review.",
      },
      {
        title: "Find the next improvement.",
        body: "Detailed feedback and improvement suggestions help guide the next revision.",
      },
    ],
  },
  "apple-iphone-15-pro-website": {
    sourceTitle: "Apple iPhone 15 Pro Website",
    sourceDescription:
      "Apple iPhone 15 Pro Website is a React-based recreation of Apple's iPhone 15 Pro website. Featuring Tailwind CSS for responsive styling and Three.js for immersive 3D effects, this project incorporates GSAP animations for a dynamic user experience, closely mirroring the original site’s sleek design and interactive elements.",
    tone: "neutral",
    layout: "cinema",
    shortTitle: "iPhone 15 Pro",
    statement: "A study in\nproduct interaction.",
    summary:
      "A recreation of Apple’s iPhone 15 Pro website, exploring responsive design, 3D and motion.",
    features: [
      {
        title: "Recreating the experience.",
        body: "A React-based recreation of Apple’s iPhone 15 Pro website and its interactive presentation.",
      },
      {
        title: "Form, motion, detail.",
        body: "Tailwind CSS provides responsive styling, Three.js creates 3D effects, and GSAP adds animation.",
      },
    ],
  },
};

const stackGroups = [
  {
    label: "Interface & interaction",
    tags: new Set([
      "next.js",
      "typescript",
      "react",
      "react.js",
      "vite",
      "react router",
      "recoil",
      "tailwind css",
      "chakra ui",
      "radix ui",
      "react three fiber",
      "three.js",
      "zustand",
      "framer motion",
      "gsap",
      "gsap scrolltrigger",
      "lenis",
    ]),
  },
  {
    label: "Real-time connections",
    tags: new Set(["socket.io", "webrtc", "stream video react sdk"]),
  },
  {
    label: "Platform & infrastructure",
    tags: new Set([
      "node.js",
      "express",
      "redis",
      "docker",
      "crazygames sdk",
      "mongodb",
      "jwt",
      "bcrypt",
      "cloudinary",
      "pwa",
      "vercel",
      "clerk",
      "puter store",
      "blob storage",
      "custom data structures",
    ]),
  },
];

function getProjectStack(tags: string[]): ProjectStack[] {
  const groups = stackGroups.map(({ label }) => ({
    label,
    items: [] as string[],
  }));
  const other = { label: "Related topics", items: [] as string[] };
  for (const tag of tags) {
    const index = stackGroups.findIndex((group) =>
      group.tags.has(tag.trim().toLowerCase()),
    );
    (index === -1 ? other : groups[index]).items.push(tag);
  }
  return [...groups, other].filter((group) => group.items.length > 0);
}

export function getProjectArtDirection(project: Project): ProjectArtDirection {
  const content = editorial[project.slug];
  const isCurrent =
    content?.sourceTitle === project.title &&
    content?.sourceDescription === project.description;
  const stack = getProjectStack(project.tags);
  if (content && isCurrent) {
    return {
      tone: content.tone,
      layout: content.layout,
      shortTitle: content.shortTitle,
      statement: content.statement,
      summary: content.summary,
      features: content.features.map((feature) => ({ ...feature })),
      stack,
    };
  }
  return {
    tone: content?.tone ?? "scarlet",
    layout: content?.layout ?? "editorial",
    shortTitle: project.title,
    statement: project.title,
    summary: project.description,
    features: [],
    stack,
  };
}

function externalUrl(value?: string): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    return ["https:", "http:"].includes(parsed.protocol)
      ? candidate
      : undefined;
  } catch {
    return undefined;
  }
}

export function getProjectLinks(project: Project): {
  live?: string;
  github?: string;
} {
  return {
    live: externalUrl(project.liveUrl),
    github: externalUrl(project.githubUrl),
  };
}

export function getProjectNeighbors(
  projects: Project[],
  slug: string,
): { previous?: Project; next?: Project } {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index < 0 || projects.length < 2) return {};
  return {
    previous: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}
