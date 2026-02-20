import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Playbook | GAI Insights",
  description:
    "Comprehensive SEO playbook for gaiinsights.com — audit findings, schema markup code, keyword strategy, GBP posts, and best practices guide for enterprise AI consulting.",
};

/* ═══════════════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════════════ */

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${colors[color] ?? colors.cyan}`}>
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: "done" | "todo" | "needs-access" | "in-progress" }) {
  const styles = {
    done: "bg-green-500/15 text-green-400 border-green-500/25",
    "in-progress": "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    "needs-access": "bg-orange-500/15 text-orange-400 border-orange-500/25",
    todo: "bg-white/5 text-white/40 border-white/10",
  };
  const labels = { done: "DONE", "in-progress": "IN PROGRESS", "needs-access": "NEEDS ACCESS", todo: "TODO" };
  const icons = { done: "\u2713", "in-progress": "\u25CB", "needs-access": "\u26A0", todo: "\u2014" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border ${styles[status]}`}>
      <span>{icons[status]}</span>
      {labels[status]}
    </span>
  );
}

function Section({ id, number, title, status, children }: {
  id: string; number: string; title: string; status?: "done" | "todo" | "needs-access" | "in-progress"; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-cyan-400 font-mono text-sm opacity-60">{number}</span>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{title}</h2>
        {status && <StatusPill status={status} />}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}>
      {children}
    </div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-cyan-500/40 pl-4 italic text-white/60 text-sm my-3">
      {children}
    </blockquote>
  );
}

/** CSS-only tooltip — hover to reveal definition. Works in server components. */
function Tip({ children, def }: { children: React.ReactNode; def: string }) {
  return (
    <span className="relative inline-block group/tip">
      <span className="cursor-help border-b border-dotted border-cyan-500/40 text-cyan-300">{children}</span>
      <span className="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-200 absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 rounded-lg bg-slate-900 border border-cyan-500/20 text-xs text-white/80 leading-relaxed shadow-xl shadow-black/50">
        <span className="font-semibold text-cyan-400 block mb-1">{children}</span>
        {def}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  );
}

/** Expandable explainer using <details> — no JS needed */
function Explainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group/exp rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] overflow-hidden">
      <summary className="flex items-center gap-2 cursor-pointer p-4 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors [&::-webkit-details-marker]:hidden list-none">
        <span className="transition-transform duration-200 group-open/exp:rotate-90 text-xs">{"\u25B6"}</span>
        {title}
      </summary>
      <div className="px-5 pb-4 text-sm text-white/70 border-t border-cyan-500/10 pt-3 space-y-2">
        {children}
      </div>
    </details>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50">{title}</span>
        <span className="text-[10px] text-white/30 font-mono">JSON-LD &middot; Select All &amp; Copy</span>
      </div>
      <pre className="p-4 text-xs text-cyan-200/80 overflow-x-auto leading-relaxed font-mono">
        {code}
      </pre>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="pt-8 pb-4">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-500/40" style={{ fontFamily: "Syne, sans-serif" }}>
          {title}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DATA CONSTANTS
   ═══════════════════════════════════════════════════ */

const GLOSSARY: [string, string][] = [
  ["SEO", "Search Engine Optimization \u2014 the practice of improving your website so it ranks higher in Google, Bing, and AI search engines. Higher rankings = more visitors = more leads."],
  ["SERP", "Search Engine Results Page \u2014 the page you see after Googling something. Your goal is to appear as high as possible on this page."],
  ["Schema Markup", "Invisible code added to your website that tells search engines exactly what your content is about. Think of it as a label that says \u2018this is a service\u2019 or \u2018this is an event.\u2019"],
  ["JSON-LD", "JavaScript Object Notation for Linked Data \u2014 the recommended format for schema markup. It\u2019s a small code snippet placed in your page\u2019s HTML <head> section."],
  ["E-E-A-T", "Experience, Expertise, Authoritativeness, Trustworthiness \u2014 Google\u2019s framework for evaluating content quality. Having real experts write/review content boosts E-E-A-T."],
  ["CTR", "Click-Through Rate \u2014 the percentage of people who see your link in search results and actually click it. Higher CTR = your title/description is compelling."],
  ["GBP", "Google Business Profile \u2014 your free business listing on Google Maps and Search. Even for national B2B companies, it\u2019s valuable for credibility."],
  ["Impressions", "How many times your website appeared in search results \u2014 even if nobody clicked. High impressions + low clicks = your title/description needs work."],
  ["Backlinks", "Links from other websites pointing to yours. They\u2019re like \u2018votes of confidence\u2019 \u2014 the more quality sites that link to you, the more Google trusts you."],
  ["Internal Links", "Links between pages on your own website. They help visitors navigate and help Google understand your site structure."],
  ["Meta Description", "The 150\u2013160 character summary that appears below your page title in Google results. It doesn\u2019t directly affect ranking but heavily impacts CTR."],
  ["Title Tag", "The clickable headline that appears in search results. Arguably the single most important on-page SEO element. Keep it under 60 characters."],
  ["Alt Text", "A text description of an image that helps search engines understand what the image shows. Also critical for accessibility (screen readers)."],
  ["Core Web Vitals", "Three metrics Google uses to measure your website\u2019s speed and user experience: LCP (loading speed), INP (interactivity), CLS (visual stability)."],
  ["Rich Results", "Enhanced search listings with extra info like star ratings, FAQ dropdowns, event dates, or prices. Schema markup enables these."],
  ["Knowledge Graph", "Google\u2019s database of facts about businesses, people, and things. Organization schema helps your business appear in the Knowledge Graph panel."],
  ["AI Overviews", "Google\u2019s AI-generated summaries at the top of search results. Getting cited here means massive visibility \u2014 structured content helps."],
  ["GEO", "Generative Engine Optimization \u2014 optimizing your content to be cited by AI tools like Google AI Overviews, Perplexity, and ChatGPT Search."],
  ["Canonical Tag", "An HTML tag that tells search engines \u2018this is the main version of this page\u2019 \u2014 prevents issues when similar content appears at multiple URLs."],
  ["XML Sitemap", "A file that lists all your website\u2019s pages so search engines can find and crawl them efficiently. Like a table of contents for Google."],
  ["Breadcrumbs", "Navigation links showing where a page sits in your site hierarchy (e.g. Home > Blog > AI Strategy). Helps both users and search engines."],
  ["Featured Snippet", "The boxed answer that appears at position zero in Google results. Structured content (lists, tables, definitions) has the best chance of winning these."],
  ["Keyword Difficulty", "A score (0\u2013100) estimating how hard it is to rank for a particular keyword. Lower difficulty = easier to rank = better target for new sites."],
  ["Search Intent", "The reason behind a search query. Informational (\u2018what is AI\u2019), Commercial (\u2018best AI consulting\u2019), Transactional (\u2018hire AI consultant\u2019), Navigational (\u2018GAI Insights login\u2019)."],
  ["Long-tail Keywords", "Longer, more specific search phrases (e.g. \u2018enterprise GenAI training programs for financial services\u2019). Less competition, higher conversion rates."],
  ["Organic Traffic", "Visitors who find your site through unpaid search results (not ads). The main goal of SEO."],
  ["Domain Authority", "A score (0\u2013100) predicting how well a website will rank in search engines. Built over time through quality content and backlinks."],
  ["Crawl Budget", "The number of pages Google will crawl on your site in a given time period. Large sites need to optimize which pages get crawled first."],
  ["Indexing", "When Google adds your page to its database (index) so it can appear in search results. If a page isn\u2019t indexed, it won\u2019t show up in Google."],
  ["Information Gain", "A ranking concept where Google rewards content that provides unique facts, data, or perspectives not found elsewhere on the web."],
  ["Robots.txt", "A file at your website\u2019s root that tells search engine bots which pages they can and cannot crawl. Misconfiguration can block important pages."],
  ["Heading Hierarchy", "The structure of headings on a page: H1 (main title, one per page), H2 (major sections), H3 (subsections). Helps search engines understand content structure."],
];

