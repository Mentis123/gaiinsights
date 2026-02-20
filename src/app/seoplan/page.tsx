import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Action Plan | GAI Insights",
  description:
    "Strategic SEO plan for gaiinsights.com — competitive analysis, schema markup, keyword strategy, and GBP optimization.",
};

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
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${colors[color] ?? colors.cyan}`}
    >
      {children}
    </span>
  );
}

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-cyan-400 font-mono text-sm opacity-60">
          {number}
        </span>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent
          ? "bg-cyan-500/5 border-cyan-500/20"
          : "bg-white/[0.02] border-white/[0.06]"
      }`}
    >
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

export default function SEOPlanPage() {
  return (
    <main className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              <span className="text-cyan-400">GAI</span>{" "}
              <span className="text-white/90">Insights</span>
            </div>
            <span className="text-white/20">|</span>
            <span className="text-white/40 text-sm">SEO Action Plan</span>
          </div>
          <span className="text-white/30 text-xs font-mono">Feb 2026</span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <p className="text-cyan-400 text-sm font-medium mb-3 tracking-wide uppercase">
          Strategic Research Report
        </p>
        <h1
          className="text-4xl md:text-5xl font-extrabold leading-tight mb-4"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          SEO Action Plan for{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            gaiinsights.com
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-2xl">
          Based on deep research into competitive analysis, schema markup, keyword
          strategy, and Google Business Profile optimization for enterprise AI
          consulting.
        </p>

        {/* TOC */}
        <nav className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs text-white/30 uppercase tracking-wide mb-3 font-medium">
            Contents
          </p>
          <ol className="grid sm:grid-cols-2 gap-2 text-sm">
            {[
              ["01", "Competitive Content Gap Analysis"],
              ["02", "Schema Markup Audit"],
              ["03", "Low-Hanging Fruit Keywords"],
              ["04", "Business & Competitor Understanding"],
              ["05", "Google Business Profile Strategy"],
              ["06", "Deep Keyword Research"],
              ["07", "Priority Matrix & Next Steps"],
            ].map(([n, label]) => (
              <li key={n}>
                <a
                  href={`#section-${n}`}
                  className="flex items-center gap-2 text-white/50 hover:text-cyan-400 transition-colors py-1"
                >
                  <span className="text-cyan-500/60 font-mono text-xs w-5">
                    {n}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">
        {/* SECTION 1 */}
        <Section
          id="section-01"
          number="01"
          title="Competitive Content Gap Analysis"
        >
          <Quote>
            &ldquo;Scan these sites. What are these competitors&rsquo; sites missing?
            Find the content gaps and tell me 5 topics I should cover to be more
            helpful than them.&rdquo;
          </Quote>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Research Findings
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  SEO has shifted from keyword-based to <strong className="text-white/90">&ldquo;Information Gain&rdquo;</strong> analysis
                  &mdash; find unique data and perspectives AI engines can&rsquo;t synthesize
                  from existing content
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  AI Overviews (Google), Perplexity, and ChatGPT search pull from
                  structured, entity-rich content with clear attribution
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Leading AI consulting firms win with <strong className="text-white/90">original research,
                  case studies, and data-driven reports</strong> containing unique statistics
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Key tools: Ahrefs Content Gap, Semrush Topic Research,
                  MarketMuse, Ahrefs Brand Radar (AI visibility tracking)
                </span>
              </li>
            </ul>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              Recommended Actions
            </h3>
            <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
              <li>
                Identify 5 direct competitors to benchmark (e.g. LeewayHertz, RTS
                Labs, Forrester AI practice, IDC AI, Constellation Research)
              </li>
              <li>
                Run content gap analysis &mdash; compare blog topics, resource types,
                keyword coverage across competitors
              </li>
              <li>
                Leverage GAI Insights&rsquo; unique advantage: daily AI news + enterprise
                buyer community (competitors don&rsquo;t have this real-time pulse)
              </li>
              <li>
                Produce &ldquo;Information Gain&rdquo; content: proprietary benchmarking data,
                RISE Maturity Assessment results (anonymized), buyer guide
                methodology insights
              </li>
              <li>
                Structure all content for AI citation &mdash; clear claims, statistics,
                and attribution
              </li>
            </ol>
          </Card>
        </Section>

        {/* SECTION 2 */}
        <Section id="section-02" number="02" title="Schema Markup Audit">
          <Quote>
            &ldquo;Check page source and list all schema. Say if LocalBusiness exists
            and if it&rsquo;s useful. Output: existing schema + verdict, missing/weak
            schema + priority.&rdquo;
          </Quote>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Priority Schema Types for GAI Insights
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Schema Type
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Priority
                    </th>
                    <th className="py-2 text-white/50 font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      Organization
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="red">CRITICAL</Badge>
                    </td>
                    <td className="py-2.5">
                      Knowledge Graph + AI citation foundation
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      Service
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="orange">HIGH</Badge>
                    </td>
                    <td className="py-2.5">
                      Define each consulting offering for search
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      FAQPage
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="orange">HIGH</Badge>
                    </td>
                    <td className="py-2.5">
                      Quick win &mdash; FAQ section already exists on site
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      Article / BlogPosting
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="orange">HIGH</Badge>
                    </td>
                    <td className="py-2.5">
                      Blog, daily news, buyer&rsquo;s guides (E-E-A-T signals)
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      Event
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="orange">HIGH</Badge>
                    </td>
                    <td className="py-2.5">
                      GAI World 2026 conference rich results
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      BreadcrumbList
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="yellow">MEDIUM</Badge>
                    </td>
                    <td className="py-2.5">Site navigation clarity</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono text-xs text-cyan-300">
                      Person
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color="yellow">MEDIUM</Badge>
                    </td>
                    <td className="py-2.5">
                      Team pages &mdash; author authority (E-E-A-T)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              Key Insights
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">ProfessionalService</code> is{" "}
                  <strong className="text-red-400">deprecated</strong> &mdash; use{" "}
                  <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">Service</code> instead
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">LocalBusiness</code> is optional &mdash;
                  GAI Insights operates nationally/globally but could add for
                  Boston-area visibility
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Schema is now <strong className="text-white/90">critical for AI search visibility</strong> &mdash;
                  Perplexity, ChatGPT Search, and Google AI Overviews rely on
                  structured data to cite sources
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  JSON-LD is the Google-recommended format, implementable in
                  HubSpot via custom modules or header code
                </span>
              </li>
            </ul>
          </Card>
        </Section>

        {/* SECTION 3 */}
        <Section
          id="section-03"
          number="03"
          title="Low-Hanging Fruit Keywords"
        >
          <Quote>
            &ldquo;List 20 high-intent local keywords for a [Service] in [City] that
            indicate a customer is ready to buy NOW.&rdquo;
          </Quote>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Adaptation for B2B Enterprise
            </h3>
            <p className="text-sm text-white/60 mb-4">
              GAI Insights is B2B enterprise, not a local shop. The keyword
              strategy differs significantly from the &ldquo;plumber near me&rdquo; approach.
              High-intent B2B keywords contain signals like:{" "}
              <strong className="text-white/80">
                &ldquo;hire,&rdquo; &ldquo;pricing,&rdquo; &ldquo;best,&rdquo; &ldquo;compare,&rdquo; &ldquo;demo,&rdquo; &ldquo;consultation&rdquo;
              </strong>
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Recommended Keyword Clusters
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Cluster
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Example Keywords
                    </th>
                    <th className="py-2 text-white/50 font-medium">Intent</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {[
                    [
                      "Enterprise AI Strategy",
                      "enterprise AI strategy consulting, GenAI roadmap for enterprises",
                      "Commercial",
                    ],
                    [
                      "AI Training/Upskilling",
                      "GenAI employee training programs, ChatGPT training for enterprise",
                      "Commercial",
                    ],
                    [
                      "AI Vendor Comparison",
                      "best GenAI tools comparison 2026, secure employee chatbot comparison",
                      "Commercial",
                    ],
                    [
                      "AI Governance/Risk",
                      "AI governance consulting, responsible AI implementation",
                      "Informational",
                    ],
                    [
                      "Industry-Specific AI",
                      "AI for investment management, GenAI for financial services",
                      "Commercial",
                    ],
                    [
                      "AI Events/Community",
                      "GenAI conference 2026, enterprise AI peer networking",
                      "Navigational",
                    ],
                  ].map(([cluster, keywords, intent], i) => (
                    <tr
                      key={i}
                      className={
                        i < 5 ? "border-b border-white/5" : ""
                      }
                    >
                      <td className="py-2.5 pr-4 font-medium text-white/90 whitespace-nowrap">
                        {cluster}
                      </td>
                      <td className="py-2.5 pr-4 text-white/60 text-xs">
                        {keywords}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          color={
                            intent === "Commercial"
                              ? "green"
                              : intent === "Navigational"
                              ? "purple"
                              : "yellow"
                          }
                        >
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
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              Quick Win Strategy
            </h3>
            <p className="text-sm text-white/70">
              Pull Google Search Console data to find pages ranking #11-30 with
              high impressions but low CTR. Optimize those pages first (title
              tags, H1s, meta descriptions) for faster traffic gains than
              creating entirely new content.
            </p>
          </Card>
        </Section>

        {/* SECTION 4 */}
        <Section
          id="section-04"
          number="04"
          title="Business & Competitor Understanding"
        >
          <Quote>
            &ldquo;Visit my site and extract business name, address, services, key
            selling points, then open competitors and compare me vs them.&rdquo;
          </Quote>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              GAI Insights Profile (Extracted)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">
                  Business
                </p>
                <p className="text-white/80">
                  GAI Insights LLC &mdash; Enterprise GenAI analyst &amp; advisory firm
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">
                  Location
                </p>
                <p className="text-white/80">
                  Boston, MA (serves nationally/globally)
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">
                  Services
                </p>
                <p className="text-white/80">
                  AI strategy consulting, daily AI news, buyer&rsquo;s guides,
                  benchmarking, training (ChatGPT, Copilot), workshops, executive
                  briefings, peer networking, annual conference
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">
                  Key Selling Points
                </p>
                <p className="text-white/80">
                  35K+ enterprise AI leader network, daily news briefing,
                  exclusive buyer&rsquo;s guides, GAI World conference, RISE Maturity
                  Assessment, WINS Framework, HBR articles
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">
                  Trust Signals
                </p>
                <p className="text-white/80">
                  Customer logos (AWS, IBM, Crocs, UL Solutions, WEX), Paul
                  Baier&rsquo;s thought leadership, HBR contributions
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-2">
                  Unique Advantage
                </p>
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 text-cyan-200 text-sm">
                  Real-time market pulse (daily news + buyer community) &mdash; most
                  competitors don&rsquo;t have this combination of analyst insight and
                  live enterprise buyer access
                </div>
              </div>
            </div>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              Next Step
            </h3>
            <p className="text-sm text-white/70">
              Validate the competitor list with the team &mdash; who does GAI Insights
              actually compete against for deals? Then run structured competitor
              extraction and build a comparison matrix covering services, pricing
              model, content volume, trust signals, and AI search visibility.
            </p>
          </Card>
        </Section>

        {/* SECTION 5 */}
        <Section
          id="section-05"
          number="05"
          title="Google Business Profile Strategy"
        >
          <Quote>
            &ldquo;Analyze competitor GBP posts, identify keyword gaps, write
            high-impact posts with local landmarks and CTAs.&rdquo; + &ldquo;Create a clear,
            non-generic posting plan.&rdquo;
          </Quote>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Research Findings
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  GBP <strong className="text-white/90">IS relevant</strong> for remote/national consulting firms
                  &mdash; serves as a digital storefront and feeds Google&rsquo;s AI
                  systems
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  <strong className="text-white/90">Event posts</strong> get ~2x engagement vs. average posts
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Recommended frequency:{" "}
                  <strong className="text-white/90">1-2 posts per week</strong> minimum (posts
                  expire after 6 months)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  AI local visibility is reportedly &ldquo;up to 30x harder&rdquo; than
                  traditional Google ranking &mdash; but GBP helps close the gap
                </span>
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Recommended Posting Plan
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Week
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Post Type
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Theme
                    </th>
                    <th className="py-2 text-white/50 font-medium">CTA</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {[
                    [
                      "Week 1",
                      "What's New",
                      "New buyer's guide or blog highlight",
                      "Download Now",
                    ],
                    [
                      "Week 1",
                      "Event",
                      "GAI World 2026 / Monthly Learning Lab",
                      "Register",
                    ],
                    [
                      "Week 2",
                      "What's New",
                      "Daily AI News highlight / trend",
                      "Subscribe",
                    ],
                    [
                      "Week 2",
                      "Offer",
                      "Free consultation / RISE Assessment",
                      "Talk to Us",
                    ],
                  ].map(([week, type, theme, cta], i) => (
                    <tr
                      key={i}
                      className={i < 3 ? "border-b border-white/5" : ""}
                    >
                      <td className="py-2.5 pr-4 text-white/40 whitespace-nowrap">
                        {week}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-white/90 whitespace-nowrap">
                        {type}
                      </td>
                      <td className="py-2.5 pr-4 text-white/60">{theme}</td>
                      <td className="py-2.5">
                        <Badge color="cyan">{cta}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/40 mt-3">
              Rotate bi-weekly. Mix content types with seasonal/timely hooks.
              Include Boston-area references where natural.
            </p>
          </Card>
        </Section>

        {/* SECTION 6 */}
        <Section
          id="section-06"
          number="06"
          title="Deep Keyword Research"
        >
          <Quote>
            &ldquo;Go to Ahrefs and analyze my competitor&rsquo;s top 20 pages, extract
            their target keywords, search volumes, and give me a prioritized
            list with difficulty scores.&rdquo;
          </Quote>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Approach
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Full competitive keyword intelligence requires{" "}
                  <strong className="text-white/90">Ahrefs or Semrush</strong> (~$100-200/mo)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Analyze top 5 competitors&rsquo; top 20 pages each &mdash; extract
                  keywords, volumes, difficulty
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Free alternatives (less comprehensive): Google Search Console,
                  Google Keyword Planner, AnswerThePublic, LowFruits
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-500 mt-1 shrink-0">&bull;</span>
                <span>
                  Claude Code can navigate Ahrefs via browser if logged in &mdash;
                  extract and format data automatically
                </span>
              </li>
            </ul>
          </Card>

          <Card accent>
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              Keyword Priority Framework
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="font-semibold text-green-300 mb-1">Quick Wins</p>
                <p className="text-white/50 text-xs">
                  Low difficulty + existing page to optimize
                </p>
              </div>
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                <p className="font-semibold text-yellow-300 mb-1">
                  Growth Opportunities
                </p>
                <p className="text-white/50 text-xs">
                  Medium difficulty + needs new content
                </p>
              </div>
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                <p className="font-semibold text-purple-300 mb-1">
                  Long-term Plays
                </p>
                <p className="text-white/50 text-xs">
                  High difficulty + high value keywords
                </p>
              </div>
            </div>
          </Card>
        </Section>

        {/* SECTION 7 */}
        <Section
          id="section-07"
          number="07"
          title="Priority Matrix & Next Steps"
        >
          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Execution Priority
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-3 text-white/50 font-medium w-8">
                      #
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Action
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Impact
                    </th>
                    <th className="py-2 pr-4 text-white/50 font-medium">
                      Effort
                    </th>
                    <th className="py-2 text-white/50 font-medium">
                      Dependencies
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {[
                    [
                      "1",
                      "Schema Audit + Implementation",
                      "HIGH",
                      "LOW-MED",
                      "HubSpot access",
                    ],
                    [
                      "2",
                      "FAQ Schema on Homepage",
                      "HIGH",
                      "LOW",
                      "HubSpot access",
                    ],
                    [
                      "3",
                      "GSC Low-Hanging Fruit Keywords",
                      "HIGH",
                      "MEDIUM",
                      "Google Search Console",
                    ],
                    [
                      "4",
                      "Competitive Content Gap Analysis",
                      "HIGH",
                      "MEDIUM",
                      "Ahrefs + Chrome",
                    ],
                    [
                      "5",
                      "GBP Setup + Posting Plan",
                      "MEDIUM",
                      "MEDIUM",
                      "GBP access",
                    ],
                    [
                      "6",
                      "Deep Keyword Research (Ahrefs)",
                      "MEDIUM",
                      "HIGH",
                      "Ahrefs subscription",
                    ],
                    [
                      "7",
                      "Business vs. Competitor Matrix",
                      "MEDIUM",
                      "MEDIUM",
                      "Chrome + competitor list",
                    ],
                  ].map(([num, action, impact, effort, deps], i) => (
                    <tr
                      key={i}
                      className={i < 6 ? "border-b border-white/5" : ""}
                    >
                      <td className="py-2.5 pr-3 font-mono text-cyan-500/60">
                        {num}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-white/90">
                        {action}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          color={impact === "HIGH" ? "green" : "yellow"}
                        >
                          {impact}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          color={
                            effort === "LOW"
                              ? "green"
                              : effort === "LOW-MED"
                              ? "green"
                              : effort === "MEDIUM"
                              ? "yellow"
                              : "orange"
                          }
                        >
                          {effort}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-white/50 text-xs">{deps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">
              Tools & Access Needed
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                [
                  "HubSpot CMS",
                  "Implement schema, edit templates, update meta tags",
                ],
                [
                  "Google Search Console",
                  "Find low-hanging fruit keywords, monitor performance",
                ],
                [
                  "Google Business Profile",
                  "Create/manage GBP, post content",
                ],
                [
                  "Ahrefs or Semrush",
                  "Competitor keyword analysis, content gap research",
                ],
                [
                  "Chrome Extension",
                  "Automate competitor scanning, schema auditing",
                ],
                [
                  "Claude Code",
                  "Generate schema JSON-LD, draft posts, keyword analysis",
                ],
              ].map(([tool, purpose], i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3"
                >
                  <p className="font-medium text-white/80 text-sm mb-0.5">
                    {tool}
                  </p>
                  <p className="text-white/40 text-xs">{purpose}</p>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Footer */}
        <footer className="pt-8 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-white/30">
            <p>
              Generated by Claude Code &mdash; Deep research powered by Exa AI
            </p>
            <p>
              Inspired by{" "}
              <a
                href="https://x.com/bloggersarvesh/status/2022663312853598425"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500/60 hover:text-cyan-400 transition-colors"
              >
                @bloggersarvesh
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
