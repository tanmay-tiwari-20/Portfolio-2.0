import type { HackShastraEvent } from "@/components/hackshastra/event-archive";

// Source ledger and verification date: docs/HACKSHASTRA_RESEARCH.md.
// Research enriches unchanged event copy via lib/hackshastra-content.ts while
// preserving the published records and later edits in the existing event editor.
export const hackshastra = {
  website: "https://www.hackshastra.in/",
  about: "https://www.hackshastra.in/about",
  contact: "https://www.hackshastra.in/contact",
  email: "thehackshastra@gmail.com",
  instagram: "https://instagram.com/hackshastra",
  linkedin: "https://www.linkedin.com/company/hackshastraa",
  community: "https://chat.whatsapp.com/IeO0TMZYkh7LdCK264UBp3",
  chapters: "https://forms.gle/PjuZH5racue4aYwG9",
  // Existing portfolio asset. Do not recolor or crop this official symbol.
  logo: "https://res.cloudinary.com/dunacoujw/image/upload/v1792601186/logo1_y3d5u2.svg",
  arena:
    "https://res.cloudinary.com/dunacoujw/image/upload/v1772402430/12_ubduyk.webp",
  celebration:
    "https://res.cloudinary.com/dunacoujw/image/upload/v1772402433/reach_xhdfbp.webp",
  moments: [
    {
      src: "https://res.cloudinary.com/dunacoujw/image/upload/v1772402431/14_esbxla.webp",
      alt: "A moment from the official HackShastra community gallery",
    },
    {
      src: "https://res.cloudinary.com/dunacoujw/image/upload/v1772402429/3_ewhcxs.webp",
      alt: "HackShastra community members at an event",
    },
  ],
};

export const hackshastraEvents: HackShastraEvent[] = [
  {
    id: "pre-meetup",
    title: "HackShastra Pre-Meetup",
    date: "27 July 2025",
    location: "IIIT Delhi",
    category: "Meetup",
    role: "Community meetup",
    description:
      "The community’s first tech gathering brought students together to connect, exchange ideas and begin building something together.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772462520/9c6e178a-cb54-4b19-a814-ba10ef2ef2cf_kuqxxl.jpg",
    imageAlt: "HackShastra Pre-Meetup poster",
    href: "https://luma.com/n17f71yg",
  },
  {
    id: "hackshastra-1",
    title: "HackShastra 1.0",
    date: "September 2025",
    location: "Gurugram",
    category: "Hackathon",
    role: "Community hackathon",
    description:
      "The first HackShastra hackathon. An idea that began with bringing people together became a space to build, compete and collaborate.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772462046/hackshastra2026_03_02_20_03_0106133100-147b-42e1-a4ca-ee5310eee7ae.jpg_wbipcz.webp",
    imageAlt: "HackShastra 1.0 poster",
    href: "https://unstop.com/hackathons/hackshastra-hackshastra-1544473",
  },
  {
    id: "hi-o",
    title: "HI-O",
    date: "30 October 2025",
    location: "IPEC, Ghaziabad",
    category: "Campus orientation",
    role: "HackShastra IPEC chapter",
    description:
      "An introduction to the campus community, hosted by HackShastra and its IPEC chapter at Inderprastha Engineering College.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772461885/17c4fee4-c37e-4767-9182-d38cc3a9b949_oi5rly.jpg",
    imageAlt: "HI-O poster",
    href: "https://luma.com/6vc2jiem",
  },
  {
    id: "snowhack",
    title: "SnowHackIPEC",
    date: "31 January – 1 February 2026",
    location: "IPEC, Ghaziabad",
    category: "Winter hackathon",
    role: "HackShastra IPEC chapter",
    description:
      "A winter hackathon and 24-hour sprint from the IPEC chapter, bringing practical problem-solving into the campus community.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772402434/poster_towlyg.png",
    imageAlt: "SnowHackIPEC poster",
    href: "https://unstop.com/hackathons/snowhackipec-hackshastra-1613746",
  },
  {
    id: "texpo",
    title: "TEXPO’26",
    date: "26 February 2026",
    location: "SRM University–AP",
    category: "Technology expo",
    role: "HackShastra SRM–AP chapter",
    description:
      "A student innovation and industry technology expo, paired with the chapter’s official launch. A platform for student MVPs to meet industry perspectives.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772662521/WELCOME_ohhsyh.png",
    imageAlt: "TEXPO’26 poster",
    href: "https://unstop.com/competitions/texpo-2026-student-innovation-and-industry-technology-expo-srm-university-srmap-andhra-pradesh-1638340",
  },
  {
    id: "shubhshastra",
    title: "ShubhShastra",
    date: "28–29 March 2026",
    location: "Subharti University, Meerut",
    category: "AI hackathon",
    role: "Event collaboration",
    description:
      "HackShastra and Subharti University came together for a 24-hour national AI hackathon centred on building solutions to real challenges.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1774202755/NATIONAL_AI_HACKATHON_qjhiue.png",
    imageAlt: "ShubhShastra poster",
    href: "https://unstop.com/hackathons/shubhshastra-subharti-university-meerut-uttar-pradesh-india-1663561",
  },
  {
    id: "grand-hack",
    title: "Grand Hack IPEC",
    date: "26–27 September 2026",
    location: "IPEC, Ghaziabad",
    category: "National hackathon",
    role: "Organised with IPEC",
    description:
      "A national 24-hour hackathon organised by HackShastra with IPEC. An online mentorship phase preceded the in-person build, connecting preparation with execution.",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1782501435/grandhackipec_instagram_post.jpg_pke0kx.jpg",
    imageAlt: "Grand Hack IPEC poster",
    href: "https://unstop.com/p/grand-hack-ipec-hackshastra-1704703",
  },
];

export const hackshastraFounders = [
  {
    name: "Jai Chawla",
    firstName: "Jai",
    lastName: "Chawla",
    initial: "J",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772568692/5_oz9vt2.png",
    isTanmay: false,
  },
  {
    name: "Md Imran",
    firstName: "Md",
    lastName: "Imran",
    initial: "I",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772647474/cofounders_2_dqcol5.png",
    isTanmay: false,
  },
  {
    name: "Tanmay Tiwari",
    firstName: "Tanmay",
    lastName: "Tiwari",
    initial: "T",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772568692/1_f8hnlw.png",
    isTanmay: true,
  },
  {
    name: "Sumit Rathore",
    firstName: "Sumit",
    lastName: "Rathore",
    initial: "S",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772568692/4_snnvr9.png",
    isTanmay: false,
  },
  {
    name: "Uday Sharma",
    firstName: "Uday",
    lastName: "Sharma",
    initial: "U",
    image:
      "https://res.cloudinary.com/dunacoujw/image/upload/v1772568691/2_ipkls5.png",
    isTanmay: false,
  },
];
