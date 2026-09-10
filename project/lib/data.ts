export interface Project {
  id: string
  title: string
  subtitle: string
  description: string
  why: string
  metrics: string[]
  stack: string[]
  tags: string[]
  github: string
  featured?: boolean
  color: string
}

export interface TechItem {
  name: string
  relatedProjects: string[]
}

export interface BlogPost {
  id: string
  title: string
  date: string
  readTime: string
  excerpt: string
  tags: string[]
}

export const projects: Project[] = [
  {
    id: 'compliance-auditor',
    title: 'RAG-based Compliance Auditor',
    subtitle: 'AI Banking Intelligence Platform',
    description:
      'Intelligent compliance platform built for the Silent Data Hackathon. Evaluates banking PDFs through three AI layers — AML/KYC rules engine (0–100 risk score), Markov credit default model, and Gemini 2.0 Flash narrative analysis. Issues Approve/Review/Reject verdicts with SHA-256 blockchain verification.',
    why:
      'Traditional compliance review is manual, slow, and catastrophically inconsistent. I built a three-layer AI pipeline to automate risk scoring with deterministic blockchain audit trails — eliminating human error from high-stakes financial decisions.',
    metrics: [
      '0–100 deterministic risk scoring',
      'SHA-256 blockchain verification',
      '3-layer AI pipeline (AML + Markov + LLM)',
      'Approve/Review/Reject verdict engine',
    ],
    stack: ['Python', 'Streamlit', 'Gemini 2.0', 'SHA-256'],
    tags: ['AI', 'Hackathon', 'Python'],
    github: 'https://github.com/011-sam-110/2026-Silent-Data-Hackathon-Entry',
    featured: true,
    color: '#06b6d4',
  },
  {
    id: 'navigator',
    title: 'The Navigator',
    subtitle: 'AI Desktop Assistant — 24h Solo Hackathon',
    description:
      'AI desktop assistant built solo in 24 hours at Sussex Hackathon 2026. Helps older users navigate their computer through plain English — captures live screenshots, uses GPT-4o Vision to understand the screen, then executes precise clicks and keystrokes via a custom command language.',
    why:
      'Older generations are being left behind by modern computing interfaces. I built a natural-language computer control layer where GPT-4o Vision interprets live screenshots and a custom DSL constrains LLM outputs into deterministic, safe actions — zero ambiguous commands.',
    metrics: [
      'Built solo in 24 hours',
      'GPT-4o Vision screen understanding',
      'Custom deterministic command language',
      'Sub-100ms action execution latency',
    ],
    stack: ['FastAPI', 'GPT-4o Vision', 'OpenCV', 'pyautogui'],
    tags: ['AI', '24h Solo', 'Python'],
    github: 'https://github.com/011-sam-110/Sussex-Hackathon-2026-Solo-Entry-',
    featured: false,
    color: '#8b5cf6',
  },
  {
    id: 'motion-llm',
    title: 'Motion-Detecting LLM Assistant',
    subtitle: 'Autonomous Vision-Language Agent',
    description:
      'Autonomous AI agent that wakes on face detection, holds spoken conversations with emotional neural TTS, and analyses its surroundings via GPT-4.1-mini vision when idle. A multi-threaded pipeline coordinates computer vision, language model inference, and speech synthesis in a continuous real-time loop.',
    why:
      'Ambient AI should activate on intent, not voice commands. I engineered a multi-threaded vision pipeline maintaining 30 FPS detection stability while running LLM inference and speech synthesis in parallel — achieving sub-200ms response latency with zero dropped frames.',
    metrics: [
      '30 FPS sustained detection stability',
      '95% face detection accuracy',
      'Sub-200ms end-to-end response',
      'Multi-threaded: CV + LLM + TTS concurrent',
    ],
    stack: ['OpenCV', 'GPT-4o-mini', 'OpenAI TTS', 'Python Threading'],
    tags: ['AI Agent', 'Computer Vision', 'Python'],
    github: 'https://github.com/011-sam-110/Motion-Detecting-LLM-Assistant',
    featured: false,
    color: '#f59e0b',
  },
  {
    id: 'dev-analytics',
    title: 'Automated Dev Analytics',
    subtitle: 'Self-Updating GitHub Intelligence Pipeline',
    description:
      'Automated data pipeline that fetches live MonkeyType typing statistics and renders a dynamically generated SVG card on a scheduled GitHub Actions workflow. The README becomes a live dashboard that self-updates every 24 hours — zero manual intervention.',
    why:
      'Developer profiles are static by default. I built a self-updating analytics system using GitHub Actions CI/CD to surface real-time performance metrics, turning a GitHub README into a live, data-driven dashboard that reflects current ability.',
    metrics: [
      'Automated 24h update cycle via GitHub Actions',
      'Live SVG card generation with Python',
      'Zero-config deployment pipeline',
      '156 WPM documented via live metrics',
    ],
    stack: ['Python', 'GitHub Actions', 'SVG Generation', 'REST APIs'],
    tags: ['Automation', 'DevOps', 'Python'],
    github: 'https://github.com/011-sam-110',
    featured: false,
    color: '#10b981',
  },
]

