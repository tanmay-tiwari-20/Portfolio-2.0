# Design Notes — Awwwards Spider-Man / Marvel Edition

## Aesthetic & Architecture Overview
This portfolio is engineered to Awwwards Site-of-the-Day standards, treating the portfolio as an immersive superhero narrative: cinematic first screen, fluid inertia scrolling, punchy typographic hierarchy, and seamless real-time database reactivity.

### Visual Identity
- **Theme:** Vibrant Spider-Man / Marvel heroic aesthetic.
- **Color Palette:** High-contrast, pure and punchy solid colors (**NO GRADIENTS**):
  - **Spider-Man Vibrant Red:** `#ff1e27` (energetic, heroic scarlet)
  - **Stark / Spidey Tech Blue:** `#0b63f6` (electric cobalt)
  - **Nightfall Dark Canvas:** `#06070a` to `#151924` (stealth superhero backdrop)
  - **Spider Web Grid:** Crisp subtle SVG web lines & concentric rings
- **Typography:**
  - **Display / Headers:** Google Font **Poppins** (400–900 weights) for energetic, bold comic-book punch and tight kerning.
  - **Body / Interface:** Google Font **Inter** (300–700 weights) for ultra-clean readability, modern numbers, and elegant metrics.
- **Shapes & Corners:**
  - All buttons and chips are smooth pills (`border-radius: 9999px`).
  - Cards and containers use generous smooth radii (`border-radius: 20px` to `24px`).
  - Sharp and jagged polygon cuts have been removed in favor of modern, sleek curvatures.

### Motion & Interaction (Awwwards Grade)
- **Smooth Inertia Scrolling:** Studio Freight's **Lenis** integration combined with **GSAP ScrollTrigger** for friction-free acceleration and scroll-bound reveals.
- **Custom Spider-Sense Cursor:** Interactive magnetic crosshair with responsive scaling on clickable elements.
- **Micro-Animations:** Spring physics, hover lifts (`transform: translateY(-4px)`), radar pulses, and infinite tech superpower marquee tickers.

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