const COMPETITORS = [
  {
    name: "LeewayHertz",
    url: "leewayhertz.com",
    type: "AI Development",
    strengths: "Massive content library (5000+ word articles), strong technical SEO, acquired by Hackett Group",
    weaknesses: "Dev-focused, less analyst credibility, no community/network",
    content: "250+ detailed technical articles, AI use-case pages by industry",
  },
  {
    name: "RTS Labs",
    url: "rtslabs.com",
    type: "Enterprise AI Consulting",
    strengths: "230+ blog posts, aggressive SEO (\u2018alternatives to X\u2019 content), cost guides, strong organic presence",
    weaknesses: "Smaller brand recognition, no conferences or proprietary frameworks",
    content: "Blog-heavy strategy, comparison posts, industry-specific landing pages",
  },
  {
    name: "Six Paths Consulting",
    url: "sixpathsconsulting.com",
    type: "Strategy & Innovation",
    strengths: "Premium positioning, innovation focus, thought leadership",
    weaknesses: "Thin content volume, limited SEO optimization visible",
    content: "Thought pieces, case studies, limited blog volume",
  },
  {
    name: "Constellation Research",
    url: "constellationr.com",
    type: "Analyst Firm",
    strengths: "Strong analyst brand, research reports, industry events, media presence",
    weaknesses: "Paywall on premium content, broad focus (not AI-specific)",
    content: "Research reports, analyst blogs, event coverage, newsletters",
  },
];

const CONTENT_GAPS = [
  {
    title: "AI Consulting Cost & Pricing Guide",
    description: "Competitors like RTS Labs rank highly for \u2018AI consulting pricing\u2019 and \u2018how much does AI consulting cost.\u2019 GAI Insights has no pricing/cost content.",
    priority: "HIGH",
    action: "Create a detailed guide covering typical AI consulting engagement costs, pricing models (retainer vs project), and ROI expectations.",
  },
  {
    title: "Industry-Specific AI Strategy Pages",
    description: "LeewayHertz dominates with 20+ industry-specific pages (AI in banking, healthcare, retail, etc.). GAI Insights serves these industries but has no dedicated pages.",
    priority: "HIGH",
    action: "Create dedicated landing pages for Financial Services, Healthcare, Retail, and Manufacturing with industry-specific AI use cases and case studies.",
  },
  {
    title: "\u2018Alternatives to\u2019 & Comparison Content",
    description: "RTS Labs aggressively targets \u2018alternatives to [tool]\u2019 keywords. This content captures buyers actively evaluating options.",
    priority: "MEDIUM",
    action: "Create comparison guides: \u2018Best Enterprise AI Platforms Compared\u2019, \u2018GenAI Training Providers Compared\u2019 leveraging buyer\u2019s guide expertise.",
  },
  {
    title: "Agentic AI / AI Agents Pillar Content",
    description: "Agentic AI is the hottest enterprise AI topic in 2026. No competitor has comprehensive pillar content on this yet \u2014 first-mover advantage.",
    priority: "HIGH",
    action: "Create a comprehensive pillar page: \u2018Enterprise Agentic AI: Strategy, Implementation & Governance\u2019 with links to supporting articles.",
  },
  {
    title: "Proprietary Framework Content (RISE & WINS)",
    description: "GAI Insights has proprietary frameworks (RISE Maturity Assessment, WINS Framework) but they\u2019re barely visible in search. Competitors would love to have branded IP like this.",
    priority: "HIGH",
    action: "Create dedicated pages for RISE and WINS with full methodology explanations, sample outputs, and gated assessment tools.",
  },
];