export const techStack: Record<string, TechItem[]> = {
  Languages: [
    { name: 'Python', relatedProjects: ['compliance-auditor', 'navigator', 'motion-llm', 'dev-analytics'] },
    { name: 'JavaScript', relatedProjects: ['dev-analytics'] },
    { name: 'C', relatedProjects: [] },
    { name: 'Java', relatedProjects: [] },
    { name: 'HTML / CSS', relatedProjects: [] },
    { name: 'Bash', relatedProjects: ['dev-analytics'] },
  ],
  'AI / ML': [
    { name: 'GPT-4o Vision', relatedProjects: ['navigator', 'motion-llm'] },
    { name: 'Gemini 2.0', relatedProjects: ['compliance-auditor'] },
    { name: 'OpenCV', relatedProjects: ['navigator', 'motion-llm'] },
    { name: 'OpenAI API', relatedProjects: ['motion-llm'] },
    { name: 'NumPy', relatedProjects: [] },
    { name: 'Agentic Systems', relatedProjects: ['navigator', 'motion-llm'] },
  ],
  'Tools & Infra': [
    { name: 'FastAPI', relatedProjects: ['navigator'] },
    { name: 'Streamlit', relatedProjects: ['compliance-auditor'] },
    { name: 'Git / GitHub', relatedProjects: ['dev-analytics'] },
    { name: 'Linux', relatedProjects: [] },
    { name: 'GitHub Actions', relatedProjects: ['dev-analytics'] },
    { name: 'Docker', relatedProjects: [] },
  ],
}

export const blogPosts: BlogPost[] = [
  {
    id: 'multi-threading-vision',
    title: 'Building Real-Time Vision Pipelines Without Dropping Frames',
    date: '2026-03-15',
    readTime: '8 min',
    excerpt:
      'How I achieved 30 FPS stability in a multi-threaded OpenCV + GPT-4o-mini pipeline — threading strategy, queue management, and why naive synchronization kills real-time systems.',
    tags: ['Python', 'Computer Vision', 'Performance'],
  },
  {
    id: 'llm-determinism',
    title: 'Constraining LLMs to Deterministic Outputs',
    date: '2026-02-28',
    readTime: '6 min',
    excerpt:
      'The custom command DSL I built to transform GPT-4o Vision\'s natural language into safe, executable desktop actions — and why prompt engineering alone isn\'t enough.',
    tags: ['AI', 'System Design', 'Safety'],
  },
  {
    id: 'hackathon-velocity',
    title: 'What I Learned Building a Product in 24 Hours, Alone',
    date: '2026-01-20',
    readTime: '5 min',
    excerpt:
      'Speed vs. quality trade-offs, tech stack decisions under pressure, and the single mental model that won me the Sussex Hackathon 2026.',
    tags: ['Hackathon', 'Engineering', 'Mindset'],
  },
]
