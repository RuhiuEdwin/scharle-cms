// One-time scaffolding script — writes content-type/component schema files
// matching design/content-model.md (plus the two additions flagged in
// content/COPY.md: Course.careerOutcomes and the SiteSettings single type).
// Run once with `node scripts/generate-schema.js`, then delete or ignore;
// Strapi's Content-Type Builder takes over from the admin UI after this.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log("wrote", relPath);
}

function writeJson(relPath, obj) {
  writeFile(relPath, JSON.stringify(obj, null, 2) + "\n");
}

const routerFactory = (id) =>
  `/**\n * ${id} router\n */\n\nimport { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${id}.${id}');\n`;

const controllerFactory = (id) =>
  `/**\n * ${id} controller\n */\n\nimport { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${id}.${id}');\n`;

const serviceFactory = (id) =>
  `/**\n * ${id} service\n */\n\nimport { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${id}.${id}');\n`;

function scaffoldApi(id, schema) {
  writeJson(`src/api/${id}/content-types/${id}/schema.json`, schema);
  writeFile(`src/api/${id}/routes/${id}.ts`, routerFactory(id));
  writeFile(`src/api/${id}/controllers/${id}.ts`, controllerFactory(id));
  writeFile(`src/api/${id}/services/${id}.ts`, serviceFactory(id));
}

// ---------- Components ----------

writeJson("src/components/shared/list-item.json", {
  collectionName: "components_shared_list_items",
  info: { displayName: "List Item", icon: "bulletList" },
  options: {},
  attributes: {
    text: { type: "string", required: true },
  },
});

writeJson("src/components/shared/rich-text-block.json", {
  collectionName: "components_shared_rich_text_blocks",
  info: { displayName: "Rich Text Block", icon: "align-left" },
  options: {},
  attributes: {
    heading: { type: "string", required: true },
    body: { type: "richtext", required: true },
  },
});

writeJson("src/components/shared/image-text-block.json", {
  collectionName: "components_shared_image_text_blocks",
  info: { displayName: "Image Text Block", icon: "picture" },
  options: {},
  attributes: {
    image: { type: "media", multiple: false, allowedTypes: ["images"], required: true },
    heading: { type: "string", required: true },
    body: { type: "richtext", required: true },
  },
});

writeJson("src/components/shared/step.json", {
  collectionName: "components_shared_steps",
  info: { displayName: "Step", icon: "arrowRight" },
  options: {},
  attributes: {
    title: { type: "string", required: true },
    body: { type: "text", required: true },
  },
});

writeJson("src/components/shared/checklist-item.json", {
  collectionName: "components_shared_checklist_items",
  info: { displayName: "Checklist Item", icon: "check" },
  options: {},
  attributes: {
    text: { type: "string", required: true },
  },
});

writeJson("src/components/shared/social-link.json", {
  collectionName: "components_shared_social_links",
  info: { displayName: "Social Link", icon: "link" },
  options: {},
  attributes: {
    platform: {
      type: "enumeration",
      enum: ["Instagram", "TikTok", "Facebook"],
      required: true,
    },
    url: { type: "string", required: true },
  },
});

// ---------- Collection Types ----------

scaffoldApi("course", {
  kind: "collectionType",
  collectionName: "courses",
  info: { singularName: "course", pluralName: "courses", displayName: "Course" },
  options: { draftAndPublish: true },
  attributes: {
    name: { type: "string", required: true },
    slug: { type: "uid", targetField: "name", required: true },
    duration: { type: "string", required: true },
    intakeMonths: {
      type: "enumeration",
      enum: ["January", "May", "September"],
      enumName: "IntakeMonth",
    },
    overview: { type: "richtext", required: true },
    whatYoullLearn: { type: "component", repeatable: true, component: "shared.list-item" },
    careerOutcomes: { type: "component", repeatable: true, component: "shared.list-item" },
    heroImage: { type: "media", multiple: false, allowedTypes: ["images"] },
    heroVideo: { type: "media", multiple: false, allowedTypes: ["videos"] },
    featuredOnHome: { type: "boolean", default: false },
    order: { type: "integer", default: 0 },
  },
});

scaffoldApi("gallery-item", {
  kind: "collectionType",
  collectionName: "gallery_items",
  info: { singularName: "gallery-item", pluralName: "gallery-items", displayName: "Gallery Item" },
  options: { draftAndPublish: true },
  attributes: {
    image: { type: "media", multiple: false, allowedTypes: ["images"], required: true },
    caption: { type: "string" },
    category: { type: "enumeration", enum: ["Studio", "Students"], required: true },
    showOnAbout: { type: "boolean", default: false },
    order: { type: "integer", default: 0 },
  },
});

scaffoldApi("why-scharle-highlight", {
  kind: "collectionType",
  collectionName: "why_scharle_highlights",
  info: {
    singularName: "why-scharle-highlight",
    pluralName: "why-scharle-highlights",
    displayName: "Why Scharle Highlight",
  },
  options: { draftAndPublish: true },
  attributes: {
    title: { type: "string", required: true },
    body: { type: "text", required: true },
    image: { type: "media", multiple: false, allowedTypes: ["images"] },
    order: { type: "integer", default: 0 },
  },
});

