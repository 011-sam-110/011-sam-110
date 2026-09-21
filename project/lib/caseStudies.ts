import { projects, type Project } from '@/lib/data'

/**
 * Extended, scannable case-study narrative for each project, keyed by the
 * existing project ids in lib/data.ts.
 *
 * This is a SEPARATE file from data.ts on purpose: data.ts drives the homepage
 * cards/modal, this drives the long-form /work/[id] routes. Every fact here is
 * either lifted verbatim from data.ts (metrics, stack, links) or is a true
 * description of how the project was built — no invented numbers.
 */

/** One row of the at-a-glance header: a labelled fact about the build. */
export interface CaseStudyFact {
  label: string
  value: string
}

/** A stack entry with the reason it was chosen — the "with rationale" list. */
export interface StackChoice {
  name: string
  rationale: string
}

export interface CaseStudy {
  /** Headline metric shown large in the stat header (the single best number). */
  headlineMetric: { value: string; label: string }
  /** Role / timeline / context chips for the at-a-glance header. */
  facts: CaseStudyFact[]
  /** Problem — why this needed building. */
  problem: string
  /** Approach — the strategy taken, in prose + the key moves. */
  approach: string
  approachPoints: string[]
  /** Architecture — how the pieces fit together. */
  architecture: string
  architecturePoints: string[]
  /** Result — outcome + the metrics that prove it (pulled from data.ts). */
  result: string
  /** Stack with the reason each piece was chosen. */
  stack: StackChoice[]
}

/**
 * The narrative content, keyed by project id. The header chips, metrics, links
 * and short copy are joined back onto the canonical `Project` at read time via
 * `getCaseStudy`, so there is a single source of truth for titles/links/metrics.
 */
