// Everything the chapter pages say lives here, so copy can change without
// touching layout. All of it comes from Jo's resume. Music and Inspiration are
// empty because the resume says nothing about them: add entries to `records`
// and `pins` and the pages render them instead of their blank state.

export type Stat = {
  /** Exactly what is printed once settled, e.g. "$32,000". */
  value: string;
  label: string;
  /** Present when the figure should count up as it scrolls into view. */
  count?: { to: number; prefix?: string; suffix?: string; separator?: string };
};

export type Role = {
  org: string;
  title: string;
  when: string;
  where?: string;
  tools?: string[];
  stats?: Stat[];
  points: string[];
};

export type Project = {
  name: string;
  home: string;
  summary: string;
  stats?: Stat[];
  points: string[];
  tools?: string[];
};

export type RecordEntry = { title: string; by: string; note?: string; href?: string };
export type Pin = { name: string; note: string; href?: string };

export const contact = {
  email: "joshikdevelop@gmail.com",
  linkedin: "https://www.linkedin.com/in/veera-unnam/",
  linkedinLabel: "linkedin.com/in/veera-unnam",
  place: "Charlottesville, Virginia",
};

export const now: Role[] = [
  {
    org: "Shire Intelligence (YC F26)",
    title: "Founding Engineer",
    when: "January 2026 – Present",
    where: "Remote",
    tools: ["TypeScript", "Node.js", "OpenCV", "Supabase"],
    stats: [
      { value: "7", label: "restaurants deployed", count: { to: 7 } },
      { value: "$32,000", label: "in MRR", count: { to: 32000, prefix: "$", separator: "," } },
      { value: "$500K", label: "raised from Y Combinator", count: { to: 500, prefix: "$", suffix: "K" } },
    ],
    points: [
      "Led development of a computer vision state engine and real-time sync engine that uses CCTV footage to automate restaurant floor management, server routing, and kitchen optimization.",
      "Raised from Y Combinator in Fall 2026, plus an angel check from Andreessen Horowitz and Neel Jain.",
      "Co-led negotiation of a 35-restaurant deal with a major POS distributor.",
    ],
  },
  {
    org: "Alternative Investment Fund at UVA",
    title: "Probie Member",
    when: "September 2026 – Present",
    stats: [
      { value: "1 of 21", label: "probies selected" },
      { value: "550+", label: "applicants", count: { to: 550, suffix: "+" } },
    ],
    points: [
      "Selected through a multi-round interview process.",
      "Completed structured training in equity research, valuation, quantitative finance, and investment pricing with a small cohort.",
    ],
  },
];

export const before: Role[] = [
  {
    org: "7Brew Coffee",
    title: "Full-stack Software Engineering Intern",
    when: "May – August 2025, May – August 2026",
    where: "Springdale, AR",
    tools: ["Nuxt.js", "Python", "FastAPI", "MongoDB", "Sentry", "OpenCV"],
    stats: [
      { value: "450+", label: "stores using it", count: { to: 450, suffix: "+" } },
      { value: "$150,000+", label: "gift card value converted", count: { to: 150000, prefix: "$", suffix: "+", separator: "," } },
      { value: "~40", label: "hours saved each week" },
    ],
    points: [
      "Led development of a web app that converts Paytronix gift cards to Touchpoint, deployed in stores nationwide.",
      "Architected a PDF editing engine that modifies Adobe Illustrator files outside Adobe applications, preserving vector graphics.",
      "Shipped a full-stack app that lets stand owners auto-generate stand-specific fliers from Illustrator templates without an Adobe license, replacing a legacy tool that cost $6,000 a month.",
    ],
  },
  {
    org: "University of Arkansas Computer Vision Lab",
    title: "Computer Vision Research Intern",
    when: "September 2024 – August 2025",
    where: "Fayetteville, AR",
    stats: [
      { value: "93%", label: "IoU locating lesions", count: { to: 93, suffix: "%" } },
      { value: "86%", label: "accuracy classifying stage", count: { to: 86, suffix: "%" } },
      { value: "6,000+", label: "annotated images", count: { to: 6000, suffix: "+", separator: "," } },
    ],
    points: [
      "Led research and development of a novel multi-modal, multi-stage computer vision pipeline to locate and diagnose oral cancer lesions through high-noise image modalities like intraoral images.",
      "Collaborated with professors from the University of Sri Lanka, Stanford University, and Shanghai University to create a first-of-its-kind professionally annotated dataset.",
      "Awarded a $115,000 educational grant, an $8,000 stipend, and an invitation to present to Samsung executives.",
    ],
  },
];

