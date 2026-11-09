// The full-screen pages behind each project and job.
//
// Names, numbers, dates and the bullet points come straight from `lib/chapters.ts`,
// which comes from the resume. Stories made with `told` are from Jo's college
// application, trimmed. Left out on purpose: Jo's own health and immigration status,
// recommenders, and students by name. The OralScan and lab stories do mention a
// grandparent's cancer scare, pending Jo's decision on making that public. Everything
// marked `placeholder: true` is filler that shows a visible "placeholder" tag:
//   - To use a real image, put it in `public/images/` and replace the plate with
//     { src, alt, caption } and no `placeholder` flag.
//   - To use real words, replace the story's `body` and delete its flag.
// Nothing marked placeholder has been checked against what actually happened.

import { alongside, before, now, projects, type Project, type Role, type Stat } from "./chapters";

export type Plate = { src: string; alt: string; caption: string; placeholder?: boolean };
export type Story = { heading: string; body: string[]; placeholder?: boolean };

export type Entry = {
  slug: string;
  name: string;
  /** The small line over the name: where a project lives, or a job's title. */
  home: string;
  when?: string;
  where?: string;
  summary: string;
  stats?: Stat[];
  pointsHeading: string;
  points: string[];
  tools?: string[];
  hero: Plate;
  gallery: [Plate, Plate];
  /** The first runs beside the second gallery image; the second is a slip at the end. */
  stories: [Story, Story];
  links?: { label: string; href: string }[];
};

/** Paper-cut art made for this site. Swap each for a real screenshot or photo. */
const art = (name: string, alt: string, caption: string): Plate => ({
  src: `/images/placeholders/${name}.webp`,
  alt: `Paper-cut illustration of ${alt}`,
  caption,
  placeholder: true,
});

const story = (heading: string, ...body: string[]): Story => ({ heading, body, placeholder: true });
const told = (heading: string, ...body: string[]): Story => ({ heading, body });

const isefLink = { label: "The project at ISEF", href: "https://isef.net/project/tmed071t-multi-model-ai-oral-cancer-early-diagnosis-system" };