const CASE_STUDIES: Record<string, CaseStudy> = {
  'compliance-auditor': {
    headlineMetric: { value: '3-layer', label: 'AI risk pipeline' },
    facts: [
      { label: 'Role', value: 'Solo build' },
      { label: 'Context', value: 'Silent Data Hackathon 2026' },
      { label: 'Domain', value: 'Banking / compliance' },
    ],
    problem:
      'Manual compliance review of banking documents is slow, expensive, and dangerously inconsistent — two reviewers reading the same PDF can reach different verdicts. For high-stakes Approve / Reject decisions that variance is a real risk, and there is rarely a tamper-evident record of why a decision was made.',
    approach:
      'Rather than ask a single large language model to "decide", I split the judgement into three independent layers so each signal is auditable on its own, then combined them into a deterministic verdict with a verifiable audit trail.',
    approachPoints: [
      'A rules-based AML/KYC engine that scores documents 0–100 — fully deterministic, no model variance.',
      'A Markov model estimating credit-default likelihood from the extracted financials.',
      'A Gemini 2.0 Flash pass for narrative analysis the rules engine cannot capture.',
      'A final verdict layer that maps the combined score to Approve / Review / Reject.',
    ],
    architecture:
      'Documents flow through a Streamlit front end into the three scoring layers. The numeric layers run first and cheaply; the LLM layer adds qualitative narrative. Every verdict is hashed with SHA-256 and written to a blockchain-style verification record so the decision can later be proven untampered.',
    architecturePoints: [
      'Streamlit UI for PDF upload and live verdict display.',
      'Deterministic AML/KYC scorer + Markov credit model run before any LLM call.',
      'Gemini 2.0 Flash for narrative risk analysis on top of the numeric score.',
      'SHA-256 hashing of each verdict for a tamper-evident audit trail.',
    ],
    result:
      'A working platform that turns an unstructured banking PDF into a defensible Approve / Review / Reject verdict, with a deterministic 0–100 score and a cryptographic record of how it was reached — built end to end during the hackathon.',
    stack: [
      { name: 'Python', rationale: 'Core pipeline + the rules and Markov scoring logic.' },
      { name: 'Streamlit', rationale: 'Fastest path to an interactive upload-and-verdict UI under hackathon time pressure.' },
      { name: 'Gemini 2.0', rationale: 'Fast, low-cost LLM for the narrative analysis layer.' },
      { name: 'SHA-256', rationale: 'Tamper-evident hashing so each verdict can be independently verified.' },
    ],
  },

  navigator: {
    headlineMetric: { value: '24h', label: 'solo build, end to end' },
    facts: [
      { label: 'Role', value: 'Solo build' },
      { label: 'Context', value: 'Sussex Hackathon 2026' },
      { label: 'Domain', value: 'Accessibility / agents' },
    ],
    problem:
      'Older and less technical users are increasingly locked out of modern computing — menus move, settings hide, and there is no obvious way to just say what you want. The goal was a layer where someone could describe a task in plain English and have the computer carry it out safely.',
    approach:
      'Give a vision-language model real eyes on the screen, but never let it click directly. Instead, constrain its output into a small, deterministic command language so every action is something the system can validate before it runs.',
    approachPoints: [
      'Capture a live screenshot of the current screen state on each turn.',
      'Send it to GPT-4o Vision to interpret what is on screen and what the user asked for.',
      'Force the model to emit a custom command DSL rather than free-form actions.',
      'Translate validated commands into precise clicks and keystrokes.',
    ],
    architecture:
      'A FastAPI service orchestrates the loop: screen capture → vision model → DSL parse → execution. OpenCV handles the screen-capture and image work, and pyautogui drives the resulting mouse and keyboard actions. Because the model can only speak the DSL, ambiguous or unsafe instructions are rejected before anything happens on the machine.',
    architecturePoints: [
      'FastAPI backend coordinating the capture → reason → act loop.',
      'GPT-4o Vision reading live screenshots to understand the screen.',
      'Custom command DSL constraining the model to safe, parseable actions.',
      'OpenCV for screen capture + pyautogui for deterministic click/keystroke execution.',
    ],
    result:
      'A working desktop assistant — designed and shipped solo inside the 24-hour window — that takes a plain-English request, looks at the actual screen, and performs the steps for the user, with the DSL ensuring no ambiguous command ever reaches the machine.',
    stack: [
      { name: 'FastAPI', rationale: 'Lightweight async backend to orchestrate the capture–reason–act loop.' },
      { name: 'GPT-4o Vision', rationale: 'Reads arbitrary on-screen UI from a screenshot with no per-app integration.' },
      { name: 'OpenCV', rationale: 'Fast, reliable screen capture and image handling.' },
      { name: 'pyautogui', rationale: 'Programmatic, deterministic control of mouse and keyboard.' },
    ],
  },

  'motion-llm': {
    headlineMetric: { value: '30 FPS', label: 'sustained detection stability' },
    facts: [
      { label: 'Role', value: 'Solo build' },
      { label: 'Type', value: 'Autonomous agent' },
      { label: 'Domain', value: 'Computer vision + LLM' },
    ],
    problem:
      'Most ambient assistants wait for a wake word. That is the wrong trigger — it should activate on presence and intent. The challenge is doing real-time face detection while also running LLM inference and speech synthesis without the video pipeline stuttering or dropping frames.',
    approach:
      'Treat it as a concurrency problem, not a model problem. Run computer vision, language inference, and speech on separate threads so a slow LLM call can never stall the 30 FPS detection loop.',
    approachPoints: [
      'Wake the agent on face detection rather than a voice command.',
      'Hold spoken conversations using emotional neural TTS.',
      'Analyse the surroundings with GPT-4.1-mini vision when idle.',
      'Keep detection, inference, and speech on concurrent threads so none blocks the others.',
    ],
    architecture:
      'A multi-threaded pipeline coordinates three subsystems in a continuous real-time loop: OpenCV runs the face-detection and vision capture, the GPT-4o-mini layer handles reasoning and scene analysis, and OpenAI TTS produces the spoken responses. Decoupling them with threading is what keeps detection at a steady frame rate while heavier work happens in parallel.',
    architecturePoints: [
      'OpenCV face detection driving the wake-on-presence trigger.',
      'GPT-4o-mini for conversation and idle scene analysis.',
      'OpenAI neural TTS for emotional spoken output.',
      'Python threading to run CV + LLM + TTS concurrently without dropped frames.',
    ],
    result:
      'An autonomous agent that wakes when it sees you, talks back, and describes its surroundings — sustaining 30 FPS detection with roughly 95% face-detection accuracy and sub-200ms end-to-end response, with zero dropped frames from the concurrent design.',
    stack: [
      { name: 'OpenCV', rationale: 'Real-time face detection and frame capture at 30 FPS.' },
      { name: 'GPT-4o-mini', rationale: 'Fast, cheap reasoning + vision for conversation and scene analysis.' },
      { name: 'OpenAI TTS', rationale: 'Natural, emotional neural speech for spoken replies.' },
      { name: 'Python Threading', rationale: 'Keeps CV, LLM, and TTS concurrent so none blocks the detection loop.' },
    ],
  },

  'dev-analytics': {
    headlineMetric: { value: '24h', label: 'self-updating cycle, zero touch' },
    facts: [
      { label: 'Role', value: 'Solo build' },
      { label: 'Type', value: 'Automation / DevOps' },
      { label: 'Domain', value: 'CI/CD + data viz' },
    ],
    problem:
      'A GitHub profile README is static by default — it shows whatever you last hand-edited. I wanted my profile to reflect current ability automatically, surfacing live performance data instead of a frozen snapshot.',
    approach:
      'Build a small data pipeline that runs itself on a schedule. Fetch live stats, render them into an image, and commit the result back to the repo so the README always shows fresh numbers with no manual step.',
    approachPoints: [
      'Pull live MonkeyType typing statistics via their data source.',
      'Generate an SVG stats card from those numbers in Python.',
      'Run the whole thing on a scheduled GitHub Actions workflow.',
      'Commit the regenerated card so the README updates itself.',
    ],
    architecture:
      'A GitHub Actions workflow runs on a 24-hour schedule. On each run it fetches the latest stats over REST, generates an SVG card with Python, and commits it back into the repository. The README references that SVG, so the profile becomes a live, data-driven dashboard with zero ongoing intervention.',
    architecturePoints: [
      'GitHub Actions cron workflow as the scheduler and runtime.',
      'Python script fetching stats over REST and rendering the SVG.',
      'Dynamically generated SVG card committed back to the repo.',
      'Zero-config: once deployed, no manual updates are ever needed.',
    ],
    result:
      'A README that updates itself every 24 hours via GitHub Actions, rendering a fresh SVG card from live data — currently documenting 156 WPM typing — with a fully zero-config deployment pipeline.',
    stack: [
      { name: 'Python', rationale: 'Fetches the stats and renders the SVG card.' },
      { name: 'GitHub Actions', rationale: 'Free scheduled runner — the engine behind the 24h self-update cycle.' },
      { name: 'SVG Generation', rationale: 'Resolution-independent card that renders crisply inside the README.' },
      { name: 'REST APIs', rationale: 'Pulls the live typing statistics on each run.' },
    ],
  },
}

/** A case study joined to its canonical project record from data.ts. */
export interface CaseStudyEntry extends CaseStudy {
  project: Project
}

/** All project ids that have a case study (used by generateStaticParams). */
export function getCaseStudyIds(): string[] {
  return projects.filter(p => CASE_STUDIES[p.id]).map(p => p.id)
}

/**
 * Look up a case study by id, joined to its canonical project record.
 * Returns null for any id without both a project and a narrative — the route
 * uses that to render a 404.
 */
export function getCaseStudy(id: string): CaseStudyEntry | null {
  const project = projects.find(p => p.id === id)
  const study = CASE_STUDIES[id]
  if (!project || !study) return null
  return { ...study, project }
}