export const alongside: Role[] = [
  {
    org: "My STEM Project",
    title: "Co-founder",
    when: "May 2024 – May 2026",
    where: "Palo Alto, CA",
    stats: [
      { value: "150", label: "students tutored", count: { to: 150 } },
      { value: "15", label: "countries", count: { to: 15 } },
      { value: "100k", label: "video views", count: { to: 100, suffix: "k" } },
    ],
    points: [
      "Co-founded a global nonprofit teaching computer science fundamentals to students in underserved communities.",
      "Raised $25,000 through private donations, Indian government grants, and national fundraising events.",
      "Ran 3 summer cohorts and produced 50+ educational videos.",
    ],
  },
  {
    org: "Bentonville Schools CTE Program",
    title: "Co-founder",
    when: "May 2024 – May 2026",
    where: "Bentonville, AR",
    stats: [{ value: "8", label: "client externship projects piloted", count: { to: 8 } }],
    points: [
      "Led Bentonville West High School CTE's first Software Engineer program, traveling to San Francisco, New York, and Chicago to build industry connections and draft partnership contracts.",
      "Worked with the District Representative to draft an MOU allowing international and underage students to take part in paid internships through a stipend system.",
    ],
  },
];

export const projects: Project[] = [
  {
    name: "Restaurant floor engine",
    home: "Shire Intelligence",
    summary: "A computer vision state engine and real-time sync engine that reads a restaurant's CCTV footage and automates how the floor runs.",
    points: ["Automates floor management, server routing, and kitchen optimization.", "Deployed in 7 restaurants."],
    tools: ["TypeScript", "Node.js", "OpenCV", "Supabase"],
  },
  {
    name: "Illustrator engine & flier generator",
    home: "7Brew Coffee",
    summary: "A PDF editing engine that changes Adobe Illustrator files outside Adobe's apps while preserving the vector graphics, and the app built on top of it.",
    stats: [
      { value: "450+", label: "stores", count: { to: 450, suffix: "+" } },
      { value: "300+", label: "fliers a month", count: { to: 300, suffix: "+" } },
    ],
    points: ["Stand owners generate their own fliers from templates, with no Adobe license.", "Replaced a legacy tool that cost $6,000 a month and saves about 40 hours a week."],
  },
  {
    name: "Gift card converter",
    home: "7Brew Coffee",
    summary: "A web app that converts Paytronix gift cards to Touchpoint, deployed in stores nationwide.",
    stats: [{ value: "$150,000+", label: "converted in its first four months", count: { to: 150000, prefix: "$", suffix: "+", separator: "," } }],
    points: [],
  },
  {
    name: "Oral cancer lesion pipeline",
    home: "University of Arkansas Computer Vision Lab",
    summary: "A novel multi-modal, multi-stage pipeline that locates and diagnoses oral cancer lesions in high-noise images, built on a first-of-its-kind dataset of 6,000+ professionally annotated images.",
    stats: [
      { value: "93%", label: "IoU locating lesions", count: { to: 93, suffix: "%" } },
      { value: "86%", label: "accuracy classifying stage", count: { to: 86, suffix: "%" } },
    ],
    points: ["Built with professors from the University of Sri Lanka, Stanford University, and Shanghai University."],
  },
  {
    name: "Video generation orchestrator",
    home: "YC x Anthropic Hackathon",
    summary: "An orchestration algorithm to improve video generation models.",
    points: ["Finalist: top 25 of 1,000 applicants from around the world."],
  },
  {
    name: "My STEM Project",
    home: "Nonprofit, co-founded",
    summary: "Computer science fundamentals for students in underserved communities, through tutoring and video.",
    stats: [
      { value: "50+", label: "videos produced", count: { to: 50, suffix: "+" } },
      { value: "100k", label: "views", count: { to: 100, suffix: "k" } },
    ],
    points: ["150 students across 15 countries, over 3 summer cohorts."],
  },
];

