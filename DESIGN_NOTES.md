# Design Notes — Editorial Red Portfolio

## Aesthetic & Architecture Overview
The portfolio uses an editorial, portrait-led opening and a clear story through selected work, experience, and community. Its motion should feel deliberate and fluid, with restrained red accents and strong readable contrast.

### Visual Identity
- **Theme:** Charcoal and warm scarlet, with an editorial creative-developer feel.
- **Color Palette:**
  - **Warm Red:** a scarlet hero panel with `#ef463e` for highlights, links, and interaction cues.
  - **Charcoal Canvas:** `#0d0a0b` with warm layered surfaces through `#1c1516` below the opening.
  - **Warm Paper:** `#fffaf7` for headlines and key text.
  - **Fine Grid:** low-contrast square lines behind the hero and thin rules between story sections.
- **Typography:**
  - **Display / Headers:** Google Font **Poppins** (400–900 weights) for bold, oversized names and section titles.
  - **Body / Interface:** Google Font **Inter** (300–700 weights) for clear reading and interface details.
- **Shapes & Corners:**
  - Pills for actions and small status labels.
  - Project imagery keeps a restrained rounded frame; information sits below it for readability.
  - Hand-drawn annotation and fine grid details provide a personal, print-like touch.

### Motion & Interaction (Awwwards Grade)
- **Smooth Scrolling:** **Lenis** with **GSAP ScrollTrigger** for eased scrolling, staged section reveals, and a pinned horizontal project showcase on desktop.
- **Responsive Motion:** Project cards remain swipeable on touch screens; `prefers-reduced-motion` disables the animation layer and pauses decorative motion.
- **Micro-Animations:** Subtle portrait tilt, image hover lift, arrow cues, and a slow technical-skills ticker.

### Database & Live Dynamic Publishing
- **Database Engine:** **MongoDB** (with local MongoDB service support and zero-config MongoDB Atlas support via `MONGODB_URI`).
- **Resilient Fallback:** Seamless dual-layer `UnifiedRepository` which operates on MongoDB when connected and falls back gracefully to local JSON storage if offline.
- **Zero-Redeploy Updates:** All mutations from the Admin Command Center (`POST`, `PATCH`, `DELETE`, `PUT`) automatically execute cache invalidation (`revalidatePath`) and Next.js dynamic routing, updating the live production site immediately without needing code redeployment.

### Secret Admin Command Center
- Located at `/secret-admin` with secure authentication.
- Point-and-click visual CRUD across all collections:
  - **Missions & Projects:** Add, Edit, Delete, Toggle Featured, Toggle Published, manage tags & live links.
  - **Experience:** Add, Edit, Delete roles, bullet achievements, and tech stack.
  - **Profile & Hero:** Edit headline, bio, contact info, and live metric counters.
  - **Hackathons & HackShastra:** Full event management.
  - **Social Links & SEO Settings:** Dynamic link management.
  - **Live Database Health Monitor:** Real-time MongoDB status verification.