const projectExtras: Record<string, Pick<Entry, "slug" | "hero" | "gallery" | "stories" | "links">> = {
  "Restaurant floor engine": {
    slug: "floor-engine",
    hero: art("floor-plan", "a restaurant floor plan with tracked tables and a server's route", "Swap for: the live floor view"),
    gallery: [
      art("floor-camera", "a ceiling camera watching two people at a table", "Swap for: a camera frame with detections drawn on"),
      art("floor-kitchen", "order tickets hanging over a kitchen line", "Swap for: the kitchen view or a photo from a deployment"),
    ],
    stories: [
      story("The problem", "A few lines on what a busy shift looks like before the engine: who is watching the floor, what gets missed, and which of those calls you chose to automate first."),
      story("How it reads a room", "Walk through one camera frame here: what the state engine pulls out of it, how the sync engine passes that on, and what a server sees as a result."),
    ],
  },
  "Illustrator engine & flier generator": {
    slug: "flier-engine",
    hero: art("flier-stack", "a fan of printed coffee stand fliers", "Swap for: a generated flier next to its template"),
    gallery: [
      art("flier-vector", "a vector curve with its handles showing", "Swap for: an Illustrator file opened in the engine"),
      art("flier-stands", "three small drive-through stands with fliers up", "Swap for: a flier up at a real stand"),
    ],
    stories: [
      told("The problem", "Every flier or poster at a 7Brew stand starts from a template made in Adobe, and the company was paying $6,000 a month for a tool to turn those into finished materials. The goal was to replace it with something stand owners could use without an Adobe license."),
      told("The hard part", "Editing Adobe files outside Adobe's apps is hard enough that software companies license engines for it at $4,000 to $6,000. I wrote a PDF editing engine from scratch instead, and it keeps the vector graphics intact. I also designed the UI, built the backend, and handled the architecture and security."),
    ],
  },
  "Gift card converter": {
    slug: "gift-cards",
    hero: art("gift-cards", "one gift card transferring its balance to another", "Swap for: the conversion screen"),
    gallery: [
      art("gift-terminal", "a card beside a point-of-sale terminal and a receipt", "Swap for: the app in use at a store"),
      art("gift-growth", "bars and coin stacks climbing over time", "Swap for: the real conversion numbers over those four months"),
    ],
    stories: [
      told("What I built", "I led development of the whole app, from the UI to the database architecture to the backend. It converts gift cards from one format to another, and it's deployed nationally across 7Brew's stands."),
      story("The problem", "Describe why cards needed to move from Paytronix to Touchpoint at all, and what a customer holding an old card ran into at the window."),
    ],
  },
  "OralScan": {
    slug: "lesion-pipeline",
    hero: art("lesion-scan", "an abstract scan with one region boxed", "Swap for: a figure from the paper or poster"),
    gallery: [
      art("lesion-grid", "a contact sheet of annotated image tiles", "Swap for: a sample of the annotated dataset, if it can be shown"),
      art("lesion-stages", "a confusion matrix beside staged results", "Swap for: the real results figure"),
    ],
    stories: [
      told("Why I built it", "A small bump in my grandfather's mouth threw our home into disarray. Five weeks and three doctors later, we finally got good news: it wasn't cancer. Later that year, after 500 cold emails, I joined the University of Arkansas Computer Vision Lab. I spent the next year devouring research papers, burning Colab credits, and coding late into the night, trying to build the accessible diagnosis tool he had needed."),
      told("From model to app", "I led a team of 3 students to build OralScan, a mobile app that houses the model. We showed it to the Arkansas Dental Board and to Samsung's Head of Medical Research, and it placed 3rd in Translational Medical Sciences at ISEF. More than the numbers, it was the first time I felt the thrill of building something that truly mattered."),
    ],
    links: [isefLink],
  },
  "Video generation orchestrator": {
    slug: "video-orchestrator",
    hero: art("video-strip", "a strip of film frames with a small figure moving through them", "Swap for: frames the orchestrator produced"),
    gallery: [
      art("video-graph", "inputs flowing through a central node to two videos", "Swap for: a diagram of the algorithm"),
      art("video-ribbon", "an award rosette", "Swap for: a photo from the finals"),
    ],
    stories: [
      story("The idea", "What goes wrong when you ask a video model for something long or complicated, and what orchestrating it changes."),
      story("The weekend", "The story of the hackathon: what you built first, what got cut, and what you showed the judges."),
    ],
  },
  "My STEM Project": {
    slug: "my-stem-project",
    hero: art("stem-globe", "a globe with fifteen pins joined by thread", "Swap for: a map of where students joined from"),
    gallery: [
      art("stem-laptop", "a laptop showing code beside a notebook and pencil", "Swap for: a screenshot from a lesson"),
      art("stem-videos", "a wall of six video thumbnails", "Swap for: real thumbnails from the channel"),
    ],
    stories: [
      told("Why it started", "I started it with a few friends, to give students around the world the quality introduction to computer science I didn't have growing up in India. 115 students from 13 countries joined our first welcome call."),
      told("What students built", "Every student leaves with a portfolio project. They come from different places, but they share a goal: using computer science to solve a problem around them. One presented an app that empowers women by sharing curated success stories. Others took on problems like food waste."),
    ],
  },
};

const fromProject = (project: Project): Entry => ({
  ...projectExtras[project.name],
  name: project.name,
  home: project.home,
  summary: project.summary,
  stats: project.stats,
  pointsHeading: "The short version",
  points: project.points,
  tools: project.tools,
});

export const projectEntries: Entry[] = projects.map(fromProject);

