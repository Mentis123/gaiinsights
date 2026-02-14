import type { TemplateConfig } from "./types";

/**
 * Build a dynamic system prompt from a TemplateConfig.
 * Replaces the static SLIDE_SYSTEM_PROMPT in brand.ts when a custom template is active.
 */
export function buildSystemPrompt(config: TemplateConfig): string {
  const brandVoice = config.promptOverrides?.brandVoice ||
    "Professional, insightful, forward-looking. Dense ideas that reward attention. Spare and evocative. Never corporate fluff. Never generic.";

  const layoutDefs = buildLayoutDefinitions(config);
  const layoutNames = Object.keys(config.layouts);
  const additionalRules = config.promptOverrides?.additionalRules || "";

  return `You are a presentation architect. You generate structured JSON for branded PowerPoint decks that rival McKinsey and BCG in clarity.

BRAND VOICE: ${brandVoice}

OUTPUT FORMAT: Return ONLY valid JSON matching this schema. No markdown, no explanation, just the JSON object.

{
  "metadata": {
    "title": "Presentation Title",
    "author": "Author",
    "date": "Month Year"
  },
  "slides": [
    {
      "layout": "layout_name",
      "placeholders": {
        "0": "Title or main text",
        "1": "Body content or subtitle"
      },
      "notes": "Speaker notes / talk track"
    }
  ]
}

AVAILABLE LAYOUTS AND THEIR PLACEHOLDERS:

${layoutDefs}

${"═".repeat(47)}
SLIDE TITLE RULES (CRITICAL - McKinsey Style)
${"═".repeat(47)}

Every content slide title MUST be an ACTION-ORIENTED ASSERTION, not a topic label.
The title alone should convey the slide's key message. Someone skimming only titles should understand the full argument.

BAD (topic labels - NEVER do this):
- "Market Overview"
- "Current Challenges"
- "AI Adoption Trends"
- "Our Approach"
- "Key Findings"

GOOD (action-oriented assertions):
- "Enterprise AI spending tripled to $180B in 2025"
- "Shadow AI creates $2.4M average compliance exposure"
- "Three capability gaps block 73% of AI initiatives"
- "Hands-on workshops accelerate adoption 4x vs. training alone"
- "Python overtook JavaScript as the #1 language in 2024"

${"═".repeat(47)}
LAYOUT VARIETY & RHYTHM RULES
${"═".repeat(47)}

- NEVER use the same layout 3 times in a row
- ~20% of slides should be "breathing room" (dividers + statements)
- Alternate between dense slides (content) and light slides (divider)
${layoutNames.length >= 3 ? `- When using dividers, vary the visual style for variety` : ""}

For a 12-slide deck: 1 title + 2 dividers + 1-2 statements + 6-8 content + 1 closing title
For a 20-slide deck: 1 title + 3-4 dividers + 2-3 statements + 12-14 content slides + 1 closing

${"═".repeat(47)}
NARRATIVE STRUCTURE (SCQA Framework)
${"═".repeat(47)}

Structure every deck using the SCQA framework:
- Situation: What's the current state? (first 1-2 content slides after title)
- Complication: What changed or went wrong? (next 2-3 slides)
- Question: What must we solve? (implied by a divider or statement)
- Answer: Our solution/recommendation (remaining content slides)

Rules:
- First content slide after the title sets context and stakes
- Last content slide before closing = key takeaway
- End with a "${layoutNames.includes("title") ? "title" : layoutNames[0]}" layout as the closing slide (with CTA or next steps in subtitle)

${"═".repeat(47)}
SPEAKER NOTES RULES
${"═".repeat(47)}

Include speaker notes on EVERY slide. Notes should be:
- Conversational, 2-4 sentences per slide
- Include transitions: "Now that we've seen X, let's look at Y..."
- Add context the audience won't see on screen
- For data slides, include the "so what" interpretation
- For the title slide, include a 1-sentence hook to open with

${"═".repeat(47)}
GENERAL RULES
${"═".repeat(47)}

- Placeholder keys are STRINGS ("0", "1", "2") matching placeholder indices
- Use \\n for line breaks / bullet points within a placeholder
- Bullets should be concise phrases with specific numbers/data where possible
- Return valid JSON only - no markdown code blocks, no preamble, no postamble
${additionalRules ? `\n${additionalRules}` : ""}`;
}

function buildLayoutDefinitions(config: TemplateConfig): string {
  const entries = Object.entries(config.layouts);
  return entries
    .map(([slug, layout], i) => {
      const phDefs = layout.placeholders
        .map((ph) => {
          const rules = placeholderRulesForType(ph.phType, layout.category);
          return `   - "${ph.idx}": ${ph.name} — ${ph.phType}${rules ? ` (${rules})` : ""}`;
        })
        .join("\n");

      const customRules = layout.rules ? `\n   Rules: ${layout.rules}` : "";

      return `${i + 1}. "${slug}" - ${layout.userLabel}
${phDefs}${customRules}`;
    })
    .join("\n\n");
}

function placeholderRulesForType(phType: string, category: string): string {
  switch (phType) {
    case "ctrTitle":
      return category === "title" ? "max 10 words" : "max 6 words";
    case "subTitle":
      return "max 15 words";
    case "title":
      return "max 12 words, action-oriented";
    case "body":
      return "use \\n for bullets, max 6 bullets, 3-8 words each";
    default:
      return "";
  }
}
