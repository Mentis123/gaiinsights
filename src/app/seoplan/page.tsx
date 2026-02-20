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
    <section id={id} className="scroll-mt-28">
      <div className="flex items-start gap-4 mb-8">
        <span
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-sm font-bold tracking-wide border border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-400"
          style={{ fontFamily: "Syne, sans-serif", fontVariantNumeric: "tabular-nums" }}
        >
          {number}
        </span>
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>{title}</h2>
            {status && <StatusPill status={status} />}
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-cyan-500/30 to-transparent" />
        </div>
      </div>
      <div className="space-y-5 pl-0 md:pl-[3.75rem]">{children}</div>
    </section>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 transition-colors duration-300 ${accent
      ? "bg-gradient-to-br from-cyan-500/[0.06] to-cyan-500/[0.02] border-cyan-500/20 shadow-[inset_0_1px_0_rgba(10,172,220,0.08)]"
      : "bg-white/[0.015] border-white/[0.06] hover:border-white/[0.1]"
    }`}>
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
    <details className="group/exp rounded-xl border border-cyan-500/12 bg-cyan-500/[0.025] overflow-hidden backdrop-blur-sm">
      <summary className="flex items-center gap-2.5 cursor-pointer p-4 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors [&::-webkit-details-marker]:hidden list-none">
        <span className="transition-transform duration-200 group-open/exp:rotate-90 text-[10px] opacity-60">{"\u25B6"}</span>
        <span className="flex items-center gap-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400/60 shrink-0" />
          {title}
        </span>
      </summary>
      <div className="px-5 pb-5 text-sm text-white/65 border-t border-cyan-500/8 pt-4 space-y-2.5 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

/** Level 2 Deep Dive — purple-accented expandable with research data */
function DeepDive({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group/dd rounded-xl border border-purple-500/12 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(67,21,125,0.04) 0%, rgba(155,105,255,0.02) 100%)" }}>
      <summary className="flex items-center gap-2.5 cursor-pointer p-4 text-sm font-medium text-purple-400/90 hover:text-purple-300 transition-colors [&::-webkit-details-marker]:hidden list-none">
        <span className="transition-transform duration-200 group-open/dd:rotate-90 text-[10px] opacity-60">{"\u25B6"}</span>
        <span className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] uppercase rounded-md border text-purple-300/90" style={{ background: "linear-gradient(135deg, rgba(67,21,125,0.3) 0%, rgba(155,105,255,0.2) 100%)", borderColor: "rgba(155,105,255,0.25)" }}>LVL 2</span>
          {title}
        </span>
      </summary>
      <div className="px-5 pb-5 text-sm text-white/60 border-t border-purple-500/8 pt-4 space-y-3 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(0,29,88,0.15) 0%, rgba(2,6,23,0.4) 100%)" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]" style={{ background: "rgba(0,29,88,0.2)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="w-2 h-2 rounded-full bg-white/10" />
          </div>
          <span className="text-xs font-medium text-white/50">{title}</span>
        </div>
        <span className="text-[10px] text-cyan-500/40 font-mono tracking-wide">JSON-LD</span>
      </div>
      <pre className="p-5 text-xs text-cyan-200/70 overflow-x-auto leading-relaxed font-mono">
        {code}
      </pre>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="pt-12 pb-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/10 bg-cyan-500/[0.03]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-cyan-400/50" style={{ fontFamily: "Syne, sans-serif" }}>
            {title}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
        </div>
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
      <header className="border-b border-white/[0.05] sticky top-0 z-50" style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(16px) saturate(1.5)", WebkitBackdropFilter: "blur(16px) saturate(1.5)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400/80" style={{ boxShadow: "0 0 8px rgba(10,172,220,0.4)" }} />
              <span className="text-[15px] font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
                <span className="text-cyan-400">GAI</span> <span className="text-white/85">Insights</span>
              </span>
            </div>
            <span className="text-white/10 text-xs">|</span>
            <span className="text-white/35 text-xs font-medium tracking-wide">SEO Playbook</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#priority-matrix" className="text-[11px] text-cyan-500/50 hover:text-cyan-400 transition-colors tracking-wide uppercase font-medium" style={{ fontFamily: "Syne, sans-serif" }}>Action Items</a>
            <a href="#glossary" className="text-[11px] text-cyan-500/50 hover:text-cyan-400 transition-colors tracking-wide uppercase font-medium" style={{ fontFamily: "Syne, sans-serif" }}>Glossary</a>
            <span className="text-white/20 text-xs font-mono">02.2026</span>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <div className="relative overflow-hidden">
        {/* Circuit-arc decorative SVG */}
        <svg className="absolute top-6 right-0 w-[420px] h-[420px] opacity-[0.04] pointer-events-none" viewBox="0 0 420 420" fill="none" aria-hidden="true">
          <circle cx="210" cy="210" r="180" stroke="#0AACDC" strokeWidth="0.75" strokeDasharray="4 8" />
          <circle cx="210" cy="210" r="140" stroke="#0AACDC" strokeWidth="0.5" strokeDasharray="2 6" />
          <circle cx="210" cy="210" r="100" stroke="#0AACDC" strokeWidth="0.5" />
          <path d="M210 30 A180 180 0 0 1 390 210" stroke="#0AACDC" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M210 70 A140 140 0 0 1 350 210" stroke="#9B69FF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="390" cy="210" r="3" fill="#0AACDC" opacity="0.8" />
          <circle cx="350" cy="210" r="2.5" fill="#9B69FF" opacity="0.6" />
          <circle cx="210" cy="30" r="2" fill="#0AACDC" opacity="0.5" />
          <circle cx="300" cy="55" r="1.5" fill="#0AACDC" opacity="0.4" />
          <circle cx="370" cy="120" r="2" fill="#0AACDC" opacity="0.3" />
        </svg>

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 relative">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px w-8 bg-gradient-to-r from-cyan-400/60 to-transparent" />
            <p className="text-cyan-400/80 text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: "Syne, sans-serif" }}>
              Comprehensive SEO Playbook
            </p>
          </div>
          <h1 className="text-4xl md:text-[3.25rem] font-extrabold leading-[1.12] mb-5 tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
            SEO Action Plan for{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              gaiinsights.com
            </span>
          </h1>
          <p className="text-white/45 text-lg max-w-2xl mb-8 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
            Real audit findings, ready-to-use code, 12 drafted posts, and a complete best practices
            guide. Built so your team can execute without needing an SEO expert.
          </p>
          <div className="flex flex-wrap gap-2.5 text-xs">
            {([
              ["4 Audits Complete", "green"],
              ["6 JSON-LD Code Blocks", "cyan"],
              ["12 GBP Posts Drafted", "purple"],
              ["10 Best Practice Guides", "yellow"],
            ] as const).map(([label, color]) => (
              <span key={label} className={`px-3.5 py-1.5 rounded-full border font-medium tracking-wide ${
                color === "green" ? "bg-green-500/8 text-green-400/90 border-green-500/15" :
                color === "cyan" ? "bg-cyan-500/8 text-cyan-400/90 border-cyan-500/15" :
                color === "purple" ? "bg-purple-500/8 text-purple-400/90 border-purple-500/15" :
                "bg-yellow-500/8 text-yellow-400/90 border-yellow-500/15"
              }`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Quick SEO Primer ─── */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <Explainer title="New to SEO? Start here \u2014 60-second primer">
          <p><strong className="text-white/90">SEO (Search Engine Optimization)</strong> is the practice of making your website show up higher in Google (and AI search tools like Perplexity and ChatGPT). Higher rankings = more people find you = more leads.</p>
          <p className="mt-2">This playbook covers <strong className="text-white/90">everything</strong> your website needs to rank well. The most impactful items are at the top. Green badges mean we&rsquo;ve already done the work \u2014 you just need to paste the code into HubSpot. Orange badges mean you need to grant us access to a tool first.</p>
        </Explainer>
      </div>

      {/* ─── Reading Guide ─── */}
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <div className="rounded-xl border border-white/[0.05] p-5" style={{ background: "rgba(0,29,88,0.06)" }}>
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 mb-3" style={{ fontFamily: "Syne, sans-serif" }}>How to Read This Document</p>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 border-b border-dotted border-cyan-500/40 text-cyan-300 cursor-help text-sm">term</span>
              <p className="text-white/40">Hover any <span className="text-cyan-300/70">cyan underlined</span> word for an instant definition</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
              <p className="text-white/40"><span className="text-cyan-400/70">Cyan boxes</span> explain concepts &mdash; expand if you need background</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-px px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase rounded-md text-purple-300/70 border border-purple-500/20" style={{ background: "rgba(67,21,125,0.2)" }}>LVL 2</span>
              <p className="text-white/40"><span className="text-purple-400/70">Purple boxes</span> contain deep research data &mdash; expand for specifics</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TOC ─── */}
      <div className="max-w-5xl mx-auto px-6 pb-14">
        <nav className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(0,29,88,0.12) 0%, rgba(2,6,23,0.3) 100%)" }}>
          {/* TOC header bar */}
          <div className="px-6 py-3.5 border-b border-white/[0.05] flex items-center justify-between" style={{ background: "rgba(0,29,88,0.15)" }}>
            <div className="flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="rgba(10,172,220,0.5)" strokeWidth="1" />
                <rect x="8" y="1" width="5" height="5" rx="1" stroke="rgba(10,172,220,0.3)" strokeWidth="1" />
                <rect x="1" y="8" width="5" height="5" rx="1" stroke="rgba(10,172,220,0.3)" strokeWidth="1" />
                <rect x="8" y="8" width="5" height="5" rx="1" stroke="rgba(10,172,220,0.2)" strokeWidth="1" />
              </svg>
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40" style={{ fontFamily: "Syne, sans-serif" }}>Mission Index</span>
            </div>
            <span className="text-[10px] text-white/20 font-mono">17 sections</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Part 1 */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="h-px w-3 bg-cyan-500/30" />
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-cyan-500/50">Part 1 &mdash; Audit Findings</p>
              </div>
              <ol className="grid sm:grid-cols-2 gap-1 text-sm">
                {([
                  ["01", "Schema Markup Audit", "done"],
                  ["02", "Competitive Landscape", "done"],
                  ["03", "Content Gap Analysis", "done"],
                  ["04", "Business Profile", "done"],
                ] as const).map(([n, label, status]) => (
                  <li key={n}>
                    <a href={`#section-${n}`} className="group flex items-center gap-2.5 text-white/45 hover:text-cyan-400 transition-colors py-1.5 px-2 -mx-2 rounded-lg hover:bg-cyan-500/[0.04]">
                      <span className="text-cyan-500/40 group-hover:text-cyan-400 font-mono text-xs w-5 tabular-nums">{n}</span>
                      <span className="flex-1">{label}</span>
                      <StatusPill status={status} />
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* Part 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="h-px w-3 bg-purple-500/30" />
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-purple-500/50">Part 2 &mdash; Ready-to-Use Deliverables</p>
              </div>
              <ol className="grid sm:grid-cols-2 gap-1 text-sm">
                {([
                  ["05", "Schema Code (JSON-LD)", "done"],
                  ["06", "GBP Posts (12 Drafted)", "done"],
                  ["07", "Keyword Strategy", "needs-access"],
                ] as const).map(([n, label, status]) => (
                  <li key={n}>
                    <a href={`#section-${n}`} className="group flex items-center gap-2.5 text-white/45 hover:text-cyan-400 transition-colors py-1.5 px-2 -mx-2 rounded-lg hover:bg-cyan-500/[0.04]">
                      <span className="text-cyan-500/40 group-hover:text-cyan-400 font-mono text-xs w-5 tabular-nums">{n}</span>
                      <span className="flex-1">{label}</span>
                      <StatusPill status={status} />
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* Part 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="h-px w-3 bg-yellow-500/30" />
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-yellow-500/50">Part 3 &mdash; SEO Best Practices Guide</p>
              </div>
              <ol className="grid sm:grid-cols-2 gap-1 text-sm">
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
                    <a href={`#section-${n}`} className="group flex items-center gap-2.5 text-white/45 hover:text-cyan-400 transition-colors py-1.5 px-2 -mx-2 rounded-lg hover:bg-cyan-500/[0.04]">
                      <span className="text-cyan-500/40 group-hover:text-cyan-400 font-mono text-xs w-5 tabular-nums">{n}</span>
                      <span className="flex-1">{label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════
          CONTENT
         ═══════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-20">

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

          <DeepDive title="Deep dive: Meta tag stats, robots directives, and OG specs">
            <p><strong className="text-white/90">Google rewrites 60-70% of meta descriptions</strong> it deems inadequate. If yours are vague or missing, Google will auto-generate one from your page content &mdash; and you lose control of your messaging in search results.</p>
            <p><strong className="text-white/90">OG Image specifications:</strong> 1200&times;630px is the universal standard across Facebook, LinkedIn, X, Slack, and Discord. Use PNG for text-heavy images (sharper rendering) and JPEG for photos. Always include <code className="text-xs bg-white/10 px-1 py-0.5 rounded">og:image:width</code> and <code className="text-xs bg-white/10 px-1 py-0.5 rounded">og:image:height</code> attributes for faster social card rendering.</p>
            <p><strong className="text-white/90">Robots meta tag:</strong> Ensure <code className="text-xs bg-white/10 px-1 py-0.5 rounded">index, follow</code> on pages you want ranked. Use <code className="text-xs bg-white/10 px-1 py-0.5 rounded">noindex</code> on thank-you pages, internal search results, and staging pages. A common mistake is accidentally noindexing important pages during site redesigns.</p>
            <p><strong className="text-white/90">Twitter/X card setup:</strong> Add <code className="text-xs bg-white/10 px-1 py-0.5 rounded">twitter:site</code> with your X handle. Use <code className="text-xs bg-white/10 px-1 py-0.5 rounded">summary_large_image</code> card type for maximum visual impact. The same 1200&times;630 image works for both OG and Twitter cards &mdash; no need for separate assets.</p>
          </DeepDive>
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

          <DeepDive title="Deep dive: Featured snippet types, PAA targeting, and FAQ schema impact">
            <p><strong className="text-white/90">4 types of Featured Snippets:</strong> paragraphs (most common), lists, tables, and videos. For paragraph snippets: answer concisely in 40-60 words immediately below the H2. For tables: use HTML <code className="text-xs bg-white/10 px-1 py-0.5 rounded">&lt;table&gt;</code> elements &mdash; your buyer&rsquo;s guides are perfect for this format.</p>
            <p><strong className="text-white/90">People Also Ask (PAA) boxes appear in ~65% of all Google searches.</strong> Research the PAA questions for your target queries using AlsoAsked.com or AnswerThePublic, then dedicate H2/H3 sections to answering them exactly. This is one of the highest-opportunity SERP features.</p>
            <p><strong className="text-white/90">FAQ sections with <code className="text-xs bg-white/10 px-1 py-0.5 rounded">FAQPage</code> schema</strong> serve triple duty: they win FAQ rich results (expandable Q&amp;A directly in search), feed into AI Overviews, and appear in voice search results. Aim for 5-8 questions per page with 2-3 sentence answers.</p>
            <p><strong className="text-white/90">Table of Contents with jump links</strong> on articles over 1,500 words can earn &ldquo;jump to&rdquo; links in Google search results, giving you more visual real estate on the SERP. Google uses these to link directly to relevant sections.</p>
          </DeepDive>
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

          <DeepDive title="Deep dive: Link density rules, click depth, and missed opportunity stats">
            <p><strong className="text-white/90">82% of potential internal link opportunities</strong> on the average website go unused. Most sites dramatically under-link their content.</p>
            <p><strong className="text-white/90">The 200-300 word rule:</strong> Include one contextual internal link for every 200-300 words of content. A 2,000-word article should have approximately 7-10 internal links. There&rsquo;s no penalty for &ldquo;too many&rdquo; links &mdash; relevance is what matters.</p>
            <p><strong className="text-white/90">Click depth matters:</strong> Any important page should be reachable within 3 clicks from the homepage. Google gives more weight to links in body content than links in navigation menus.</p>
            <p><strong className="text-white/90">Strategic link equity flow:</strong> Check Google Search Console to identify your highest-authority pages, then link from those to pages you want to boost. Your homepage, about page, and top-ranking blog posts carry the most &ldquo;link juice.&rdquo;</p>
            <p><strong className="text-white/90">Anchor text variation:</strong> Vary anchor text slightly across different linking pages to avoid looking manipulative &mdash; &ldquo;AI readiness assessment framework,&rdquo; &ldquo;our RISE assessment,&rdquo; &ldquo;AI maturity benchmarking&rdquo; all linking to the same page.</p>
          </DeepDive>
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

          <DeepDive title="Deep dive: Dec 2025 core update impact, YMYL classification, and technical E-E-A-T signals">
            <p><strong className="text-white/90">Google&rsquo;s December 2025 core update</strong> hit hard: generic content farms lost <strong className="text-red-400">60% of traffic</strong>, while sites demonstrating genuine expertise gained <strong className="text-green-400">23%</strong>. E-E-A-T is no longer optional &mdash; it&rsquo;s the primary differentiator in the age of AI-generated content.</p>
            <p><strong className="text-white/90">YMYL classification:</strong> GAI Insights operates in what Google calls &ldquo;Your Money or Your Life&rdquo; territory &mdash; advising enterprises on AI strategy and investment. Quality standards are highest for YMYL topics, making E-E-A-T signals especially critical.</p>
            <p><strong className="text-white/90">Technical E-E-A-T signals to implement:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-white/60 text-xs ml-2">
              <li><code className="bg-white/10 px-1 py-0.5 rounded">Organization</code> schema with <code className="bg-white/10 px-1 py-0.5 rounded">sameAs</code> linking to LinkedIn, X, Crunchbase</li>
              <li><code className="bg-white/10 px-1 py-0.5 rounded">Article</code> schema with <code className="bg-white/10 px-1 py-0.5 rounded">author</code> referencing your <code className="bg-white/10 px-1 py-0.5 rounded">Person</code> entities</li>
              <li>Visible author byline, publication date, and &ldquo;last updated&rdquo; date on all content</li>
              <li>Trust badges, industry certifications, and client testimonials with real names</li>
            </ul>
          </DeepDive>
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

          <DeepDive title="Deep dive: AI referral stats, citation patterns, and LLM source preferences">
            <p><strong className="text-white/90">AI referrals spiked 357% year-over-year</strong> by mid-2025, reaching 1.13 billion visits to top websites. This is no longer a niche concern &mdash; AI search is a major traffic source.</p>
            <p><strong className="text-white/90">97% of AI Overview citations</strong> come from pages already ranking in the top 20 organic results. Traditional SEO is a <em>prerequisite</em> for AI visibility &mdash; you need to rank before AI will cite you.</p>
            <p><strong className="text-white/90">24.6% of search results</strong> in 2025 included AI Overviews, and these drove a <strong className="text-red-400">61% drop in organic CTR</strong> for affected queries. If your content isn&rsquo;t being cited <em>inside</em> the AI Overview, you&rsquo;re losing clicks to competitors who are.</p>
            <p><strong className="text-white/90">LLM source preferences:</strong> Use Perplexity and ChatGPT to search your topic areas and note which domains they cite. Prioritize earning backlinks from those specific domains &mdash; AI systems have preferred source pools they draw from repeatedly.</p>
            <p><strong className="text-white/90">Long-tail conversational queries:</strong> Research the exact prompts people use in ChatGPT and Perplexity for AI consulting topics. Optimize for natural language questions (&ldquo;How should an enterprise approach AI implementation?&rdquo;) not just keywords.</p>
          </DeepDive>
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

          <DeepDive title="Deep dive: 75% of SEO issues are technical, redirect equity loss, and crawl budget">
            <p><strong className="text-white/90">Research suggests 75% of SEO issues are technical, not content-related.</strong> A perfectly written article won&rsquo;t rank if Google can&rsquo;t crawl, index, or render it properly.</p>
            <p><strong className="text-white/90">Redirect equity loss:</strong> Each redirect hop loses some link equity (ranking power). A chain of A {"\u2192"} B {"\u2192"} C loses roughly 15-20% more equity than a direct A {"\u2192"} C redirect. Audit for chains periodically using Screaming Frog or Sitebulb.</p>
            <p><strong className="text-white/90">Crawl budget optimization:</strong> Google allocates a limited <Tip def="The number of pages Google will crawl on your site in a given time period.">crawl budget</Tip> to each site. Don&rsquo;t waste it on duplicate pages, pagination, or session-based URLs. Use robots.txt and noindex tags to exclude low-value pages.</p>
            <p><strong className="text-white/90">Security headers to implement:</strong> HSTS (HTTP Strict Transport Security), X-Content-Type-Options, X-Frame-Options. These are both security best practices and minor trust signals. Check your headers at securityheaders.com.</p>
            <p><strong className="text-white/90">HubSpot-specific tip:</strong> HubSpot auto-generates sitemaps and canonicals, but verify that custom pages, landing pages, and any URL variants aren&rsquo;t creating conflicts. The HubSpot URL redirect tool should be maintained whenever you rename or restructure pages.</p>
          </DeepDive>
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

          <DeepDive title="Image SEO Deep Dive — Formats, Alt Text Rules & Hidden Wins">
            <p><strong className="text-purple-300">WebP vs JPEG vs PNG:</strong> WebP images are <strong className="text-white/90">30-50% smaller</strong> than equivalent JPEG files with no visible quality loss. AVIF is even smaller (up to 50% vs WebP) but browser support is still catching up. HubSpot&rsquo;s CDN may auto-convert to WebP &mdash; check your page source to confirm. If not, convert manually before upload.</p>
            <p><strong className="text-purple-300">Alt Text Best Practices:</strong> Keep alt text under <strong className="text-white/90">125 characters</strong> &mdash; screen readers cut off longer descriptions. Be specific and descriptive (&ldquo;Bar chart showing 40% enterprise AI adoption in financial services, 2026&rdquo;). Don&rsquo;t start with &ldquo;Image of&rdquo; or &ldquo;Photo of&rdquo; &mdash; the context already implies it&rsquo;s an image. Include your target keyword naturally when relevant, but never keyword-stuff.</p>
            <p><strong className="text-purple-300">Lazy Loading Gotcha:</strong> Enable <code className="text-xs bg-purple-500/15 px-1 py-0.5 rounded">loading=&quot;lazy&quot;</code> for images below the fold, but <strong className="text-white/90">never lazy-load above-the-fold images</strong> (hero banners, logos). Lazy-loading the LCP image will tank your Largest Contentful Paint score. The browser needs to start downloading that first image immediately.</p>
            <p><strong className="text-purple-300">Responsive Images (<code className="text-xs">srcset</code>):</strong> Serve different image sizes for different screen widths using <code className="text-xs bg-purple-500/15 px-1 py-0.5 rounded">srcset</code> and <code className="text-xs bg-purple-500/15 px-1 py-0.5 rounded">sizes</code> attributes. A mobile user on a 400px screen shouldn&rsquo;t download a 2000px-wide hero image. HubSpot may handle this automatically for CMS images &mdash; verify in page source.</p>
            <p><strong className="text-purple-300">Image Sitemaps:</strong> If GAI Insights has important infographics, diagrams, or original photos, consider adding an <Tip def="An XML file that tells Google specifically about images on your site, helping them appear in Google Images search results.">image sitemap</Tip>. This tells Google explicitly about your images and can drive traffic from Google Images search. Particularly valuable for original charts, conference photos, and framework diagrams.</p>
          </DeepDive>
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

          <DeepDive title="Core Web Vitals Deep Dive — Benchmarks, Business Impact & INP Explained">
            <p><strong className="text-purple-300">How Many Sites Actually Pass?</strong> Only <strong className="text-white/90">47-54% of websites</strong> pass all three Core Web Vitals thresholds simultaneously. This means if GAI Insights passes, you&rsquo;re immediately ahead of roughly half the web. CLS is the easiest to pass (~93% of sites do). INP is the hardest &mdash; only about 65% pass.</p>
            <p><strong className="text-purple-300">Business Impact:</strong> Moving from &ldquo;Poor&rdquo; to &ldquo;Good&rdquo; Core Web Vitals scores has been correlated with up to a <strong className="text-white/90">25% increase in conversions</strong> and measurably lower bounce rates. For a B2B consulting site where each lead is worth thousands, even a small improvement in conversion rate has outsized ROI.</p>
            <p><strong className="text-purple-300">INP Replaced FID in March 2024:</strong> <Tip def="Interaction to Next Paint — measures responsiveness of your page to user clicks, taps, and keyboard input.">INP</Tip> (Interaction to Next Paint) replaced FID (First Input Delay) as the official responsiveness metric. INP is stricter &mdash; it measures the responsiveness of <em>all</em> interactions on the page, not just the first one. Target <strong className="text-white/90">sub-150ms INP</strong> for a best-in-class experience. Heavy JavaScript (analytics, chat widgets, marketing trackers) is the most common INP killer.</p>
            <p><strong className="text-purple-300">Field Data vs Lab Data:</strong> Google uses <strong className="text-white/90">field data</strong> (real users via the Chrome User Experience Report) for ranking, not lab data (Lighthouse simulations). Your PageSpeed Insights report shows both &mdash; the &ldquo;field data&rdquo; section at the top is what actually affects your rankings. If you have low traffic, you may not have enough field data, and Google will estimate based on similar sites.</p>
            <p><strong className="text-purple-300">HubSpot-Specific Tips:</strong> HubSpot&rsquo;s CDN handles caching well, but watch out for: (1) excessive HubSpot tracking scripts, (2) third-party chat widgets loading on every page, (3) large hero images without proper sizing hints, and (4) custom CSS/JS modules that block rendering. Use <code className="text-xs bg-purple-500/15 px-1 py-0.5 rounded">defer</code> or <code className="text-xs bg-purple-500/15 px-1 py-0.5 rounded">async</code> on non-critical scripts where HubSpot allows it.</p>
          </DeepDive>
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

          <DeepDive title="Backlink Deep Dive — HARO Alternatives, Podcast Strategy & Link-Worthy Content">
            <p><strong className="text-purple-300">HARO Is Dead, Long Live Connectively:</strong> HARO (Help A Reporter Out) was the gold standard for getting journalist backlinks, but it shut down in late 2024. The successors: <strong className="text-white/90">Connectively</strong> (by the HARO founders), <strong className="text-white/90">Featured.com</strong>, <strong className="text-white/90">Qwoted</strong>, and <strong className="text-white/90">SourceBottle</strong>. Sign up Paul Baier as an expert source on AI strategy. Response rate to journalist queries is typically 3-5%, but each successful placement can yield DA 60-90 backlinks from major publications.</p>
            <p><strong className="text-purple-300">Podcast Guest Strategy:</strong> <strong className="text-white/90">75% of B2B decision-makers</strong> listen to podcasts regularly. Every podcast appearance typically generates at least one backlink (show notes page). Target AI-focused podcasts (The AI Podcast, Practical AI, AI in Business) and business strategy shows. A single appearance on a top-100 business podcast can generate more referral traffic than months of blog posts.</p>
            <p><strong className="text-purple-300">Most Linkable Content Types:</strong> Original research is the #1 most-linked content type in B2B. Specifically: proprietary survey data, benchmark reports, and industry-specific statistics. GAI Insights&rsquo; RISE Assessment data (anonymized and aggregated) would be extremely linkable. &ldquo;State of Enterprise AI 2026&rdquo; reports with original data points get referenced by journalists, analysts, and competitors alike.</p>
            <p><strong className="text-purple-300">Unlinked Brand Mentions:</strong> Monitor for mentions of &ldquo;GAI Insights,&rdquo; &ldquo;Paul Baier,&rdquo; or &ldquo;GAI World&rdquo; across the web that don&rsquo;t include a hyperlink. Tools like Ahrefs Brand Radar, Google Alerts, or Mention.com can find these. A simple outreach email (&ldquo;Thanks for mentioning us! Would you mind adding a link?&rdquo;) converts <strong className="text-white/90">~40-60% of the time</strong> because the author already knows and values your brand.</p>
            <p><strong className="text-purple-300">Link Toxicity Warning:</strong> Avoid buying links, link farms, or PBNs (Private Blog Networks). Google&rsquo;s SpamBrain AI is extremely good at detecting unnatural link patterns. A single manual penalty can drop your entire site from search results. Focus on earning links through genuine expertise, data, and relationships. Quality over quantity &mdash; always.</p>
          </DeepDive>
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

          <DeepDive title="Content Freshness Deep Dive — QDF, AI Citations & the Evergreen-Living Strategy">
            <p><strong className="text-purple-300">AI Overviews Love Fresh Content:</strong> <strong className="text-white/90">68% of AI Overview citations</strong> come from content updated within the past 12 months. Sites that maintain a consistent content update cadence see <strong className="text-white/90">43% higher AI Overview visibility</strong> compared to static sites. This is huge for GAI Insights &mdash; your daily news cadence is already a massive advantage that most competitors lack.</p>
            <p><strong className="text-purple-300">Query Deserves Freshness (QDF):</strong> Google has an algorithm called <Tip def="Query Deserves Freshness &mdash; Google's mechanism to prioritize recent content for time-sensitive search queries like news, trends, and recurring events.">QDF</Tip> that detects when a query needs fresh results. For &ldquo;enterprise AI trends 2026&rdquo; or &ldquo;best GenAI tools,&rdquo; Google will aggressively prioritize recently published or updated content. This means GAI Insights&rsquo; competitive pages should be updated at least quarterly with new data points, stats, or examples.</p>
            <p><strong className="text-purple-300">Google&rsquo;s Dec 2025 Core Update:</strong> The most recent core update placed increased emphasis on <strong className="text-white/90">consistent content publishing cadence</strong>. Sites that publish sporadically (5 posts one month, zero the next) are penalized compared to sites with steady output. A predictable publishing schedule (e.g., daily news + 2 blog posts/week + monthly deep dive) signals editorial commitment.</p>
            <p><strong className="text-purple-300">The &ldquo;Evergreen + Living&rdquo; Strategy:</strong> The most effective B2B content strategy combines <strong className="text-white/90">evergreen foundations</strong> (comprehensive guides that remain relevant for years) with <strong className="text-white/90">living updates</strong> (periodic refreshes with new data). For example: &ldquo;The Complete Guide to Enterprise AI Strategy&rdquo; is evergreen, but you update the statistics, case studies, and tool recommendations every quarter. Google sees the URL accumulating authority AND staying fresh.</p>
            <p><strong className="text-purple-300">Content Decay Detection:</strong> Monitor your top-performing pages for traffic decline. When a page starts losing organic traffic (typically 3-6 months after publication), it&rsquo;s entering &ldquo;content decay.&rdquo; The fix: update the title tag with the current year, refresh statistics, add new sections, and re-submit to Google Search Console. This &ldquo;content refresh&rdquo; cycle typically recovers <strong className="text-white/90">50-80% of lost traffic</strong> within 4-6 weeks.</p>
          </DeepDive>
        </Section>


        {/* ═══ PRIORITY MATRIX ═══ */}
        <SectionDivider title="Priority Matrix & Next Steps" />

        <section id="priority-matrix" className="scroll-mt-28">
          {/* Priority Matrix header */}
          <div className="flex items-center gap-3 mb-8">
            <span className="flex items-center justify-center w-11 h-11 rounded-lg border border-cyan-500/30 text-cyan-400" style={{ background: "linear-gradient(135deg, rgba(10,172,220,0.12) 0%, rgba(10,172,220,0.04) 100%)", boxShadow: "0 0 20px rgba(10,172,220,0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 12L7 8L10 11L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15" cy="5" r="1.5" fill="currentColor" /></svg>
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>Your Action Plan</h2>
              <div className="h-px w-16 bg-gradient-to-r from-cyan-500/30 to-transparent mt-1.5" />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/15 overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(0,29,88,0.1) 0%, rgba(2,6,23,0.2) 100%)", boxShadow: "0 0 40px rgba(10,172,220,0.04)" }}>
            <div className="px-6 py-4 border-b border-white/[0.05]" style={{ background: "rgba(0,29,88,0.12)" }}>
              <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-cyan-400/60" style={{ fontFamily: "Syne, sans-serif" }}>Execution Priority</h3>
            </div>
            <div className="p-6">
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
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white/80 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>What Your Team Needs to Do</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {([
                { phase: "1", label: "Immediate", time: "This Week", color: "green", borderColor: "rgba(34,197,94,0.2)", bgColor: "rgba(34,197,94,0.04)", textColor: "text-green-400", items: ["Paste JSON-LD code into HubSpot site header", "Remove deprecated ProfessionalService schema", "Claim/verify Google Business Profile", "Start posting GBP content (2x/week)"] },
                { phase: "2", label: "Short Term", time: "This Month", color: "yellow", borderColor: "rgba(234,179,8,0.2)", bgColor: "rgba(234,179,8,0.04)", textColor: "text-yellow-400", items: ["Grant Google Search Console access", "Add author bios to blog post template", "Create RISE and WINS methodology pages", "Start AI consulting pricing guide draft"] },
                { phase: "3", label: "Medium Term", time: "Next 90 Days", color: "purple", borderColor: "rgba(155,105,255,0.2)", bgColor: "rgba(155,105,255,0.04)", textColor: "text-purple-400", items: ["Launch 4 industry-specific landing pages", "Publish agentic AI pillar content", "Implement hub-and-spoke internal linking", "Set up quarterly content refresh schedule"] },
                { phase: "4", label: "Ongoing", time: "Continuous", color: "cyan", borderColor: "rgba(10,172,220,0.2)", bgColor: "rgba(10,172,220,0.04)", textColor: "text-cyan-400", items: ["2 GBP posts per week", "Internal links in every daily briefing", "Quarterly content freshness updates", "Monitor Core Web Vitals monthly"] },
              ] as const).map((p) => (
                <div key={p.phase} className="rounded-xl p-5 border" style={{ borderColor: p.borderColor, background: p.bgColor }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${p.textColor}`} style={{ background: p.bgColor, border: `1px solid ${p.borderColor}` }}>{p.phase}</span>
                    <div>
                      <p className={`font-semibold text-sm ${p.textColor}`}>{p.label}</p>
                      <p className="text-[10px] text-white/30 -mt-0.5">{p.time}</p>
                    </div>
                  </div>
                  <ol className="space-y-1.5 text-white/55 text-xs">
                    {p.items.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-white/20 shrink-0 mt-px">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
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
        <footer className="pt-10 mt-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-8" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/25">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/30" />
              <div>
                <p>Generated by Claude Code &mdash; Research powered by Exa AI</p>
                <p className="mt-0.5">Schema audit, competitive analysis, content gaps, and GBP posts completed autonomously.</p>
              </div>
            </div>
            <p>
              Inspired by{" "}
              <a href="https://x.com/bloggersarvesh/status/2022663312853598425" target="_blank" rel="noopener noreferrer" className="text-cyan-500/40 hover:text-cyan-400 transition-colors">
                @bloggersarvesh
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
