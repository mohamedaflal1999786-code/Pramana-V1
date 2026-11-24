# Pramana-V1

> **Every Alert. Backed by Evidence.**  
> Developed by **Unknown GenZ** · Domain: Healthcare and Life Sciences

---

## 1. Overview

**Pramana-V1** is an evidence-driven patient safety and healthcare intelligence web platform designed to bridge fragmented clinical documentation, uncover hidden discrepancies (such as medication conflicts and handoff gaps), and anchor every clinical alert directly to verified source documentation.

### Core Philosophy
* **Safety Provenance Graph**: Every flag, alert, or extracted finding links back to its exact source document and professional rule.
* **Human-in-the-Loop Oversight**: Designed strictly to assist qualified healthcare professionals, with no autonomous diagnosing or unsupervised prescribing.
* **Strict Authenticity**: Zero fabricated data, no simulated clinical trials, and clear empty states for unconfigured services.

---

## 2. Architecture & Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) 14 (App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design tokens mapped from the approved visual system
* **Icons**: [Lucide React](https://lucide.dev/)
* **Code Quality**: ESLint (`next/core-web-vitals`)
* **Future Service Integrations**:
  * **Database & Storage**: [Supabase](https://supabase.com/) (stubs and configuration guards prepared in `src/lib/supabase`)
  * **Multimodal Extraction**: [Google Gemini API](https://ai.google.dev/) (stubs and audit guards prepared in `src/lib/gemini`)

---

## 3. Project Structure

```
Pramana-V1/
├── Pramana-V1-index.html       # Original approved design reference (preserved)
├── .env.example                 # Environment configuration template (placeholders only)
├── .gitignore                   # Secure git ignore specification
├── next.config.mjs              # Next.js runtime configuration
├── package.json                 # Dependencies and execution scripts
├── postcss.config.mjs           # PostCSS configuration for Tailwind
├── tailwind.config.ts           # Custom color tokens and container extensions
├── tsconfig.json                # TypeScript compiler configuration
├── README.md                    # Project documentation
└── src/
    ├── app/
    │   ├── globals.css          # Design token definitions, typography, and responsive styles
    │   ├── layout.tsx           # Root HTML layout and metadata configuration
    │   └── page.tsx             # Main landing page assembling reusable components
    ├── components/
    │   ├── common/
    │   │   ├── Header.tsx       # Sticky navigation with responsive mobile menu
    │   │   └── Footer.tsx       # Standardized footer and back-to-top interaction
    │   └── home/
    │       ├── HeroSection.tsx      # Hero banner, typography, and evidence network SVG art
    │       ├── EvidenceStrip.tsx    # 3-pillar core summary strip
    │       ├── PlatformFeatures.tsx # Safety Provenance Graph and feature tiles
    │       ├── WorkflowSection.tsx  # 4-stage intended clinical workflow (Upload → Review)
    │       ├── PrinciplesSection.tsx# Responsible AI and clinical accountability rules
    │       └── FaqSection.tsx       # Interactive FAQ accordion
    ├── lib/
    │   ├── supabase/
    │   │   └── client.ts        # Supabase client foundation and status checking
    │   └── gemini/
    │       └── client.ts        # Gemini AI client foundation and status checking
    └── types/
        └── index.ts             # Shared TypeScript interfaces and domain models
```

---

## 4. Getting Started

### Prerequisites
* **Node.js**: v20.18.0+ LTS
* **npm**: v10+
* **Git**: Installed

### Installation
```bash
# Clone the repository (or navigate to workspace)
cd Pramana-V1

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

### Quality Verification
```bash
# Linting check
npm run lint

# Production build and type validation
npm run build
```

---

## 5. Environment Configuration

Copy `.env.example` to `.env.local` to configure future service variables:
```bash
cp .env.example .env.local
```
> **Security Reminder**: Never commit `.env.local` or sensitive API keys to source control.

---

## 6. Development Status

* [x] **Phase 01**: Project scaffolding, dependency installation, approved design conversion, reusable React component architecture, TypeScript validation, and build verification.
* [ ] **Phase 02**: Authentication setup (Supabase Auth) with role-based access control.
* [ ] **Phase 03**: Document upload pipeline & private clinical storage.
* [ ] **Phase 04**: Google Gemini extraction pipeline with safety provenance graph visualization.