const roleExtras: Record<string, Pick<Entry, "slug" | "summary" | "hero" | "gallery" | "stories" | "links">> = {
  "Shire Intelligence (YC F26)": {
    slug: "shire",
    summary: "Computer vision on CCTV footage, automating how restaurant floors run.",
    hero: art("floor-plan", "a restaurant floor plan with tracked tables and a server's route", "Swap for: the product, or the team"),
    gallery: [
      art("floor-camera", "a ceiling camera watching two people at a table", "Swap for: a photo from a deployment"),
      art("floor-kitchen", "order tickets hanging over a kitchen line", "Swap for: a restaurant you work with, if they're happy to be shown"),
    ],
    stories: [
      story("What the job is", "What being a founding engineer means day to day here: what you own, what you ship, and how close you get to the restaurants themselves."),
      story("What I've learned", "Something you know now that you did not in January, whether from the 35-restaurant negotiation or from going through YC."),
    ],
  },
  "Alternative Investment Fund at UVA": {
    slug: "aif-uva",
    summary: "A small, selective student fund, and structured training in how to price an investment.",
    hero: art("fund-chart", "a candlestick chart on ledger paper", "Swap for: a photo from the fund or a pitch slide"),
    gallery: [
      art("fund-model", "a magnifying glass over a valuation spreadsheet", "Swap for: a model or pitch you are allowed to share"),
      art("fund-cohort", "21 figures standing among hundreds of dots", "Swap for: a photo of the cohort"),
    ],
    stories: [
      story("What probies do", "What the training covers week to week, and what a good piece of work looks like at the end of it."),
      story("Why finance", "Why a founding engineer also joined an investment fund, and what the two teach each other."),
    ],
  },
  "7Brew Coffee": {
    slug: "7brew",
    summary: "Two summers building internal software that stores across the country use.",
    hero: art("flier-stack", "a fan of printed coffee stand fliers", "Swap for: the flier generator in use"),
    gallery: [
      art("gift-cards", "one gift card transferring its balance to another", "Swap for: the gift card converter"),
      art("flier-stands", "three small drive-through stands with fliers up", "Swap for: a photo from Springdale or a stand"),
    ],
    stories: [
      told("What the job was", "I worked on a software team of 10 engineers and built two full-stack apps end to end: one that converts gift cards, and one that lets the marketing team generate personalized fliers from Adobe templates."),
      told("The side quest", "I also created a drink flavor that's now on 7Brew's national menu."),
    ],
  },
  "University of Arkansas Computer Vision Lab": {
    slug: "cv-lab",
    summary: "A year of research into finding and staging oral cancer lesions in noisy images.",
    hero: art("lesion-scan", "an abstract scan with one region boxed", "Swap for: a figure from the research"),
    gallery: [
      art("lesion-grid", "a contact sheet of annotated image tiles", "Swap for: the dataset, if it can be shown"),
      art("video-ribbon", "an award rosette", "Swap for: a photo of the Samsung presentation"),
    ],
    stories: [
      told("How it started", "After my grandfather's cancer scare, I sent 500 cold emails looking for a lab that would take me. I ended up at the University of Arkansas working under Dr. Michael Gashler, building a multi-stage, multi-modal architecture to locate, diagnose, and stage oral cancer lesions."),
      told("What came after", "The Samsung Solve for Tomorrow win took me to Washington, DC to present the work to a panel of judges. Samsung's prize also brought technology to my school district, and I served on the board that decided where it went, helping close the gap some of our elementary and middle schools faced."),
    ],
    links: [isefLink],
  },
  "My STEM Project": {
    slug: "my-stem",
    summary: "A global nonprofit teaching computer science fundamentals to students in underserved communities.",
    hero: art("stem-globe", "a globe with fifteen pins joined by thread", "Swap for: students, or a map of where they joined from"),
    gallery: [
      art("stem-videos", "a wall of six video thumbnails", "Swap for: real thumbnails from the channel"),
      art("stem-laptop", "a laptop showing code beside a notebook and pencil", "Swap for: a screenshot from a lesson"),
    ],
    stories: [
      told("Why it started", "I started it with a few friends, to give students around the world the quality introduction to computer science I didn't have growing up in India. 115 students from 13 countries joined our first welcome call."),
      told("Running it", "We ran three summers of bootcamps where students learned to program and built a portfolio project, plus weekly classes to go over the material and answer questions. The videos cover C++, Python, and Java."),
    ],
  },
  "Bentonville Schools CTE Program": {
    slug: "bentonville-cte",
    summary: "Bentonville West's first Software Engineer program, built with industry partners and paid internships.",
    hero: art("cte-cities", "a thread running between three city skylines", "Swap for: a photo from one of the trips"),
    gallery: [
      art("cte-mou", "a signed and stamped agreement", "Swap for: the program launch, or the agreement being signed"),
      art("cte-desks", "students at computers in front of a board", "Swap for: students working on an externship project"),
    ],
    stories: [
      told("Why it needed building", "Many students couldn't take part in paid industry internships because of visa restrictions and limited school connections. I spoke before our school board and CTE director and proposed an MOU that would let students in pathways like computer science take paid internships through the school."),
      told("What happened next", "It was approved and implemented. I was then invited to be the only student panelist at our school's first Industry Connection Summit, helping attract new partners, and I convinced six startups, from our local area to Silicon Valley, to interview my peers for internships."),
    ],
  },
};

const fromRole = (role: Role): Entry => ({
  ...roleExtras[role.org],
  name: role.org,
  home: role.title,
  when: role.when,
  where: role.where,
  stats: role.stats,
  pointsHeading: "What I did",
  points: role.points,
  tools: role.tools,
});

export const roleGroups: { label: string; hint: string; entries: Entry[] }[] = [
  { label: "Now", hint: "still at it", entries: now.map(fromRole) },
  { label: "Before", hint: "where I learned it", entries: before.map(fromRole) },
  { label: "Alongside", hint: "things I started", entries: alongside.map(fromRole) },
];

export const roleEntries: Entry[] = roleGroups.flatMap(group => group.entries);
