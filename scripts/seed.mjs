// One-time seed script — populates every content type with the copy from
// content/COPY.md (plus real uploaded images via Strapi's media library,
// not just text) so frontend integration isn't blocked on manual data
// entry. Run with: node scripts/seed.mjs
// Requires STRAPI_BACKEND_FULLACCESS_TOKEN in the environment (via
// `doppler run -- node scripts/seed.mjs`).

const BASE = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_BACKEND_FULLACCESS_TOKEN;

if (!TOKEN) {
  console.error("Missing STRAPI_BACKEND_FULLACCESS_TOKEN — run via `doppler run -- node scripts/seed.mjs`");
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json();
}

const uploadCache = new Map();

async function uploadImage(unsplashId, fileName) {
  if (uploadCache.has(unsplashId)) return uploadCache.get(unsplashId);
  // Reuse an existing upload if this script already ran (idempotent re-runs).
  const existing = await api(`/api/upload/files?filters[name][$eq]=${fileName}.jpg`);
  if (Array.isArray(existing) && existing.length > 0) {
    uploadCache.set(unsplashId, existing[0].id);
    console.log(`  reusing image: ${fileName} (id ${existing[0].id})`);
    return existing[0].id;
  }

  const url = `https://images.unsplash.com/photo-${unsplashId}?w=1200&q=75&fm=jpg&fit=crop&auto=format`;
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`fetch image ${unsplashId} -> ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());

  const form = new FormData();
  form.append("files", new Blob([buf], { type: "image/jpeg" }), `${fileName}.jpg`);

  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  if (!res.ok) throw new Error(`upload ${fileName} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const [uploaded] = await res.json();
  uploadCache.set(unsplashId, uploaded.id);
  console.log(`  uploaded image: ${fileName} (id ${uploaded.id})`);
  return uploaded.id;
}

async function setSingleType(uid, data) {
  await api(`/api/${uid}`, { method: "PUT", body: JSON.stringify({ data }) });
  console.log(`✓ ${uid}`);
}

async function createEntry(uid, data) {
  return api(`/api/${uid}`, { method: "POST", body: JSON.stringify({ data }) });
}