scaffoldApi("student-life-highlight", {
  kind: "collectionType",
  collectionName: "student_life_highlights",
  info: {
    singularName: "student-life-highlight",
    pluralName: "student-life-highlights",
    displayName: "Student Life Highlight / Testimonial",
  },
  options: { draftAndPublish: true },
  attributes: {
    image: { type: "media", multiple: false, allowedTypes: ["images"], required: true },
    caption: { type: "string" },
    quote: { type: "text" },
    attribution: { type: "string" },
    order: { type: "integer", default: 0 },
  },
});

scaffoldApi("booking-request", {
  kind: "collectionType",
  collectionName: "booking_requests",
  info: { singularName: "booking-request", pluralName: "booking-requests", displayName: "Booking Request" },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: "string", required: true },
    phone: { type: "string", required: true },
    courseInterest: { type: "relation", relation: "manyToOne", target: "api::course.course" },
    preferredDate: { type: "date" },
    honeypot: { type: "string" },
    status: {
      type: "enumeration",
      enum: ["new", "contacted", "archived"],
      default: "new",
    },
    submittedAt: { type: "datetime" },
  },
});

scaffoldApi("contact-submission", {
  kind: "collectionType",
  collectionName: "contact_submissions",
  info: {
    singularName: "contact-submission",
    pluralName: "contact-submissions",
    displayName: "Contact Submission",
  },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: "string", required: true },
    email: { type: "email", required: true },
    message: { type: "richtext", required: true },
    honeypot: { type: "string" },
    status: {
      type: "enumeration",
      enum: ["new", "read", "archived"],
      default: "new",
    },
    submittedAt: { type: "datetime" },
  },
});

// ---------- Single Types ----------

scaffoldApi("home-page", {
  kind: "singleType",
  collectionName: "home_page",
  info: { singularName: "home-page", pluralName: "home-pages", displayName: "Home Page" },
  options: { draftAndPublish: true },
  attributes: {
    heroEyebrow: { type: "string" },
    heroHeadline: { type: "string", required: true },
    heroSubcopy: { type: "text" },
    heroMedia: { type: "media", multiple: true, allowedTypes: ["images", "videos"] },
    seoTitle: { type: "string" },
    seoDescription: { type: "text" },
  },
});

scaffoldApi("about-page", {
  kind: "singleType",
  collectionName: "about_page",
  info: { singularName: "about-page", pluralName: "about-pages", displayName: "About Page" },
  options: { draftAndPublish: true },
  attributes: {
    whoWeAre: { type: "component", repeatable: false, component: "shared.image-text-block" },
    mission: { type: "component", repeatable: false, component: "shared.rich-text-block" },
    vision: { type: "component", repeatable: false, component: "shared.rich-text-block" },
    seoTitle: { type: "string" },
    seoDescription: { type: "text" },
  },
});

scaffoldApi("courses-page", {
  kind: "singleType",
  collectionName: "courses_page",
  info: { singularName: "courses-page", pluralName: "courses-pages", displayName: "Courses Page" },
  options: { draftAndPublish: true },
  attributes: {
    introHeading: { type: "string" },
    introBody: { type: "text" },
    seoTitle: { type: "string" },
    seoDescription: { type: "text" },
  },
});

scaffoldApi("admissions-page", {
  kind: "singleType",
  collectionName: "admissions_page",
  info: { singularName: "admissions-page", pluralName: "admissions-pages", displayName: "Admissions Page" },
  options: { draftAndPublish: true },
  attributes: {
    howToJoinSteps: { type: "component", repeatable: true, component: "shared.step" },
    requirementsChecklist: { type: "component", repeatable: true, component: "shared.checklist-item" },
    activeIntakeMonths: {
      type: "enumeration",
      enum: ["January", "May", "September"],
    },
    registrationFeeNote: { type: "string" },
    seoTitle: { type: "string" },
    seoDescription: { type: "text" },
  },
});

scaffoldApi("contact-page", {
  kind: "singleType",
  collectionName: "contact_page",
  info: { singularName: "contact-page", pluralName: "contact-pages", displayName: "Contact Page" },
  options: { draftAndPublish: true },
  attributes: {
    phone: { type: "string" },
    email: { type: "email" },
    address: { type: "string", default: "Outspan Plaza, Nyeri Town" },
    mapEmbedUrl: { type: "string" },
    socialLinks: { type: "component", repeatable: true, component: "shared.social-link" },
    seoTitle: { type: "string" },
    seoDescription: { type: "text" },
  },
});

scaffoldApi("gallery-page", {
  kind: "singleType",
  collectionName: "gallery_page",
  info: { singularName: "gallery-page", pluralName: "gallery-pages", displayName: "Gallery Page" },
  options: { draftAndPublish: true },
  attributes: {
    introHeading: { type: "string" },
    seoTitle: { type: "string" },
    seoDescription: { type: "text" },
  },
});

scaffoldApi("site-setting", {
  kind: "singleType",
  collectionName: "site_settings",
  info: { singularName: "site-setting", pluralName: "site-settings", displayName: "Site Settings" },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: "string", default: "Scharle Beauty College" },
    tagline: { type: "string", default: "Learn It. Live It. Glow It." },
    phone: { type: "string" },
    email: { type: "email" },
    address: { type: "string", default: "Outspan Plaza, Nyeri Town" },
    socialLinks: { type: "component", repeatable: true, component: "shared.social-link" },
  },
});

console.log("\nAll content types + components written.");