export const about = {
  name: "Veera Sai Joshik Unnam",
  paragraphs: [
    "Jo is short for Joshik. I'm at the University of Virginia as a Jefferson Scholar and Rodman Scholar, intending to study computer science and economics.",
    "I'm also a founding engineer at Shire Intelligence (YC F26), where we use computer vision on CCTV footage to automate restaurant floor management. Before that I researched oral cancer detection, built software used across 450+ 7Brew stores, and co-founded a nonprofit that taught computer science to students in 15 countries.",
  ],
  seal: "JEFFERSON SCHOLAR ✦ RODMAN SCHOLAR ✦ ",
  education: [
    {
      school: "University of Virginia",
      detail: "Intended B.A. in Computer Science and Economics",
      extra: "Jefferson Scholar, Rodman Scholar",
      when: "May 2030",
      where: "Charlottesville, VA",
    },
    {
      school: "Bentonville West High School",
      detail: "Valedictorian (1 of 652)",
      extra: "GPA 4.63 weighted, 4.0 unweighted. ACT 35.",
      when: "August 2022 – May 2026",
      where: "Centerton, AR",
    },
  ],
  honors: [
    {
      title: "YC x Anthropic Hackathon Finalist",
      when: "January 2026",
      note: "Top 25 of 1,000 applicants from around the world.",
    },
    {
      title: "Samsung Solve for Tomorrow National Champion",
      when: "July 2025",
      note: "Selected as a Samsung Student Ambassador for the Winter Olympics. Invited to present at Samsung's HQ and the US Capitol.",
    },
    {
      title: "International Science Fair, 3rd Grand Award",
      when: "May 2025",
      note: "Translational Medical Sciences. Awarded a $2,000 grant to present in Columbus, Ohio.",
    },
  ],
  languages: ["C", "C++", "Java", "JavaScript", "TypeScript", "Python", "Dart", "Go", "Rust"],
  frameworks: ["Flutter", "React", "Next.js", "Vercel", "FastAPI", "OpenCV", "TensorFlow", "Hugging Face", "AWS", "GCP", "Docker", "Kubernetes"],
};

/** Add records here, e.g. { title: "Album", by: "Artist", note: "Why it stays on" }. */
export const records: RecordEntry[] = [];

/** Add people, books, or ideas here, e.g. { name: "Who or what", note: "Why it stuck" }. */
export const pins: Pin[] = [];

export const chapterCopy = {
  music: {
    headline: "What's on the turntable.",
    intro: "The crate is still being packed. Records land here soon.",
    note: "side A, coming up",
  },
  projects: {
    headline: "Things I've built.",
    intro: "Six builds, from restaurant floors to oral cancer research. Scroll and the pile grows.",
    note: "out of the workshop",
  },
  experience: {
    headline: "Where the hours went.",
    intro: "A founding engineer role, a fund, an internship, a research lab, and two things I started alongside school.",
    note: "the ledger so far",
  },
  inspiration: {
    headline: "Pinned above the desk.",
    intro: "The board is up. The pins are on their way.",
    note: "more pins soon",
  },
  "about-me": {
    headline: about.name,
    intro: about.paragraphs[0],
    note: "the short version",
  },
} as const;

export type ChapterId = keyof typeof chapterCopy;