async function main() {
  console.log("Uploading images…");
  const img = {
    hero: await uploadImage("1707409066859-a90674383d19", "hero-group"),
    about: await uploadImage("1633681926022-84c23e8cb2d6", "studio-interior"),
    hairdressing: await uploadImage("1634449571010-02389ed0f9b0", "hairdressing"),
    barbering: await uploadImage("1647140655214-e4a2d914971f", "barbering"),
    makeup: await uploadImage("1709477542149-f4e0e21d590b", "makeup-artistry"),
    nails: await uploadImage("1632345031435-8727f6897d53", "nail-technology"),
    beautyTherapy: await uploadImage("1616394584738-fc6e612e71b9", "beauty-therapy"),
    cosmetology: await uploadImage("1707979577466-2d6109c68a45", "cosmetology"),
    gradShoot: await uploadImage("1633329712165-4e578376eb87", "grad-shoot"),
    contentDay: await uploadImage("1695408247109-3bf125ad0538", "content-day"),
  };

  console.log("\nSeeding Site Settings…");
  await setSingleType("site-setting", {
    name: "Scharle Beauty College",
    tagline: "Learn It. Live It. Glow It.",
    phone: "0712 345 678",
    email: "hello@scharlebeauty.com",
    address: "Outspan Plaza, Nyeri Town",
    socialLinks: [
      { platform: "Instagram", url: "#" },
      { platform: "TikTok", url: "#" },
      { platform: "Facebook", url: "#" },
      { platform: "WhatsApp", url: "https://wa.me/254712345678" },
    ],
    calendlyUrl: "https://calendly.com/scharlebeauty/discovery-call",
  });

  console.log("\nSeeding Home Page…");
  await setSingleType("home-page", {
    heroEyebrow: "Nyeri Town · Est. Beauty & Barbering Studio",
    heroHeadline: "Learn it. Live it. Glow it.",
    heroSubcopy:
      "Hands-on training in hair, skin, nails, makeup, and barbering, taught by people who still do the work, in a studio built for real practice, not just theory.",
    heroMedia: [img.hero],
    seoTitle: "Scharle Beauty College | Learn It. Live It. Glow It.",
    seoDescription:
      "Hands-on training in hair, skin, nails, makeup, and barbering at Scharle Beauty College: Nyeri Town's realest beauty school. Apply or book a visit today.",
  });

  console.log("\nSeeding About Page…");
  await setSingleType("about-page", {
    whoWeAre: {
      image: img.about,
      heading: "Nyeri's Studio for Real Beauty Careers",
      body: "Scharle trains hairdressers, therapists, makeup artists, nail techs, and barbers in a working studio, not a lecture hall; every skill is practiced on real clients before you graduate.",
    },
    mission: {
      heading: "Train Real Skills, Build Real Confidence",
      body: "Every graduate leaves with hands-on technique, a client-ready portfolio, and the confidence to work anywhere from day one.",
    },
    vision: {
      heading: "The School the Industry Hires From",
      body: "To be Nyeri's, and eventually Kenya's, first call when a salon, spa, or studio needs someone who already knows the chair.",
    },
    seoTitle: "About Scharle Beauty College | Nyeri's Studio for Real Beauty Careers",
    seoDescription:
      "Who Scharle Beauty College is, our mission and vision, and what student life looks like at our Nyeri Town studio.",
  });

  console.log("\nSeeding Courses Page…");
  await setSingleType("courses-page", {
    introHeading: "Six Paths. One Studio.",
    introBody:
      "Every program runs on the same principle: real technique, real clients, real portfolio. Tap a program to see duration, intakes, and what you'll actually learn.",
    seoTitle: "Courses | Scharle Beauty College",
    seoDescription:
      "Six hands-on programs at Scharle Beauty College: Hairdressing & Styling, Beauty Therapy, Cosmetology, Makeup Artistry, Nail Technology, and Barbering.",
  });

  console.log("\nSeeding Admissions Page…");
  await setSingleType("admissions-page", {
    howToJoinSteps: [
      { title: "Inquire", body: "Call, DM, or drop by the studio to ask about a course." },
      { title: "Visit or Apply", body: "Book a school visit or submit your application directly." },
      { title: "Enroll & Start", body: "Confirm your intake date and show up on day one." },
    ],
    requirementsChecklist: [
      { text: "KCPE or KCSE certificate (copy)" },
      { text: "National ID or birth certificate" },
      { text: "2 passport photos" },
      { text: "Registration fee" },
    ],
    activeIntakeMonths: "January",
    registrationFeeNote: "Contact the studio for current registration fee amount",
    seoTitle: "Admissions | Scharle Beauty College",
    seoDescription:
      "How to join Scharle Beauty College: requirements, intakes, and booking a school visit in Nyeri Town.",
  });

  console.log("\nSeeding Contact Page…");
  await setSingleType("contact-page", {
    phone: "0712 345 678",
    email: "hello@scharlebeauty.com",
    address: "Outspan Plaza, Nyeri Town",
    mapEmbedUrl: "",
    socialLinks: [
      { platform: "Instagram", url: "#" },
      { platform: "TikTok", url: "#" },
      { platform: "Facebook", url: "#" },
      { platform: "WhatsApp", url: "https://wa.me/254712345678" },
    ],
    seoTitle: "Contact | Scharle Beauty College",
    seoDescription:
      "Get in touch with Scharle Beauty College: phone, email, and our Outspan Plaza, Nyeri Town location.",
  });

  console.log("\nSeeding Gallery Page…");
  await setSingleType("gallery-page", {
    introHeading: "The Studio, in Motion",
    seoTitle: "Gallery | Scharle Beauty College",
    seoDescription: "The Scharle Beauty College studio and student work, Nyeri Town.",
  });

  console.log("\nSeeding Courses…");
  const courses = [
    {
      name: "Hairdressing & Styling",
      duration: "6 months",
      fee: "KES 60,000 total programme fee",
      intakeMonths: ["January", "May", "September"],
      overview: "Cutting, coloring, braiding, and styling for every hair type and occasion.",
      whatYoullLearn: ["Cutting & styling fundamentals", "Chemical treatments & coloring", "Braiding & weaving techniques", "Client consultation & retail"],
      careerOutcomes: ["Salon stylist", "Session hairdresser", "Session assistant", "Freelance/mobile stylist"],
      heroImage: img.hairdressing,
      featuredOnHome: true,
      order: 1,
      instructors: [{ name: "Grace Mwangi", role: "Lead Hairdressing Instructor", image: img.hairdressing }],
      faqs: [
        { question: "Do I need prior experience?", answer: "No — this course starts from the fundamentals and builds up to advanced technique." },
        { question: "Do I get certified?", answer: "Yes, you receive a Scharle Beauty College certificate on successful completion." },
        { question: "Is training hands-on?", answer: "Yes — you're practicing on real clients from term one, not just mannequins." },
      ],
    },
    {
      name: "Beauty Therapy",
      duration: "6 months",
      fee: "KES 60,000 total programme fee",
      intakeMonths: ["January", "May", "September"],
      overview: "Skincare, facials, waxing, and spa treatments, hands-on from week one.",
      whatYoullLearn: ["Facials & skin analysis", "Waxing & hair removal", "Body treatments & massage basics", "Spa hygiene & client care"],
      careerOutcomes: ["Spa therapist", "Skincare specialist", "Beauty salon technician", "Mobile beauty therapist"],
      heroImage: img.beautyTherapy,
      featuredOnHome: false,
      order: 2,
      instructors: [{ name: "Faith Wanjiru", role: "Beauty Therapy Instructor", image: img.beautyTherapy }],
      faqs: [
        { question: "Is this course physically demanding?", answer: "It involves standing and hands-on practice, but no more than a typical spa/salon shift." },
        { question: "What equipment do I need?", answer: "Core tools are provided in the studio; a personal kit list is shared at enrollment." },
      ],
    },
    {
      name: "Cosmetology",
      duration: "9 months",
      fee: "KES 85,000 total programme fee",
      intakeMonths: ["January", "September"],
      overview: "Full-spectrum hair and skin care, plus salon management basics.",
      whatYoullLearn: ["Full-spectrum hair & skin care", "Product chemistry basics", "Salon management fundamentals"],
      careerOutcomes: ["All-round salon cosmetologist", "Salon supervisor/manager track", "Product consultant"],
      heroImage: img.cosmetology,
      featuredOnHome: false,
      order: 3,
      instructors: [{ name: "Esther Njoki", role: "Cosmetology Program Lead", image: img.cosmetology }],
      faqs: [
        { question: "Why is this course longer than the others?", answer: "It covers both hair and skin disciplines plus salon management, so it runs a full 9 months." },
        { question: "Can I specialize after graduating?", answer: "Yes — cosmetology graduates often go on to focus on one area (hair, skin, or management) on the job." },
      ],
    },
    {
      name: "Makeup Artistry",
      duration: "4 months",
      fee: "KES 45,000 total programme fee",
      intakeMonths: ["January", "May", "September"],
      overview: "Bridal, editorial, and everyday makeup, plus how to build a client book.",
      whatYoullLearn: ["Bridal & editorial makeup", "Everyday & special-occasion looks", "Building a client book"],
      careerOutcomes: ["Freelance makeup artist", "Bridal MUA", "Studio/photoshoot MUA", "Brand/counter makeup artist"],
      heroImage: img.makeup,
      featuredOnHome: true,
      order: 4,
      instructors: [{ name: "Diana Achieng", role: "Makeup Artistry Instructor", image: img.makeup }],
      faqs: [
        { question: "Do I need to buy my own makeup kit?", answer: "A starter kit list is provided; studio kits are available for practice sessions." },
        { question: "Is this good for freelancing?", answer: "Yes — building a client-ready portfolio and a client book is part of the curriculum." },
      ],
    },
    {
      name: "Nail Technology",
      duration: "3 months",
      fee: "KES 35,000 total programme fee",
      intakeMonths: ["January", "May", "September"],
      overview: "Manicure, pedicure, gel, and nail art techniques clients actually ask for.",
      whatYoullLearn: ["Manicure & pedicure technique", "Gel, acrylic & nail art", "Hygiene & tool care"],
      careerOutcomes: ["Nail technician", "Nail bar specialist", "Freelance/mobile nail tech"],
      heroImage: img.nails,
      featuredOnHome: true,
      order: 5,
      instructors: [{ name: "Purity Kamau", role: "Nail Technology Instructor", image: img.nails }],
      faqs: [
        { question: "Is this the shortest course?", answer: "Yes, at 3 months it's our fastest path to a client-ready skill set." },
        { question: "Do you teach nail art?", answer: "Yes — gel, acrylic, and nail art technique are all covered." },
      ],
    },
    {
      name: "Barbering",
      duration: "4 months",
      fee: "KES 45,000 total programme fee",
      intakeMonths: ["January", "May", "September"],
      overview: "Fades, line-ups, beard work, and running a barbershop chair.",
      whatYoullLearn: ["Fades, line-ups & classic cuts", "Beard shaping & razor work", "Barbershop client flow"],
      careerOutcomes: ["Barber", "Barbershop chair rental operator", "Session barber"],
      heroImage: img.barbering,
      featuredOnHome: false,
      order: 6,
      instructors: [{ name: "Brian Otieno", role: "Lead Barbering Instructor", image: img.barbering }],
      faqs: [
        { question: "Do you teach razor work?", answer: "Yes — beard shaping and razor work are part of the core curriculum." },
        { question: "Can I rent a chair after graduating?", answer: "Many graduates go on to barbershop chair-rental or session work — it's one of our listed career outcomes." },
      ],
    },
  ];

  // No "and" substitution for "&" — must match the slugs already baked into
  // routes/links across the frontend (e.g. "hairdressing-styling", not
  // "hairdressing-and-styling").
  const slugify = (s) => s.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const courseDocIdBySlug = {};
  for (const c of courses) {
    const slug = slugify(c.name);
    const created = await createEntry("courses", {
      name: c.name,
      slug,
      duration: c.duration,
      fee: c.fee,
      intakeMonths: c.intakeMonths.map((text) => ({ text })),
      overview: c.overview,
      whatYoullLearn: c.whatYoullLearn.map((text) => ({ text })),
      careerOutcomes: c.careerOutcomes.map((text) => ({ text })),
      heroImage: c.heroImage,
      featuredOnHome: c.featuredOnHome,
      order: c.order,
      instructors: c.instructors,
      faqs: c.faqs,
      publishedAt: new Date().toISOString(),
    });
    courseDocIdBySlug[slug] = created.data.documentId;
    console.log(`✓ course: ${c.name}`);
  }

  console.log("\nSeeding Why Scharle Highlights…");
  const why = [
    { title: "Industry Pros on the Floor", body: "Not just lecturers: working stylists and therapists teach every module.", image: img.barbering, order: 1 },
    { title: "Real Chairs, Real Clients", body: "You're practicing on real people from term one, not mannequins all year.", image: img.hairdressing, order: 2 },
    { title: "Portfolio From Day One", body: "Every project is shot and logged; you graduate with content, not just a certificate.", image: img.contentDay, order: 3 },
  ];
  for (const w of why) {
    await createEntry("why-scharle-highlights", { ...w, publishedAt: new Date().toISOString() });
    console.log(`✓ why-scharle-highlight: ${w.title}`);
  }

  console.log("\nSeeding Student Life Highlights / Testimonials…");
  const studentLife = [
    { caption: "Studio", image: img.about, order: 1 },
    { caption: "Grad Day", image: img.gradShoot, order: 2 },
    { caption: "Practice Day", image: img.contentDay, order: 3 },
    { caption: "Content Day", image: img.barbering, order: 4 },
    {
      caption: "Barbering",
      image: img.barbering,
      quote: "I walked in knowing nothing about barbering. Six months later I'm doing fades for actual paying clients.",
      attribution: "Brian, Barbering",
      courseSlug: "barbering",
      order: 5,
    },
    {
      caption: "Beauty Therapy",
      image: img.beautyTherapy,
      quote: "The instructors still work in real salons. They teach what's actually happening in the industry right now.",
      attribution: "Faith, Beauty Therapy",
      courseSlug: "beauty-therapy",
      order: 6,
    },
    {
      caption: "Makeup Artistry",
      image: img.makeup,
      quote: "Every project got shot for my portfolio. I had real content to post before I even graduated.",
      attribution: "Diana, Makeup Artistry",
      courseSlug: "makeup-artistry",
      order: 7,
    },
    {
      caption: "Nail Technology",
      image: img.nails,
      quote: "Booked my first bridal client while still a student here. That doesn't happen at just any school.",
      attribution: "Purity, Nail Technology",
      courseSlug: "nail-technology",
      order: 8,
    },
    {
      caption: "Hairdressing & Styling",
      image: img.hairdressing,
      quote: "I came in only knowing box braids. Now I can do color correction clients travel from Nairobi for.",
      attribution: "Mercy, Hairdressing & Styling",
      courseSlug: "hairdressing-styling",
      order: 9,
    },
    {
      caption: "Cosmetology",
      image: img.cosmetology,
      quote: "The salon management module is the reason I run my own place now, not just cut hair in someone else's chair.",
      attribution: "Kevin, Cosmetology",
      courseSlug: "cosmetology",
      order: 10,
    },
  ];
  for (const s of studentLife) {
    const { courseSlug, ...rest } = s;
    await createEntry("student-life-highlights", {
      ...rest,
      course: courseSlug ? courseDocIdBySlug[courseSlug] : undefined,
      publishedAt: new Date().toISOString(),
    });
    console.log(`✓ student-life-highlight: ${s.caption}`);
  }

  console.log("\nSeeding Gallery Items…");
  const gallery = [
    { caption: "Studio Floor", category: "Studio", image: img.about, order: 1 },
    { caption: "Color Bar", category: "Studio", image: img.cosmetology, order: 2, courseSlug: "cosmetology" },
    { caption: "Styling Stations", category: "Studio", image: img.hairdressing, order: 3, courseSlug: "hairdressing-styling" },
    { caption: "Nail Bar", category: "Studio", image: img.nails, order: 4, courseSlug: "nail-technology" },
    { caption: "Grad Shoot", category: "Students", image: img.gradShoot, order: 5 },
    { caption: "Practice Day", category: "Students", image: img.beautyTherapy, order: 6, courseSlug: "beauty-therapy" },
    { caption: "Content Day", category: "Students", image: img.contentDay, order: 7 },
    { caption: "Barbering Practical", category: "Students", image: img.barbering, order: 8, courseSlug: "barbering" },
  ];
  for (const g of gallery) {
    const { courseSlug, ...rest } = g;
    await createEntry("gallery-items", {
      ...rest,
      showOnAbout: g.category === "Students",
      course: courseSlug ? courseDocIdBySlug[courseSlug] : undefined,
      publishedAt: new Date().toISOString(),
    });
    console.log(`✓ gallery-item: ${g.caption}`);
  }

  console.log("\nSeeding Payment Info…");
  await setSingleType("payment-info", {
    sectionTitle: "Fees & Payment Options",
    introNote:
      "Pay registration and tuition through either channel below. Bring your receipt/M-Pesa message with you on visit or intake day.",
    registrationFee: "KES 5,000",
    tuitionNote:
      "From KES 45,000 per term, course-dependent — confirmed exactly during your visit or application review.",
    channels: [
      {
        label: "Bank Transfer",
        lines: [
          { text: "Equity Bank Kenya" },
          { text: "Acc. Name: Scharle Beauty College Ltd" },
          { text: "Acc. No: 0000000000000" },
          { text: "Branch: Nyeri" },
        ],
      },
      {
        label: "M-Pesa Paybill",
        lines: [
          { text: "Paybill No: 000000" },
          { text: "Account No: Your full name" },
          { text: "Confirm SMS before your visit" },
        ],
      },
    ],
    disclaimer:
      "All figures and account details above are placeholders pending final confirmation from the college — do not send payment against them yet.",
  });

  console.log("\nSeeding Blog Posts…");
  const blogPosts = [
    {
      title: "5 Hair Color Trends Kenyan Clients Are Asking For in 2026",
      slug: "hair-color-trends-2026",
      excerpt:
        "From copper balayage to glass-hair gloss treatments, here's what's actually booking out chairs this year.",
      category: "Industry Trends",
      author: "Grace Mwangi",
      image: img.hairdressing,
      body: `Color requests have shifted noticeably over the last two intakes, and if you're training to be a stylist, these are the looks you need to have in your back pocket.

## 1. Copper balayage

Warm copper tones read beautifully on a wide range of natural hair colors and don't require the same level of upkeep as full-head bleach jobs — a big reason clients keep asking for it.

## 2. Glass-hair gloss treatments

A clear or tinted gloss over natural color, finished with a blowout. It's quick, it's affordable, and it photographs incredibly well — which matters when half your clients are booking for a shoot or an event.

## 3. Money-piece highlights

Face-framing highlights without a full foil job. Lower cost, lower maintenance, still dramatic on camera.

## 4. Rich burgundy and wine tones

Especially popular going into the cooler months — a strong option to suggest to clients who want a change without going lighter.

## 5. Natural color correction

More clients are coming in specifically to *fix* a box-dye job gone wrong rather than chase a new trend. Color correction is quietly becoming one of the most requested (and most valuable) skills a stylist can have.

If you're in our Hairdressing & Styling program, all five of these come up in our color modules — bring reference photos to class and we'll work through the technique together.`,
    },
    {
      title: "Open Day Recap: Meet the January Intake",
      slug: "open-day-recap-january-intake",
      excerpt:
        "Photos, numbers, and highlights from our latest studio open day — and why it's the easiest way to decide if Scharle is right for you.",
      category: "School Life",
      author: "Scharle Beauty College",
      image: img.gradShoot,
      body: `Our studio doors opened to prospective students, parents, and a few curious neighbors from Outspan Plaza last weekend — and it was one of our best-attended open days yet.

Visitors got a full walkthrough of the studio floor, sat in on a live demo from our Cosmetology instructors, and had a chance to ask current students what a normal week actually looks like (the answer: busy, hands-on, and a lot more practical work than a typical classroom).

## What people asked about most

- How soon students start working on real clients (answer: term one, not year two)
- Whether payment plans are available for tuition
- What happens after graduation, beyond just the certificate

## Coming up

If you missed this one, our next open day lines up with the January intake — book a visit any time before then and we'll walk you through the studio one-on-one.`,
    },
    {
      title: "How to Actually Build a Client Book Before You Graduate",
      slug: "build-a-client-book-before-graduating",
      excerpt:
        "The habits that separate students who walk out with a full book of clients from those who start from zero.",
      category: "Tips & Tutorials",
      author: "Diana Achieng",
      image: img.makeup,
      body: `The biggest difference between a graduate who's booked out in month one and one who's still building from scratch usually comes down to habits started *during* training, not after.

## Document everything

Every project you complete in the studio should get shot properly — good lighting, clean background, before/after where relevant. This is the content that becomes your portfolio and your first Instagram posts.

## Ask for reviews early

Even practice clients can leave a review or a testimonial. Ask for it while the experience is fresh, not months later.

## Say yes to the awkward requests

The client who wants something slightly outside your comfort zone is often the one who refers you to three friends afterward. Term one is the time to stretch, not to play it safe.

## Show up consistently online

You don't need a huge following — you need a consistent one. Posting your actual work, even to 200 followers, beats a polished page that never updates.

Students who start doing this from week one of their program are, without exception, the ones who have paying clients lined up before their final assessment.`,
    },
    {
      title: "Why We Still Teach Razor Work in the Barbering Program",
      slug: "why-we-teach-razor-work",
      excerpt:
        "Clippers get the job done fast, but the barbers clients specifically ask for are usually the ones who know their way around a razor.",
      category: "Industry Trends",
      author: "Brian Otieno",
      image: img.barbering,
      body: `It would be easy to run a shorter barbering curriculum that skips razor work entirely — clippers cover the majority of day-to-day cuts. We don't, and here's why.

A clean razor line-up or a proper straight-razor shave is still one of the clearest signals of a barber's actual skill level, and it's the service clients are most willing to pay a premium for. It's also one of the hardest things to pick up on the job without proper instruction, since the margin for error is a lot smaller than with clippers.

## What this looks like in practice

Every barbering student spends dedicated studio hours on razor technique before they touch a real client with one — starting on practice skin, moving to supervised sessions, and only working solo once an instructor signs off.

Graduates consistently tell us this is the module that gets them noticed fastest once they're in a real shop, chair-renting or otherwise.`,
    },
    {
      title: "From Box Braids to Color Correction: Mercy's Story",
      slug: "mercy-student-story",
      excerpt:
        "One of our Hairdressing & Styling graduates on going from knowing almost nothing to handling clients who travel from Nairobi for her work.",
      category: "Student Stories",
      author: "Scharle Beauty College",
      image: img.hairdressing,
      body: `When Mercy joined our Hairdressing & Styling program, she'd only ever done box braids on friends and family. Six months later, she's doing color correction work for clients who travel in from Nairobi specifically to see her.

"I didn't think color was something I'd be good at," she says. "I came in only knowing box braids. The color modules were the hardest part of the course for me, honestly — but they were also the part that changed everything once it clicked."

## What made the difference

Mercy points to two things: the amount of real client time built into the course, and instructors who were willing to let students fail safely on practice heads before ever touching a paying client's hair.

She now runs a growing client list out of a rented chair in Nyeri Town, with color correction as her specialty and referral engine.

If you're on the fence about whether a hands-on program is worth it over a shorter, cheaper course elsewhere, Mercy's answer is simple: "The clients notice the difference between a stylist who learned from videos and one who learned on real heads, with someone standing next to them the whole time."`,
    },
    {
      title: "Skincare Myths Our Beauty Therapy Instructors Are Tired Of",
      slug: "skincare-myths-beauty-therapy",
      excerpt:
        "A few things our instructors hear in every single intake — and what's actually true.",
      category: "Tips & Tutorials",
      author: "Faith Wanjiru",
      image: img.beautyTherapy,
      body: `Every new intake, our Beauty Therapy instructors field the same handful of skincare myths from students and clients alike. Here's the quick version of what's actually true.

## "Oily skin doesn't need moisturizer"

Oily skin still needs hydration — skipping moisturizer often makes oil production worse, not better, as skin tries to compensate.

## "You only need sunscreen when it's sunny"

UV exposure happens on cloudy days too, and it's the single biggest driver of premature aging we see in clients. Daily sunscreen, full stop.

## "Facials should hurt to work"

Extractions can be uncomfortable, but a facial that leaves skin visibly irritated for days afterward is a sign of a technique problem, not a sign it "worked."

## "Natural products are always safer"

Natural ingredients cause just as many allergic reactions as synthetic ones — what matters is a proper patch test and understanding a client's skin, not the ingredient list's marketing.

These are exactly the kinds of misconceptions we spend real studio time correcting, because clients ask their therapist these questions constantly — and knowing the real answer, confidently, is part of the job.`,
    },
  ];

  for (const p of blogPosts) {
    const { image, ...rest } = p;
    await createEntry("blog-posts", {
      ...rest,
      coverImage: image,
      publishedAt: new Date().toISOString(),
    });
    console.log(`✓ blog-post: ${p.title}`);
  }

  console.log("\n✅ Seed complete.");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