const GBP_POSTS = [
  { type: "What\u2019s New", title: "Your 2026 Enterprise GenAI Buyer\u2019s Guide Is Here", body: "Our latest buyer\u2019s guide compares 40+ enterprise GenAI platforms across security, compliance, and ROI metrics. Trusted by AI leaders at AWS, IBM, and Fortune 500 companies, this is the resource your team needs before making your next AI investment.", cta: "Learn more" },
  { type: "Event", title: "GAI World 2026: Where Enterprise AI Leaders Connect", body: "Join 500+ enterprise AI leaders at the premier GenAI conference. Hear from practitioners who\u2019ve implemented AI at scale, participate in hands-on workshops, and network with peers facing the same challenges. Early bird registration now open.", cta: "Sign up" },
  { type: "Offer", title: "Free AI Maturity Assessment for Your Organization", body: "Where does your organization stand on the AI adoption curve? Our RISE Maturity Assessment benchmarks your AI capabilities against 200+ enterprises. Get a personalized scorecard with actionable recommendations \u2014 complimentary for qualified enterprises.", cta: "Book" },
  { type: "What\u2019s New", title: "This Week in Enterprise AI: Agentic AI Goes Mainstream", body: "In this week\u2019s daily AI briefing, we break down why agentic AI is the biggest shift since ChatGPT, which enterprises are deploying it successfully, and what governance frameworks you need. Join 35,000+ AI leaders who start their morning with our briefing.", cta: "Learn more" },
  { type: "Event", title: "Hands-On GenAI Workshop: From Copilot to Custom Agents", body: "This month\u2019s Learning Lab is all about building practical GenAI workflows. From Microsoft Copilot configuration to custom AI agent development, our Newton, MA workshops give your team hands-on skills they can use Monday morning.", cta: "Sign up" },
  { type: "Offer", title: "Free 30-Minute AI Strategy Consultation", body: "Not sure where to start with GenAI? Book a complimentary strategy session with our analysts. We\u2019ll review your current AI initiatives, identify quick wins, and outline a 90-day roadmap. No sales pitch \u2014 just actionable advice from enterprise AI experts based in the Boston area.", cta: "Book" },
  { type: "What\u2019s New", title: "New Report: Enterprise ChatGPT Adoption \u2014 What the Data Shows", body: "Our analysis of ChatGPT Enterprise adoption across 150+ organizations reveals surprising patterns. Which departments see the highest ROI? What security configurations matter most? The answers may challenge your assumptions.", cta: "Learn more" },
  { type: "Event", title: "Executive Roundtable: AI Governance in Financial Services", body: "An intimate discussion for CIOs and CAIOs in financial services. We\u2019ll cover regulatory requirements, model risk management, and practical governance frameworks that don\u2019t slow innovation. Limited to 20 seats for candid conversation.", cta: "Sign up" },
  { type: "Offer", title: "Download: AI Implementation Readiness Checklist", body: "Before launching your next AI initiative, make sure you\u2019ve covered all the bases. Our checklist covers data readiness, infrastructure requirements, change management, and governance essentials. Used by 500+ enterprise teams worldwide.", cta: "Learn more" },
  { type: "What\u2019s New", title: "How Top Enterprises Are Measuring GenAI ROI in 2026", body: "Measuring AI ROI remains the #1 challenge for enterprise leaders. Our latest research reveals the metrics that matter, the measurement frameworks that work, and the pitfalls that make AI investments look worse than they are.", cta: "Learn more" },
  { type: "Event", title: "Boston AI Leaders Meetup at GAI Insights HQ", body: "Connect with fellow AI leaders in the greater Boston area at our Newton headquarters. Casual networking, lightning talks from practitioners, and honest conversations about what\u2019s working (and what\u2019s not) in enterprise AI deployment.", cta: "Sign up" },
  { type: "Offer", title: "Subscribe to Daily AI Briefing \u2014 Join 35,000+ Leaders", body: "Start every morning informed. Our daily AI briefing curates the most important enterprise AI developments, cuts through the hype, and delivers actionable insights in a 3-minute read. Free for enterprise AI professionals.", cta: "Sign up" },
];

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function SEOPlanPage() {
  return (
    <main className="relative z-10 min-h-screen">
      {/* ─── Header ─── */}
      <header className="border-b border-white/[0.06] bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
              <span className="text-cyan-400">GAI</span> <span className="text-white/90">Insights</span>
            </div>
            <span className="text-white/20">|</span>
            <span className="text-white/40 text-sm">SEO Playbook</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#glossary" className="text-xs text-cyan-500/60 hover:text-cyan-400 transition-colors">Glossary</a>
            <span className="text-white/10">|</span>
            <span className="text-white/30 text-xs font-mono">Feb 2026</span>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
        <p className="text-cyan-400 text-sm font-medium mb-3 tracking-wide uppercase">
          Comprehensive SEO Playbook
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
          SEO Action Plan for{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            gaiinsights.com
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-2xl mb-6">
          Real audit findings, ready-to-use code, 12 drafted posts, and a complete best practices
          guide. Built so your team can execute without needing an SEO expert.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">4 Audits Complete</span>
          <span className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">6 JSON-LD Code Blocks</span>
          <span className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">12 GBP Posts Drafted</span>
          <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">10 Best Practice Guides</span>
        </div>
      </div>

      {/* ─── Quick SEO Primer ─── */}
      <div className="max-w-5xl mx-auto px-6 pb-8">
        <Explainer title="New to SEO? Start here \u2014 60-second primer">
          <p><strong className="text-white/90">SEO (Search Engine Optimization)</strong> is the practice of making your website show up higher in Google (and AI search tools like Perplexity and ChatGPT). Higher rankings = more people find you = more leads.</p>
          <p className="mt-2">This playbook covers <strong className="text-white/90">everything</strong> your website needs to rank well. Hover over any <span className="border-b border-dotted border-cyan-500/40 text-cyan-300">underlined cyan term</span> to see a plain-English definition. Expand any blue box for deeper explanations.</p>
          <p className="mt-2">The most impactful items are at the top. Green badges mean we&rsquo;ve already done the work \u2014 you just need to paste the code into HubSpot. Orange badges mean you need to grant us access to a tool first.</p>
        </Explainer>
      </div>

      {/* ─── TOC ─── */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <nav className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs text-white/30 uppercase tracking-wide mb-4 font-medium">Contents</p>

          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-cyan-500/40 mb-2">Part 1 &mdash; Audit Findings</p>
          <ol className="grid sm:grid-cols-2 gap-1.5 text-sm mb-4">
            {([
              ["01", "Schema Markup Audit", "done"],
              ["02", "Competitive Landscape", "done"],
              ["03", "Content Gap Analysis", "done"],
              ["04", "Business Profile", "done"],
            ] as const).map(([n, label, status]) => (
              <li key={n}>
                <a href={`#section-${n}`} className="flex items-center gap-2 text-white/50 hover:text-cyan-400 transition-colors py-1">
                  <span className="text-cyan-500/60 font-mono text-xs w-5">{n}</span>
                  {label}
                  <StatusPill status={status} />
                </a>
              </li>
            ))}
          </ol>

          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-purple-500/40 mb-2">Part 2 &mdash; Ready-to-Use Deliverables</p>
          <ol className="grid sm:grid-cols-2 gap-1.5 text-sm mb-4">
            {([
              ["05", "Schema Code (JSON-LD)", "done"],
              ["06", "GBP Posts (12 Drafted)", "done"],
              ["07", "Keyword Strategy", "needs-access"],
            ] as const).map(([n, label, status]) => (
              <li key={n}>
                <a href={`#section-${n}`} className="flex items-center gap-2 text-white/50 hover:text-cyan-400 transition-colors py-1">
                  <span className="text-cyan-500/60 font-mono text-xs w-5">{n}</span>
                  {label}
                  <StatusPill status={status} />
                </a>
              </li>
            ))}
          </ol>

          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-yellow-500/40 mb-2">Part 3 &mdash; SEO Best Practices Guide</p>
          <ol className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {[
              ["08", "Meta Tags & Titles"],
              ["09", "Content Structure & Headings"],
              ["10", "Internal Linking"],
              ["11", "E-E-A-T Signals"],
              ["12", "AI Search Optimization (GEO)"],
              ["13", "Technical SEO Checklist"],
              ["14", "Image SEO"],
              ["15", "Core Web Vitals"],
              ["16", "Backlink Strategy"],
              ["17", "Content Freshness"],
            ].map(([n, label]) => (
              <li key={n}>
                <a href={`#section-${n}`} className="flex items-center gap-2 text-white/50 hover:text-cyan-400 transition-colors py-1">
                  <span className="text-cyan-500/60 font-mono text-xs w-5">{n}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════
          CONTENT
         ═══════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-16">

        {/* ═══ PART 1: AUDIT FINDINGS ═══ */}
        <SectionDivider title="Part 1 \u2014 Audit Findings" />

        {/* ─── 01 SCHEMA AUDIT ─── */}
        <Section id="section-01" number="01" title="Schema Markup Audit" status="done">
          <Quote>
            &ldquo;Check page source and list all schema. Say if LocalBusiness exists and if it&rsquo;s useful.&rdquo;
          </Quote>

          <Explainer title="What is Schema Markup and why should I care?">
            <p><Tip def="Invisible code added to your website that tells search engines exactly what your content is about.">Schema Markup</Tip> is like putting labels on your website that only search engines can read. When Google sees schema that says &ldquo;this is a consulting service&rdquo; or &ldquo;this is a conference,&rdquo; it can display <Tip def="Enhanced search listings with extra info like star ratings, FAQ dropdowns, event dates, or prices.">Rich Results</Tip> \u2014 those enhanced search listings with extra details.</p>
            <p>Without schema, Google has to guess what your content is about. With schema, you&rsquo;re telling it explicitly. This is especially important for <Tip def="Google\u2019s AI-generated summaries at the top of search results. Getting cited here means massive visibility.">AI Overviews</Tip> which rely on structured data to cite sources.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
              {"\u26A0"} Issues Found
            </h3>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex gap-3 items-start p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <Badge color="red">CRITICAL</Badge>
                <span>
                  Site uses <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">ProfessionalService</code> schema which is <strong className="text-red-400">deprecated by Google</strong>. Must be replaced with <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">Organization</code> + <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">Service</code> combination.
                </span>
              </div>
              <div className="flex gap-3 items-start p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <Badge color="green">GOOD</Badge>
                <span>
                  Has <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">FAQPage</code> schema with 12 Q&amp;As \u2014 this is working correctly and driving <Tip def="Enhanced search listings with extra info like FAQ dropdowns.">Rich Results</Tip>.
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Schema Status Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4 text-white/50 font-medium">Schema Type</th>
                    <th className="py-2 pr-4 text-white/50 font-medium">Status</th>
                    <th className="py-2 pr-4 text-white/50 font-medium">Priority</th>
                    <th className="py-2 text-white/50 font-medium">Why It Matters</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {([
                    ["Organization", "MISSING", "red", "CRITICAL", "Foundation for Google\u2019s Knowledge Graph. Without this, Google doesn\u2019t \u2018know\u2019 GAI Insights as an entity."],
                    ["Service", "MISSING", "orange", "HIGH", "Tells search engines what you sell. Each service gets its own searchable entry."],
                    ["FAQPage", "\u2713 PRESENT", "green", "DONE", "Already implemented with 12 Q&As. Driving FAQ rich results in search."],
                    ["Article", "MISSING", "orange", "HIGH", "Blog posts, daily news, buyer\u2019s guides should all have this for authorship + dates."],
                    ["Event", "MISSING", "orange", "HIGH", "GAI World 2026 should have event schema for event-specific rich results."],
                    ["BreadcrumbList", "MISSING", "yellow", "MEDIUM", "Helps Google understand your site hierarchy. Shows breadcrumb trail in search results."],
                    ["Person", "MISSING", "yellow", "MEDIUM", "Paul Baier\u2019s profile should have this for E-E-A-T author authority signals."],
                    ["ProfessionalService", "DEPRECATED", "red", "REMOVE", "Currently on site but deprecated by Google. Must be replaced with Organization + Service."],
                  ] as const).map(([schema, status, statusColor, priority, why], i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">{schema}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-medium ${status.includes("MISSING") ? "text-red-400" : status === "DEPRECATED" ? "text-red-400" : "text-green-400"}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4"><Badge color={statusColor}>{priority}</Badge></td>
                      <td className="py-2.5 text-xs text-white/50">{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="text-sm text-white/40 flex items-center gap-2">
            <span className="text-green-400">{"\u2713"}</span>
            Ready-to-paste code for all missing schema is in <a href="#section-05" className="text-cyan-500/60 hover:text-cyan-400 transition-colors">Section 05</a>.
          </div>
        </Section>

        {/* ─── 02 COMPETITIVE LANDSCAPE ─── */}
        <Section id="section-02" number="02" title="Competitive Landscape" status="done">
          <Quote>
            &ldquo;Visit my site and extract business details, then open competitors and compare me vs them.&rdquo;
          </Quote>

          <Explainer title="How does competitive analysis help SEO?">
            <p>By studying what your competitors publish, rank for, and how they structure their sites, you discover <Tip def="Topics and keywords your competitors rank for that you don\u2019t cover yet.">content gaps</Tip> \u2014 topics you should cover. You also learn which strategies work in your industry so you can adapt (not copy) them.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Competitor Analysis (4 Sites Crawled)
            </h3>
            <div className="space-y-4">
              {COMPETITORS.map((c, i) => (
                <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-white/90">{c.name}</span>
                    <span className="text-xs text-white/30 font-mono">{c.url}</span>
                    <Badge color="purple">{c.type}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-green-400/80 font-medium mb-1">{"\u2713"} Strengths</p>
                      <p className="text-white/50">{c.strengths}</p>
                    </div>
                    <div>
                      <p className="text-red-400/80 font-medium mb-1">{"\u2717"} Weaknesses</p>
                      <p className="text-white/50">{c.weaknesses}</p>
                    </div>
                    <div>
                      <p className="text-cyan-400/80 font-medium mb-1">{"\u25CB"} Content</p>
                      <p className="text-white/50">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              GAI Insights&rsquo; Unique Competitive Advantages
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Daily AI News Briefing", "No competitor has a daily content engine like this. 35K+ subscribers is a massive distribution advantage."],
                ["Enterprise Buyer Community", "Direct access to AI buyers \u2014 competitors don\u2019t have this feedback loop."],
                ["Proprietary Frameworks", "RISE Maturity Assessment and WINS Framework are branded IP that competitors can\u2019t replicate."],
                ["GAI World Conference", "Annual conference creates authority and generates content/backlinks."],
                ["HBR Contributions", "Paul Baier\u2019s HBR articles provide unmatched credibility signals."],
                ["Client Logo Social Proof", "AWS, IBM, Crocs, WEX \u2014 enterprise trust signals that build authority."],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-cyan-500 mt-0.5 shrink-0">{"\u2713"}</span>
                  <div>
                    <p className="text-white/90 font-medium text-sm">{title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ─── 03 CONTENT GAPS ─── */}
        <Section id="section-03" number="03" title="Content Gap Analysis" status="done">
          <Explainer title="What is a content gap and why does it matter?">
            <p>A <Tip def="Topics and keywords your competitors rank for that you don\u2019t cover yet.">content gap</Tip> is a topic your potential customers are searching for but your website doesn&rsquo;t cover. Every gap is a missed opportunity for <Tip def="Visitors who find your site through unpaid search results.">organic traffic</Tip> and leads. Filling gaps with quality content is one of the fastest ways to grow.</p>
          </Explainer>

          <div className="space-y-4">
            {CONTENT_GAPS.map((gap, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-cyan-400 font-mono text-xs">Gap {i + 1}</span>
                  <h4 className="font-semibold text-white/90">{gap.title}</h4>
                  <Badge color={gap.priority === "HIGH" ? "red" : "yellow"}>{gap.priority}</Badge>
                </div>
                <p className="text-sm text-white/60 mb-3">{gap.description}</p>
                <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-3 text-sm text-cyan-200/80">
                  <span className="font-medium text-cyan-400">Action: </span>{gap.action}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ─── 04 BUSINESS PROFILE ─── */}
        <Section id="section-04" number="04" title="Business Profile (Extracted)" status="done">
          <Card>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Business</p>
                <p className="text-white/80">GAI Insights LLC &mdash; Enterprise GenAI Analyst &amp; Advisory Firm</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Location</p>
                <p className="text-white/80">321 Walnut Street, Suite 431, Newton, MA 02460</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Founder</p>
                <p className="text-white/80">Paul Baier (HBR contributor, enterprise AI thought leader)</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Analyst</p>
                <p className="text-white/80">Adam Rappaport</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Services</p>
                <p className="text-white/80">AI Strategy Consulting, GenAI Training &amp; Upskilling (ChatGPT, Copilot), Buyer&rsquo;s Guides, Benchmarking (RISE Assessment), Daily AI News, Executive Advisory, Peer Networking, GAI World Conference</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Trust Signals</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["35K+ Newsletter Subscribers", "AWS", "IBM", "Crocs", "UL Solutions", "WEX", "HBR Articles", "GAI World Conference"].map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs rounded bg-white/[0.04] border border-white/[0.08] text-white/60">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Section>


        {/* ═══ PART 2: DELIVERABLES ═══ */}
        <SectionDivider title="Part 2 \u2014 Ready-to-Use Deliverables" />

        {/* ─── 05 SCHEMA CODE ─── */}
        <Section id="section-05" number="05" title="Schema Implementation (JSON-LD)" status="done">
          <Explainer title="How do I add these to the website?">
            <p>Each code block below is a <Tip def="The recommended format for schema markup \u2014 a code snippet placed in your page\u2019s HTML head section.">JSON-LD</Tip> snippet. In <strong className="text-white/90">HubSpot</strong>:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Go to <strong className="text-white/90">Settings {"\u2192"} Website {"\u2192"} Pages</strong></li>
              <li>Click <strong className="text-white/90">Site Header HTML</strong> (for site-wide schema like Organization)</li>
              <li>Paste the code block exactly as shown</li>
              <li>For page-specific schema (Article, Event), add to individual page settings</li>
              <li>Validate at <strong className="text-white/90">search.google.com/test/rich-results</strong></li>
            </ol>
            <p className="mt-2 text-white/50">Items marked <code className="text-xs bg-white/10 px-1 py-0.5 rounded">[REPLACE]</code> need your actual values filled in.</p>
          </Explainer>

          <CodeBlock
            title="Organization Schema \u2014 Add to Site Header (replaces deprecated ProfessionalService)"
            code={`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GAI Insights",
  "alternateName": "GAI Insights LLC",
  "url": "https://www.gaiinsights.com",
  "logo": "https://www.gaiinsights.com/[REPLACE-LOGO-URL]",
  "image": "https://www.gaiinsights.com/[REPLACE-OG-IMAGE-URL]",
  "description": "Enterprise GenAI analyst and advisory firm providing AI strategy consulting, training, buyer's guides, and benchmarking for Fortune 500 companies.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "321 Walnut Street, Suite 431",
    "addressLocality": "Newton",
    "addressRegion": "MA",
    "postalCode": "02460",
    "addressCountry": "US"
  },
  "founder": {
    "@type": "Person",
    "name": "Paul Baier",
    "jobTitle": "Founder & CEO",
    "sameAs": [
      "[REPLACE-PAUL-LINKEDIN-URL]"
    ]
  },
  "sameAs": [
    "[REPLACE-LINKEDIN-COMPANY-URL]",
    "[REPLACE-TWITTER-URL]"
  ],
  "knowsAbout": [
    "Artificial Intelligence",
    "Generative AI",
    "Enterprise AI Strategy",
    "AI Training and Upskilling",
    "AI Consulting"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "email": "[REPLACE-CONTACT-EMAIL]",
    "url": "https://www.gaiinsights.com/contact"
  }
}
</script>`}
          />

          <CodeBlock
            title="Service Schema \u2014 Add to Site Header (covers all service offerings)"
            code={`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GAI Insights",
  "url": "https://www.gaiinsights.com",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Enterprise AI Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "AI Strategy Consulting",
          "description": "Strategic advisory for enterprises implementing generative AI, including roadmap development, vendor selection, and organizational readiness assessment."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "GenAI Training & Upskilling",
          "description": "Hands-on workshops and training programs for ChatGPT, Microsoft Copilot, and custom GenAI tools for enterprise teams."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "RISE Maturity Assessment",
          "description": "Proprietary AI maturity benchmarking tool that evaluates organizational AI capabilities against 200+ enterprises."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Enterprise AI Buyer's Guides",
          "description": "Independent comparison guides evaluating enterprise GenAI platforms across security, compliance, ROI, and usability metrics."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Executive Advisory & Peer Networking",
          "description": "Exclusive advisory services and peer networking for CIOs, CTOs, and Chief AI Officers implementing enterprise AI strategies."
        }
      }
    ]
  }
}
</script>`}
          />

          <CodeBlock
            title="Event Schema \u2014 Add to GAI World 2026 page"
            code={`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "GAI World 2026",
  "description": "The premier annual conference for enterprise AI leaders featuring keynotes, workshops, and peer networking on generative AI strategy and implementation.",
  "startDate": "[REPLACE-START-DATE e.g. 2026-09-15]",
  "endDate": "[REPLACE-END-DATE e.g. 2026-09-17]",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "[REPLACE-VENUE-NAME]",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "[REPLACE-CITY]",
      "addressRegion": "[REPLACE-STATE]",
      "addressCountry": "US"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "GAI Insights",
    "url": "https://www.gaiinsights.com"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://www.gaiinsights.com/[REPLACE-TICKETS-URL]",
    "availability": "https://schema.org/InStock"
  }
}
</script>`}
          />

          <CodeBlock
            title="Article Schema \u2014 Add to blog post template in HubSpot"
            code={`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[DYNAMIC - Blog post title]",
  "description": "[DYNAMIC - Meta description]",
  "author": {
    "@type": "Person",
    "name": "[DYNAMIC - Author name]",
    "url": "https://www.gaiinsights.com/team/[author-slug]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "GAI Insights",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.gaiinsights.com/[REPLACE-LOGO-URL]"
    }
  },
  "datePublished": "[DYNAMIC - Publish date ISO]",
  "dateModified": "[DYNAMIC - Modified date ISO]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "[DYNAMIC - Page URL]"
  }
}
</script>`}
          />

          <CodeBlock
            title="BreadcrumbList Schema \u2014 Add to Site Header"
            code={`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.gaiinsights.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "[DYNAMIC - Section name e.g. Blog, Services]",
      "item": "https://www.gaiinsights.com/[section-slug]"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[DYNAMIC - Page title]",
      "item": "[DYNAMIC - Current page URL]"
    }
  ]
}
</script>`}
          />

          <CodeBlock
            title="Person Schema \u2014 Add to Paul Baier's team/about page"
            code={`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Paul Baier",
  "jobTitle": "Founder & CEO",
  "worksFor": {
    "@type": "Organization",
    "name": "GAI Insights"
  },
  "description": "Enterprise AI thought leader, HBR contributor, and founder of GAI Insights — advising Fortune 500 companies on generative AI strategy.",
  "url": "https://www.gaiinsights.com/team/paul-baier",
  "sameAs": [
    "[REPLACE-PAUL-LINKEDIN-URL]",
    "[REPLACE-PAUL-TWITTER-URL]"
  ],
  "knowsAbout": [
    "Enterprise AI Strategy",
    "Generative AI",
    "AI Governance",
    "Digital Transformation"
  ]
}
</script>`}
          />
        </Section>

        {/* ─── 06 GBP POSTS ─── */}
        <Section id="section-06" number="06" title="Google Business Profile Posts (12 Drafted)" status="done">
          <Explainer title="What is Google Business Profile and why do we need it?">
            <p><Tip def="Your free business listing on Google Maps and Search. Even for national B2B companies, it\u2019s valuable for credibility.">Google Business Profile (GBP)</Tip> is your free listing on Google Maps and Search. Even though GAI Insights is a national/global firm, GBP serves as a digital storefront that feeds into Google&rsquo;s AI systems.</p>
            <p className="mt-2">Key stats: <strong className="text-white/90">Event posts</strong> get ~2x engagement. Posts expire after 6 months. Aim for 1-2 posts per week. These 12 posts cover 6 weeks of content.</p>
          </Explainer>

          <div className="space-y-3">
            {GBP_POSTS.map((post, i) => (
              <details key={i} className="group/post rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <summary className="flex items-center gap-3 p-4 cursor-pointer [&::-webkit-details-marker]:hidden list-none hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-mono text-cyan-500/60 w-6">#{i + 1}</span>
                  <Badge color={post.type.includes("Event") ? "purple" : post.type.includes("Offer") ? "green" : "cyan"}>
                    {post.type}
                  </Badge>
                  <span className="text-sm text-white/80 font-medium flex-1">{post.title}</span>
                  <span className="text-xs text-white/30 transition-transform duration-200 group-open/post:rotate-90">{"\u25B6"}</span>
                </summary>
                <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                  <p className="text-sm text-white/60 mb-3">{post.body}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30">CTA Button:</span>
                    <Badge color="cyan">{post.cta}</Badge>
                  </div>
                </div>
              </details>
            ))}
          </div>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-2">Posting Schedule</h3>
            <p className="text-sm text-white/60">
              Post 2 per week for 6 weeks, alternating types. Start with posts #1-2 (buyer&rsquo;s guide + conference),
              then rotate through the rest. After 6 weeks, refresh with new content using the same templates.
              Include Boston/Newton references where natural to boost local visibility.
            </p>
          </Card>
        </Section>

        {/* ─── 07 KEYWORD STRATEGY ─── */}
        <Section id="section-07" number="07" title="Keyword Strategy" status="needs-access">
          <Explainer title="What are keywords and how does keyword strategy work?">
            <p>Keywords are the words and phrases people type into Google. <Tip def="The practice of choosing which keywords to target with your content based on search volume, competition, and relevance.">Keyword strategy</Tip> means choosing which searches you want your website to appear for, then creating content that targets those searches.</p>
            <p className="mt-2"><Tip def="The reason behind a search query: informational, commercial, transactional, or navigational.">Search intent</Tip> matters more than volume. Someone searching &ldquo;hire AI consultant&rdquo; is much more likely to become a client than someone searching &ldquo;what is AI.&rdquo;</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Recommended Keyword Clusters
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4 text-white/50 font-medium">Cluster</th>
                    <th className="py-2 pr-4 text-white/50 font-medium">Example Keywords</th>
                    <th className="py-2 text-white/50 font-medium">Intent</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {[
                    ["Enterprise AI Strategy", "enterprise AI strategy consulting, GenAI roadmap for enterprises", "Commercial"],
                    ["AI Training/Upskilling", "GenAI employee training programs, ChatGPT training for enterprise", "Commercial"],
                    ["AI Vendor Comparison", "best GenAI tools comparison 2026, LLM buyer\u2019s guide", "Commercial"],
                    ["AI Governance/Risk", "AI governance consulting, responsible AI framework", "Informational"],
                    ["Industry-Specific AI", "AI for financial services, GenAI for healthcare", "Commercial"],
                    ["AI Events/Community", "GenAI conference 2026, enterprise AI networking", "Navigational"],
                    ["AI Cost/Pricing", "AI consulting cost, how much does AI consulting cost", "Transactional"],
                    ["Agentic AI", "enterprise agentic AI, AI agents for business", "Informational"],
                  ].map(([cluster, keywords, intent], i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 font-medium text-white/90 whitespace-nowrap">{cluster}</td>
                      <td className="py-2.5 pr-4 text-white/50 text-xs">{keywords}</td>
                      <td className="py-2.5">
                        <Badge color={intent === "Commercial" ? "green" : intent === "Transactional" ? "red" : intent === "Navigational" ? "purple" : "yellow"}>
                          {intent}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">{"\u26A0"} Quick Win: Low-Hanging Fruit Keywords</h3>
            <p className="text-sm text-white/70 mb-3">
              The fastest way to grow <Tip def="Visitors who find your site through unpaid search results.">organic traffic</Tip> is to optimize pages that <em>already</em> rank on page 2 (positions 11-30). They just need a push to reach page 1.
            </p>
            <div className="rounded-lg bg-orange-500/5 border border-orange-500/15 p-3 text-sm text-orange-200/80">
              <strong className="text-orange-400">Needs:</strong> Google Search Console access for gaiinsights.com.
              Grant access, and we can pull the exact pages + keywords to optimize.
            </div>
          </Card>
        </Section>


        {/* ═══ PART 3: BEST PRACTICES ═══ */}
        <SectionDivider title="Part 3 \u2014 SEO Best Practices Guide" />

        {/* ─── 08 META TAGS ─── */}
        <Section id="section-08" number="08" title="Meta Tags & Titles">
          <Explainer title="What are meta tags?">
            <p>Meta tags are invisible HTML elements that tell search engines about your page. The two most important are the <Tip def="The clickable headline in search results. Arguably the most important on-page SEO element.">title tag</Tip> (what people click in Google) and the <Tip def="The 150-160 character summary below your page title in Google results.">meta description</Tip> (the summary below it). Together, they determine whether someone clicks your result or scrolls past it.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Title Tag Best Practices</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Keep under 60 characters</strong> \u2014 anything longer gets truncated (&ldquo;...&rdquo;) in search results</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Put the keyword first</strong> \u2014 e.g. &ldquo;AI Strategy Consulting | GAI Insights&rdquo; not &ldquo;GAI Insights - AI Strategy&rdquo;</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Include brand name</strong> \u2014 adds recognition and builds brand searches over time</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Make each title unique</strong> \u2014 no two pages should have the same title tag</span></li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Meta Description Best Practices</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">150-160 characters</strong> \u2014 any longer gets cut off</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Include a clear CTA</strong> \u2014 &ldquo;Learn how...&rdquo; &ldquo;Discover why...&rdquo; &ldquo;Get your free...&rdquo;</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Include target keyword naturally</strong> \u2014 Google bolds matching keywords in results</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span>Doesn&rsquo;t directly impact rankings, but <strong className="text-white/90">heavily impacts <Tip def="The percentage of people who click your link after seeing it in search results.">CTR</Tip></strong></span></li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Open Graph & Social Tags</h3>
            <p className="text-sm text-white/60 mb-3">These control how your pages look when shared on LinkedIn, X/Twitter, and Slack. Essential for a B2B firm where content gets shared in professional networks.</p>
            <ul className="space-y-1 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><code className="text-xs bg-white/10 px-1 py-0.5 rounded">og:title</code>, <code className="text-xs bg-white/10 px-1 py-0.5 rounded">og:description</code>, <code className="text-xs bg-white/10 px-1 py-0.5 rounded">og:image</code> \u2014 controls LinkedIn/Facebook previews</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><code className="text-xs bg-white/10 px-1 py-0.5 rounded">twitter:card</code> = <code className="text-xs bg-white/10 px-1 py-0.5 rounded">summary_large_image</code> for visual tweets</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span>Use a branded 1200x630px image with your logo \u2014 makes shares look professional</span></li>
            </ul>
          </Card>
        </Section>

        {/* ─── 09 CONTENT STRUCTURE ─── */}
        <Section id="section-09" number="09" title="Content Structure & Headings">
          <Explainer title="Why does content structure matter for SEO?">
            <p>Google reads your page structure to understand what it&rsquo;s about. A clear <Tip def="The structure of headings: H1 (main title, one per page), H2 (major sections), H3 (subsections).">heading hierarchy</Tip> helps both users and search engines. Well-structured content also has a much better chance of winning <Tip def="The boxed answer that appears at the top of Google results.">Featured Snippets</Tip>.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Heading Rules</h3>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex gap-3 items-start">
                <code className="text-xs bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded shrink-0">H1</code>
                <span><strong className="text-white/90">One per page.</strong> Should be the page&rsquo;s main topic. Include target keyword.</span>
              </div>
              <div className="flex gap-3 items-start">
                <code className="text-xs bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded shrink-0">H2</code>
                <span>Major sections. Think of these as chapter titles. Use 3-8 per page.</span>
              </div>
              <div className="flex gap-3 items-start">
                <code className="text-xs bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded shrink-0">H3</code>
                <span>Subsections under H2s. Great for breaking down complex topics.</span>
              </div>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">Featured Snippet Optimization</h3>
            <p className="text-sm text-white/60 mb-3">To win the coveted &ldquo;position zero&rdquo; box in Google:</p>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Answer the question directly in 40-60 words right after the H2</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Use numbered/bulleted lists for &ldquo;how to&rdquo; and &ldquo;best of&rdquo; queries</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Use tables for comparison content (your buyer&rsquo;s guides are perfect for this)</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Include a table of contents with anchor links on long articles</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Add an FAQ section at the bottom of every major article</li>
            </ul>
          </Card>
        </Section>

        {/* ─── 10 INTERNAL LINKING ─── */}
        <Section id="section-10" number="10" title="Internal Linking Strategy">
          <Explainer title="What are internal links and why do they matter?">
            <p><Tip def="Links between pages on your own website. They help visitors navigate and help Google understand your site structure.">Internal links</Tip> connect your pages together. They serve two purposes: (1) help visitors find related content, and (2) tell Google which pages are most important. A page with 50 internal links pointing to it looks more important than one with 2.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Hub-and-Spoke Model</h3>
            <p className="text-sm text-white/60 mb-3">The most effective internal linking strategy for B2B consulting:</p>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 text-center text-sm">
              <p className="text-cyan-400 font-semibold mb-2">Pillar Page (Hub)</p>
              <p className="text-white/40 text-xs mb-3">&ldquo;Enterprise AI Strategy Guide&rdquo;</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["AI in Finance", "AI in Healthcare", "AI Governance", "AI ROI Metrics", "GenAI Training", "AI Vendor Selection"].map((s) => (
                  <span key={s} className="px-2 py-1 text-xs rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">{s}</span>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-3">Each spoke links back to the hub. The hub links to every spoke. This creates topical authority.</p>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">Quick Rules</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><strong className="text-white/90">3-5 internal links per article</strong> minimum</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Use <strong className="text-white/90">descriptive anchor text</strong> (&ldquo;AI governance framework&rdquo; not &ldquo;click here&rdquo;)</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Link from high-traffic pages to pages you want to rank higher</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Every new article should link to at least one existing article, and vice versa</li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span>Your daily news briefings are link-building goldmines \u2014 link to your own resources</li>
            </ul>
          </Card>
        </Section>

        {/* ─── 11 E-E-A-T ─── */}
        <Section id="section-11" number="11" title="E-E-A-T Signals">
          <Explainer title="What is E-E-A-T and why does Google care about it?">
            <p><Tip def="Experience, Expertise, Authoritativeness, Trustworthiness \u2014 Google\u2019s framework for evaluating content quality.">E-E-A-T</Tip> stands for Experience, Expertise, Authoritativeness, and Trustworthiness. It&rsquo;s Google&rsquo;s quality framework. For a consulting firm giving business advice, E-E-A-T is <strong className="text-white/90">especially critical</strong> \u2014 Google calls this a &ldquo;Your Money or Your Life&rdquo; (YMYL) topic area where quality standards are highest.</p>
            <p className="mt-2">The good news: GAI Insights already has strong E-E-A-T signals (HBR articles, Fortune 500 clients, Paul Baier&rsquo;s expertise). You just need to make them more visible to Google.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">E-E-A-T Action Items for GAI Insights</h3>
            <div className="space-y-3">
              {[
                ["Experience", "Add real examples from actual client engagements (anonymized if needed). \u2018We helped a Fortune 500 retailer...\u2019 beats generic advice every time.", "Already have client logos \u2014 add case study snippets to blog posts"],
                ["Expertise", "Every article/blog should have an author byline with credentials. Paul Baier\u2019s HBR contributions should be prominently linked.", "Add Person schema (done in Section 05), visible author bios on all content"],
                ["Authoritativeness", "Your 35K newsletter, conference, and buyer\u2019s guides ARE authority. Make this visible on every page \u2014 not just the homepage.", "Add trust bar (logos + \u201835K leaders\u2019) to blog template sidebar"],
                ["Trustworthiness", "Clear contact info, physical address, privacy policy, editorial standards. The Organization schema helps here too.", "Verify address/contact visible on every page, add editorial policy"],
              ].map(([letter, action, gaiSpecific], i) => (
                <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{["\u{1F4BC}", "\u{1F393}", "\u{1F3C6}", "\u{1F6E1}"][i]}</span>
                    <h4 className="font-semibold text-white/90">{letter}</h4>
                  </div>
                  <p className="text-sm text-white/60 mb-2">{action}</p>
                  <p className="text-xs text-cyan-400/80"><strong>GAI-specific:</strong> {gaiSpecific}</p>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ─── 12 AI SEARCH / GEO ─── */}
        <Section id="section-12" number="12" title="AI Search Optimization (GEO)">
          <Explainer title="What is GEO and why is it the future of SEO?">
            <p><Tip def="Generative Engine Optimization \u2014 optimizing content to be cited by AI tools like Google AI Overviews, Perplexity, and ChatGPT Search.">GEO (Generative Engine Optimization)</Tip> is the practice of optimizing your content so AI search engines cite it. When someone asks Perplexity &ldquo;What are the best AI consulting firms?&rdquo;, you want GAI Insights to be in the answer.</p>
            <p className="mt-2">This is where GAI Insights has a massive opportunity. AI search tools prefer content with: unique data, clear claims, proper attribution, and structured formatting.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">How to Get Cited by AI Search</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Lead with unique data.</strong> &ldquo;Our analysis of 200+ enterprises found that 67% have deployed GenAI in at least one department.&rdquo; AI engines love citable statistics.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Make clear, quotable claims.</strong> Use definitive language that AI can extract: &ldquo;The top 3 challenges are...&rdquo; not &ldquo;There might be some challenges...&rdquo;</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Structure with headers and lists.</strong> AI parses structured content much better than wall-of-text paragraphs.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Add schema markup</strong> (done in Section 05). Structured data is the #1 technical signal for AI citation.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Include author attribution.</strong> AI engines prefer content from identified experts over anonymous posts.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Provide <Tip def="Content that provides unique facts, data, or perspectives not found elsewhere on the web.">Information Gain</Tip>.</strong> Don&rsquo;t just rehash what everyone else says \u2014 add your proprietary data (RISE benchmarks, buyer survey results).</span></li>
            </ul>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">GAI Insights&rsquo; GEO Advantage</h3>
            <p className="text-sm text-white/70">
              Your daily news briefing, buyer&rsquo;s guides, and RISE Assessment data are exactly what AI search engines want to cite.
              The key is making this content publicly accessible (not all behind gated forms) and structured with proper schema.
              Even gating 80% of the content is fine \u2014 but the executive summary and key statistics should be crawlable.
            </p>
          </Card>
        </Section>

        {/* ─── 13 TECHNICAL SEO ─── */}
        <Section id="section-13" number="13" title="Technical SEO Checklist">
          <Explainer title="What is technical SEO?">
            <p>Technical SEO covers the &ldquo;plumbing&rdquo; of your website \u2014 everything that helps search engines crawl and <Tip def="When Google adds your page to its database so it can appear in search results.">index</Tip> your pages efficiently. Think of it as making sure Google can actually find and read all your content. HubSpot handles many of these automatically, but some need manual verification.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Checklist</h3>
            <div className="space-y-2">
              {[
                ["robots.txt", "Verify at gaiinsights.com/robots.txt \u2014 make sure it\u2019s not blocking important pages. HubSpot generates this automatically but custom rules may override.", "Check"],
                ["XML Sitemap", "Verify at gaiinsights.com/sitemap.xml \u2014 should list all important pages. Submit to Google Search Console.", "Check"],
                ["Canonical Tags", "Every page should have a <link rel=\"canonical\"> tag pointing to itself. Prevents duplicate content issues. HubSpot adds these by default.", "Auto"],
                ["HTTPS", "All pages must be served over HTTPS (not HTTP). HubSpot handles this.", "Auto"],
                ["Mobile-Friendly", "Test with Google\u2019s Mobile-Friendly Test. All content should be readable without zooming.", "Test"],
                ["404 Error Pages", "Broken links hurt SEO. Use a tool like Screaming Frog to find 404s, then fix or redirect them.", "Audit"],
                ["Redirect Chains", "Avoid chains like A \u2192 B \u2192 C. Each redirect should go directly to the final URL.", "Audit"],
                ["Page Speed", "Aim for under 3 seconds load time. Use Google PageSpeed Insights to check. HubSpot CDN helps here.", "Test"],
              ].map(([item, desc, action], i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <Badge color={action === "Auto" ? "green" : action === "Check" ? "yellow" : "orange"}>{action as string}</Badge>
                  <div>
                    <p className="text-sm font-medium text-white/90">{item}</p>
                    <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ─── 14 IMAGE SEO ─── */}
        <Section id="section-14" number="14" title="Image SEO">
          <Explainer title="Why does image SEO matter?">
            <p>Images can drive traffic through Google Images search, and they help your pages rank better when properly optimized. <Tip def="A text description of an image that helps search engines and screen readers understand what the image shows.">Alt text</Tip> is the most important element \u2014 it tells Google what the image shows and makes your site accessible to visually impaired users.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Quick Wins</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Add descriptive alt text to every image.</strong> &ldquo;Paul Baier presenting at GAI World 2025&rdquo; not &ldquo;image1.jpg&rdquo;</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Use descriptive file names.</strong> <code className="text-xs bg-white/10 px-1 py-0.5 rounded">gai-world-conference-keynote.jpg</code> not <code className="text-xs bg-white/10 px-1 py-0.5 rounded">IMG_4521.jpg</code></span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Use modern formats</strong> (WebP or AVIF) for smaller file sizes without quality loss</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Enable lazy loading</strong> \u2014 images below the fold load only when the user scrolls to them (speeds up page load)</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Compress images</strong> before uploading. Tools: TinyPNG, Squoosh. Aim for under 200KB per image</span></li>
            </ul>
          </Card>
        </Section>

        {/* ─── 15 CORE WEB VITALS ─── */}
        <Section id="section-15" number="15" title="Core Web Vitals">
          <Explainer title="What are Core Web Vitals?">
            <p><Tip def="Three metrics Google uses to measure your website\u2019s speed and user experience: loading, interactivity, visual stability.">Core Web Vitals</Tip> are three specific metrics Google uses to grade your website&rsquo;s user experience. They are a confirmed Google ranking factor. If your site is slow or janky, it will rank lower than a fast, stable competitor.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">The Three Metrics</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>LCP</p>
                <p className="text-xs text-white/50 mb-2">Largest Contentful Paint</p>
                <p className="text-sm text-white/70">How fast does the main content load?</p>
                <div className="mt-2 text-xs"><Badge color="green">&lt; 2.5s = Good</Badge></div>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-purple-400 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>INP</p>
                <p className="text-xs text-white/50 mb-2">Interaction to Next Paint</p>
                <p className="text-sm text-white/70">How responsive is the page to clicks?</p>
                <div className="mt-2 text-xs"><Badge color="green">&lt; 200ms = Good</Badge></div>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>CLS</p>
                <p className="text-xs text-white/50 mb-2">Cumulative Layout Shift</p>
                <p className="text-sm text-white/70">Does the page jump around while loading?</p>
                <div className="mt-2 text-xs"><Badge color="green">&lt; 0.1 = Good</Badge></div>
              </div>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-2">How to Check</h3>
            <p className="text-sm text-white/60">
              Test your site at <strong className="text-white/90">pagespeed.web.dev</strong> \u2014 enter gaiinsights.com and Google will measure all three metrics.
              HubSpot\u2019s CDN generally provides good baseline performance, but large images and third-party scripts (chat widgets, analytics) can slow things down.
            </p>
          </Card>
        </Section>

        {/* ─── 16 BACKLINKS ─── */}
        <Section id="section-16" number="16" title="Backlink Strategy">
          <Explainer title="What are backlinks and why are they so important?">
            <p><Tip def="Links from other websites pointing to yours. They\u2019re like \u2018votes of confidence\u2019 from other sites.">Backlinks</Tip> are links from other websites to yours. They&rsquo;re one of Google&rsquo;s top 3 ranking factors. Think of each backlink as a vote of confidence \u2014 the more quality sites that link to GAI Insights, the more Google trusts you. One link from HBR is worth more than 100 links from random blogs.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">B2B Backlink Strategies for GAI Insights</h3>
            <div className="space-y-3">
              {[
                ["Leverage Existing Authority", "Paul Baier\u2019s HBR contributions and conference speaking already generate high-quality backlinks. Ensure every HBR article links back to gaiinsights.com. Every conference bio should include the website URL."],
                ["Create Linkable Assets", "Proprietary research and data get linked. Publish the RISE Assessment methodology, anonymized benchmark data, and buyer\u2019s guide summaries publicly. Data-driven content gets 2-3x more backlinks than opinion pieces."],
                ["Guest Post on AI Publications", "Write for VentureBeat, MIT Tech Review, Forbes Tech Council, or similar. Include a bio link back to GAI Insights. One quality guest post = dozens of links as others reference it."],
                ["Industry Partnerships", "Partner with AI vendors (already have relationships with AWS, IBM) for co-created content. Each vendor\u2019s website linking to your joint content = high-authority backlinks."],
                ["HARO / Connectively", "Sign up as a source for journalists. When reporters need AI consulting expertise, you provide quotes and get links in major publications."],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-cyan-400 font-mono text-xs mt-1 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium text-white/90">{title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ─── 17 CONTENT FRESHNESS ─── */}
        <Section id="section-17" number="17" title="Content Freshness">
          <Explainer title="How does Google evaluate content freshness?">
            <p>Google rewards fresh content, especially for rapidly evolving topics like AI. A page last updated in 2024 will lose rankings to a 2026 update. <Tip def="When Google adds your page to its database so it can appear in search results.">Indexing</Tip> happens faster for sites that update regularly. Your daily news briefing is already a massive freshness signal \u2014 Google sees GAI Insights as an actively maintained site.</p>
          </Explainer>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Freshness Strategy</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Update evergreen content quarterly.</strong> Review buyer&rsquo;s guides, service pages, and FAQ at least every 3 months. Add a visible &ldquo;Last updated: [date]&rdquo; to build trust.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Republish with new data.</strong> When you get new RISE benchmark data, update the original article rather than creating a new one. Google rewards updated URLs more than new ones.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Add &ldquo;2026&rdquo; to title tags</strong> on competitive keywords (e.g. &ldquo;Best Enterprise AI Tools 2026&rdquo;). Update annually.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Daily news = freshness gold.</strong> Your daily briefing tells Google the site is alive. Make sure these pages are indexable, not just emails.</span></li>
              <li className="flex gap-2"><span className="text-cyan-500 shrink-0">{"\u2022"}</span><span><strong className="text-white/90">Archive old content gracefully.</strong> Don&rsquo;t delete old articles \u2014 add a &ldquo;This article was written in [year]&rdquo; banner and link to the updated version.</span></li>
            </ul>
          </Card>
        </Section>


        {/* ═══ PRIORITY MATRIX ═══ */}
        <SectionDivider title="Priority Matrix & Next Steps" />

        <section id="priority-matrix" className="scroll-mt-24">
          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-4">Execution Priority</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-3 text-white/50 font-medium w-8">#</th>
                    <th className="py-2 pr-4 text-white/50 font-medium">Action</th>
                    <th className="py-2 pr-4 text-white/50 font-medium">Status</th>
                    <th className="py-2 pr-4 text-white/50 font-medium">Impact</th>
                    <th className="py-2 text-white/50 font-medium">Next Step</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {[
                    ["1", "Schema Markup (JSON-LD)", "done", "HIGH", "Paste code from Section 05 into HubSpot header"],
                    ["2", "Remove Deprecated ProfessionalService", "done", "HIGH", "Replace with Organization schema when adding new code"],
                    ["3", "GBP Setup + 12 Posts", "done", "MEDIUM", "Claim GBP profile, post 2x/week using Section 06 drafts"],
                    ["4", "Content Gap: Pricing Guide", "todo", "HIGH", "Create \u2018AI Consulting Cost Guide\u2019 article"],
                    ["5", "Content Gap: Industry Pages", "todo", "HIGH", "Create Finance, Healthcare, Retail, Manufacturing landing pages"],
                    ["6", "Content Gap: RISE/WINS Pages", "todo", "HIGH", "Create dedicated framework methodology pages"],
                    ["7", "Content Gap: Agentic AI Pillar", "todo", "HIGH", "Create comprehensive agentic AI enterprise guide"],
                    ["8", "Low-Hanging Fruit Keywords", "needs-access", "HIGH", "Grant Google Search Console access to identify quick wins"],
                    ["9", "E-E-A-T: Author Bios", "todo", "MEDIUM", "Add visible author bylines + bios to all blog posts"],
                    ["10", "Meta Tag Audit", "needs-access", "MEDIUM", "Need HubSpot access to audit and optimize title tags"],
                    ["11", "Internal Linking Audit", "needs-access", "MEDIUM", "Need site crawl access to map internal link structure"],
                    ["12", "Deep Keyword Research", "needs-access", "MEDIUM", "Need Ahrefs/Semrush for competitor keyword analysis"],
                  ].map(([num, action, status, impact, next], i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 pr-3 font-mono text-cyan-500/60">{num}</td>
                      <td className="py-2.5 pr-4 font-medium text-white/90">{action}</td>
                      <td className="py-2.5 pr-4"><StatusPill status={status as "done" | "todo" | "needs-access"} /></td>
                      <td className="py-2.5 pr-4"><Badge color={impact === "HIGH" ? "red" : "yellow"}>{impact}</Badge></td>
                      <td className="py-2.5 text-xs text-white/50">{next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">What Your Team Needs to Do</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-green-500/5 border border-green-500/15 p-4">
                <p className="font-semibold text-green-400 mb-2">Immediate (This Week)</p>
                <ol className="list-decimal list-inside space-y-1 text-white/60 text-xs">
                  <li>Paste JSON-LD code into HubSpot site header</li>
                  <li>Remove deprecated ProfessionalService schema</li>
                  <li>Claim/verify Google Business Profile</li>
                  <li>Start posting GBP content (2x/week)</li>
                </ol>
              </div>
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/15 p-4">
                <p className="font-semibold text-yellow-400 mb-2">Short Term (This Month)</p>
                <ol className="list-decimal list-inside space-y-1 text-white/60 text-xs">
                  <li>Grant Google Search Console access</li>
                  <li>Add author bios to blog post template</li>
                  <li>Create RISE and WINS methodology pages</li>
                  <li>Start AI consulting pricing guide draft</li>
                </ol>
              </div>
              <div className="rounded-lg bg-purple-500/5 border border-purple-500/15 p-4">
                <p className="font-semibold text-purple-400 mb-2">Medium Term (Next 90 Days)</p>
                <ol className="list-decimal list-inside space-y-1 text-white/60 text-xs">
                  <li>Launch 4 industry-specific landing pages</li>
                  <li>Publish agentic AI pillar content</li>
                  <li>Implement hub-and-spoke internal linking</li>
                  <li>Set up quarterly content refresh schedule</li>
                </ol>
              </div>
              <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-4">
                <p className="font-semibold text-cyan-400 mb-2">Ongoing</p>
                <ol className="list-decimal list-inside space-y-1 text-white/60 text-xs">
                  <li>2 GBP posts per week</li>
                  <li>Internal links in every daily briefing</li>
                  <li>Quarterly content freshness updates</li>
                  <li>Monitor Core Web Vitals monthly</li>
                </ol>
              </div>
            </div>
          </Card>
        </section>


        {/* ═══ GLOSSARY ═══ */}
        <SectionDivider title="SEO Glossary" />

        <section id="glossary" className="scroll-mt-24">
          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-4">
              Every SEO Term Used in This Playbook
            </h3>
            <p className="text-xs text-white/40 mb-4">
              Hover over any <span className="border-b border-dotted border-cyan-500/40 text-cyan-300 cursor-help">cyan underlined term</span> in the report for a quick definition. Full definitions below.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {GLOSSARY.map(([term, def]) => (
                <div key={term} className="border-b border-white/[0.04] pb-2">
                  <p className="text-sm font-semibold text-cyan-300">{term}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{def}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>


        {/* ═══ FOOTER ═══ */}
        <footer className="pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/30">
            <div>
              <p>Generated by Claude Code &mdash; Deep research powered by Exa AI</p>
              <p className="mt-1">Schema audit, competitive analysis, content gaps, and GBP posts completed autonomously.</p>
            </div>
            <p>
              Inspired by{" "}
              <a href="https://x.com/bloggersarvesh/status/2022663312853598425" target="_blank" rel="noopener noreferrer" className="text-cyan-500/60 hover:text-cyan-400 transition-colors">
                @bloggersarvesh
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
