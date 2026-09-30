<div align="center">

[![Resume Matcher](assets/header.png)](https://www.resumematcher.fyi)

# Resume Matcher

[𝚆𝚑𝚊𝚝'𝚜 𝙳𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚒𝚗 𝚝𝚑𝚒𝚜 𝙵𝚘𝚛𝚔](#whats-different-in-this-fork) ✦ [𝙹𝚘𝚒𝚗 𝙳𝚒𝚜𝚌𝚘𝚛𝚍](https://dsc.gg/resume-matcher) ✦ [𝚆𝚎𝚋𝚜𝚒𝚝𝚎](https://resumematcher.fyi) ✦ [𝙷𝚘𝚠 𝚝𝚘 𝙸𝚗𝚜𝚝𝚊𝚕𝚕](#how-to-install) ✦ [𝙲𝚘𝚗𝚝𝚛𝚒𝚋𝚞𝚝𝚘𝚛𝚜](#contributors) ✦ [𝚂𝚙𝚘𝚗𝚜𝚘𝚛](#sponsors) ✦ [𝚃𝚠𝚒𝚝𝚝𝚎𝚛/𝚇](https://twitter.com/srbhrai) ✦ [𝙾𝚛𝚒𝚐𝚒𝚗𝚊𝚕 𝙲𝚛𝚎𝚊𝚝𝚘𝚛](https://srbhr.com)

**English** | [Español](README.es.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

The AI harness to build tailored resumes for each job application with Claude, ChatGPT, DeepSeek, Kimi, GLM, Gemma, and other LLMs. Supports both local and remote LLMs.

![Resume Matcher Demo](assets/Resume_Matcher_Demo_2.gif)

</div>

> ### This is a modified fork
>
> **Resume Matcher** was created by **[Saurabh Rai](https://srbhr.com)** and is maintained at
> **[srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher)** ([resumematcher.fyi](https://resumematcher.fyi)).
> All credit for the project belongs to Saurabh and the upstream contributors.
>
> This repository is a personal fork maintained by **[Codie](https://github.com/codie-freeman)**.
> **Files in this repository have been modified from the original**, and some files have been added —
> see **[What's Different in This Fork](#whats-different-in-this-fork)** for the full list.
> The upstream project has not reviewed and is not responsible for any changes made here.
>
> Licensed under the Apache License 2.0, unchanged from upstream. See [License and Attribution](#license-and-attribution).
>
> **Looking for the original project? Go to [srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher).**

<br>

<div align="center">

![Apache 2.0](https://img.shields.io/github/license/codie-freeman/Resume-Matcher?labelColor=F0F0E8&style=for-the-badge&color=1d4ed8) ![version](https://img.shields.io/badge/Fork%20of%20upstream-v1.2%20Nightvision-FFF?labelColor=F0F0E8&style=for-the-badge&color=1d4ed8)

[![Discord](https://img.shields.io/discord/1122069176962531400?labelColor=F0F0E8&logo=discord&logoColor=1d4ed8&style=for-the-badge&color=1d4ed8)](https://dsc.gg/resume-matcher) [![Website](https://img.shields.io/badge/website-Resume%20Matcher-FFF?labelColor=F0F0E8&style=for-the-badge&color=1d4ed8)](https://resumematcher.fyi) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Resume%20Matcher-FFF?labelColor=F0F0E8&logo=LinkedIn&style=for-the-badge&color=1d4ed8)](https://www.linkedin.com/company/resume-matcher/)

</div>

> \[!IMPORTANT]
>
> **Support goes to the original creator, not to this fork.** Saurabh Rai develops and maintains Resume Matcher.
> If you can donate a small amount, that will help him to continue developing and improving the upstream project.

<div align="center">

[![Sponsor on GitHub](https://img.shields.io/github/sponsors/srbhr?style=for-the-badge&label=Sponsor&color=1d4ed8&labelColor=F0F0E8&logo=github&logoColor=black)](https://github.com/sponsors/srbhr) [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&color=1d4ed8&labelColor=F0F0E8&logoColor=black)](https://www.buymeacoffee.com/srbhr)

**Sponsoring for a company?** Put your logo in front of 27k+ developers → **[become a sponsor ↓](#sponsors)**

</div>

<a id="whats-different-in-this-fork"></a>

## What's Different in This Fork

Everything below was added on top of upstream **v1.2 "Nightvision"**. Nothing upstream was removed.

### Layout and typography control

- **Independent font sizes.** Name, contact line and section headers now use absolute size maps
  (`NAME_FONT_SIZE_MAP`, `CONTACT_FONT_SIZE_MAP`, `SECTION_HEADER_FONT_SIZE_MAP`) instead of multipliers
  off the base size, so changing Base or Header size no longer drags the other sizes with it.
- **Per-section font size override** — any section can override the base size (1–5), validated and clamped server-side.
- **"Justify Bullet Text" toggle** for justified bullet paragraphs.
- **A new "Custom" template** (Merriweather serif), alongside the four upstream templates.
- **Template settings are saved with the resume** on the server instead of only in browser localStorage,
  so your formatting follows the resume across devices. `mergeTemplateSettings()` keeps older saved
  settings loading cleanly as new options are added.

### Building a resume without the AI

- **"Create Without AI"** — author a tailored resume by hand, with no LLM call.
- **Tailor from any resume**, not just the master, via a base-resume picker on `/tailor`.
- **`POST /resumes/clone-for-job`** — clones a resume against a job with **zero LLM calls** and drops you
  straight into the Builder. Useful when you have no API credit, or want a deterministic starting point.

### Editing

- **Rich-text cover letters** — paragraphs, lists, and font-size / line-height controls in the Tiptap editor.
  HTML is sanitised through `sanitizeRichText()`, which allows only safe `font-size` and `line-height`
  values through the `style` attribute.
- **Drag to reorder individual bullet points** within a section, not just whole sections.

### Resume data model

- `Experience.secondaryYears` — record a second, non-contiguous stint in the same role.
- `Education.note` — a short italic footnote, e.g. explaining an extended course duration.
- **Custom named sub-lists** (`additionalGroups`) inside Additional Info and custom sections.

### Model support and output quality

- **Claude 5 family support** (`claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`) — these models reject the
  `temperature` parameter, so it is now omitted for them.
- **Extended AI-phrase "de-slop" filter.** Upstream's phrase blacklist gains `detail-oriented` plus a new
  regex layer for phrases whose wording varies ("highly motivated" / "highly-motivated"), tidying up the
  double spaces left behind and still honouring the job-description protection rules.

### Tests and translations

- Around 17 new backend and frontend test files, one per feature above.
- New UI strings across all six locales (en, es, fr, ja, pt-BR, zh).
- Backfilled the French locale's missing `interviewPrep` strings — upstream merged French support and the
  interview-prep workflow separately, which left `fr.json` short of `en.json` and broke `next build`.

## Getting Started

Resume Matcher works by creating a master resume that you can use to tailor for each job application. Installation instructions here: [How to Install](#how-to-install)

### How It Works

1. **Upload** your master resume (PDF or DOCX)
2. **Paste** a job description you're targeting
3. **Review** AI-generated improvements and tailored content
4. **Cover Letter** and optional interview preparation for the job application
5. **Customize** the layout and sections to fit your style
6. **Export** as a professional PDF with your preferred template

### Stay Connected

[![Discord](assets/resume_matcher_discord.png)](https://dsc.gg/resume-matcher)

Join our [Discord](https://dsc.gg/resume-matcher) for discussions, feature requests, and community support.

[![LinkedIn](assets/resume_matcher_linkedin.png)](https://www.linkedin.com/company/resume-matcher/)

Follow us on [LinkedIn](https://www.linkedin.com/company/resume-matcher/) for updates.

![Star Resume Matcher](assets/star_resume_matcher.png)

Star the repo to support development and get notified of new releases.

<a id="sponsors"></a>

## Sponsors — Supporting the Original Project

![sponsors](assets/sponsors.png)

> Every sponsorship link in this section goes to **Saurabh Rai**, the creator of Resume Matcher.
> None of them go to this fork or its maintainer. The section is reproduced from the upstream README
> so the people funding the project keep their credit.

Resume Matcher is free and open-source, kept alive by its sponsors and backers. If it helps you, please consider supporting its development.

### Companies backing Resume Matcher (upstream)

Sponsor at a company tier and **your logo + link + blurb lands here** — in front of a community of **27k+ stars and 4.9k forks**, featured on [Trendshift](https://trendshift.io/repositories/565) and the [Vercel OSS Program](https://vercel.com/oss).

| Sponsor | Description |
|---------|-------------|
| [Apideck](https://apideck.com?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) | One API to connect your app to 200+ SaaS platforms (accounting, HRIS, CRM, file storage). Build integrations once, not 50 times. 🌐 [apideck.com](https://apideck.com?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) |
| [Vercel](https://vercel.com?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) | Resume Matcher is a part of Vercel OSS // Summer 2025 Program 🌐 [vercel.com](https://vercel.com?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) |
| [Cubic.dev](https://cubic.dev?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) | Cubic provides PR reviews for Resume Matcher 🌐 [cubic.dev](https://cubic.dev?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) |
| [Kilo Code](https://kilo.ai?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) | Kilo Code provides AI code reviews and coding credits to Resume Matcher 🌐 [kilo.ai](https://kilo.ai?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) |
| [ZanReal](https://zanreal.com/?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) | ZanReal is an AI-driven development company building scalable cloud solutions, from strategy and UX to DevOps, helping teams ship faster and turn ideas into production. 🌐 [zanreal.com](https://zanreal.com/?utm_source=resumematcher&utm_medium=github&utm_campaign=sponsors) |
| **✦ Your company here** | Reach 27k+ developers and 4.9k forks. **[Become a sponsor →](https://github.com/sponsors/srbhr)** |

Read the [Sponsorship Guide](https://resumematcher.fyi/docs/sponsoring) for tiers and details. Sponsors get a special thank-you in the README and on our website.

<a id="support-the-development-by-donating"></a>

### Support Saurabh as an individual

![donate](assets/supporting_resume_matcher.png)

Every bit keeps Resume Matcher free and funds new features — and you'll be thanked in the README and on our website.

| Platform  | Link                                   |
|-----------|----------------------------------------|
| GitHub    | [![GitHub Sponsors](https://img.shields.io/github/sponsors/srbhr?style=for-the-badge&color=1d4ed8&labelColor=F0F0E8&logo=github&logoColor=black)](https://github.com/sponsors/srbhr) |
| Buy Me a Coffee | [![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&color=1d4ed8&labelColor=F0F0E8&logoColor=black)](https://www.buymeacoffee.com/srbhr) |

## Creator's Note — from Saurabh Rai, the original author

[![srbhr](assets/creators_note.png)](https://srbhr.com)

> Reproduced unchanged from the upstream README. The note and the links below are Saurabh's, not the fork maintainer's.

Thank you for checking out Resume Matcher. If you want to connect, collaborate, or just say hi, feel free to reach out!
~ **Saurabh Rai** ✨

You can follow me on:

- Website: [https://srbhr.com](https://srbhr.com)
- Linkedin: [https://www.linkedin.com/in/srbhr/](https://www.linkedin.com/in/srbhr/)
- Twitter: [https://twitter.com/srbhrai](https://twitter.com/srbhrai)
- GitHub: [https://github.com/srbhr](https://github.com/srbhr)

## Key Features

![resume_matcher_features](assets/features.png)

### Core Features

**Master Resume**: Create a comprehensive master resume to draw from your existing one.

![Job Description Input](assets/step_2.png)

### Resume Builder

![Resume Builder](assets/step_5.png)

Paste in a job description and get AI-powered resume tailored for that specific role.

You can:

- Modify suggested content
- Add/remove sections
- Rearrange sections via drag-and-drop
- Choose from multiple resume templates

### Cover Letter Generator

Generate tailored cover letters based on the job description and your resume.

![Cover Letter](assets/cover_letter.png)

### Interview Preparation

Generate structured, resume-grounded interview prep for saved tailored resumes. Use the Builder's Interview Prep tab on demand, or enable automatic generation in Settings.

### Resume Scoring & Keyword Highlighting

Analyze your resume against the job description with a match score, keyword highlighting, and suggestions for improvement.

![Resume Scoring and Keyword Highlight](assets/keyword_highlighter.png)

### PDF Export

Export your tailored resume and cover letter in PDF.

### Templates

| Template Name | Preview | Description |
|---------------|---------|-------------|
| **Classic Single Column** | ![Classic Template](assets/pdf-templates/single-column.jpg) | A traditional and clean layout suitable for most industries. [𝐕𝐢𝐞𝐰 𝐏𝐃𝐅](assets/pdf-templates/single-column.pdf) |
| **Modern Single Column** | ![Modern Template](assets/pdf-templates/modern-single-column.jpg) | A contemporary design with a focus on readability and aesthetics. [𝐕𝐢𝐞𝐰 𝐏𝐃𝐅](assets/pdf-templates/modern-single-column.pdf)|
| **Classic Two Column** | ![Classic Two Column Template](assets/pdf-templates/two-column.jpg) | A structured layout that separates sections for clarity. [𝐕𝐢𝐞𝐰 𝐏𝐃𝐅](assets/pdf-templates/two-column.pdf)|
| **Modern Two Column** | ![Modern Two Column Template](assets/pdf-templates/modern-two-column.jpg) | A sleek design that utilizes two columns for better organization. [𝐕𝐢𝐞𝐰 𝐏𝐃𝐅](assets/pdf-templates/modern-two-column.pdf)|

### Internationalization

- **Multi-Language UI**: Interface available in English, Spanish, Chinese, Japanese, and Portuguese (Brazilian)
- **Multi-Language Content**: Generate resumes and cover letters in your preferred language

### Roadmap

If you have any suggestions or feature requests, please feel free to open an issue on GitHub or discuss it on our [Discord](https://dsc.gg/resume-matcher) server.

- AI Canvas for crafting impactful, metric-driven resume content
- Email template generator for job applications
- Multi-job description optimization

<a id="how-to-install"></a>

## How to Install

![Installation](assets/how_to_install_resumematcher.png)

For detailed setup instructions, see **[SETUP.md](SETUP.md)** (English) or: [Español](SETUP.es.md), [简体中文](SETUP.zh-CN.md), [日本語](SETUP.ja.md).

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Python | 3.13+ | [python.org](https://python.org) |
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| uv | Latest | [astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) |

### Quick Start

Fastest for MacOS, WSL and Ubuntu users:

```bash
# Clone this fork
git clone https://github.com/codie-freeman/Resume-Matcher.git
cd Resume-Matcher

# Backend (Terminal 1)
cd apps/backend
cp .env.example .env        # Configure your AI provider
uv sync                      # Install dependencies
uv run app

# Frontend (Terminal 2)
cd apps/frontend
npm install
npm run dev
```

Open **<http://localhost:3000>** and configure your AI provider in Settings.

### Supported AI Providers

| Provider | Local/Cloud | Notes |
|----------|-------------|-------|
| **Ollama** | Local | Free, runs on your machine |
| **OpenAI** | Cloud | GPT-5 Nano, GPT-4o |
| **Anthropic** | Cloud | Claude Haiku 4.5 |
| **Google Gemini** | Cloud | Gemini 3 Flash |
| **OpenRouter** | Cloud | Access to multiple models |
| **DeepSeek** | Cloud | DeepSeek Chat |

### Docker Deployment

**This fork does not publish Docker images.** The upstream images (`ghcr.io/srbhr/resume-matcher`,
`srbhr/resume-matcher`) are the *original* project and do **not** contain any of the changes listed above.
To run this fork in Docker, build it from source:

```bash
git clone https://github.com/codie-freeman/Resume-Matcher.git
cd Resume-Matcher
docker build -t resume-matcher-fork .

docker run --name resume-matcher \
  -p 3000:3000 \
  -v resume-data:/app/backend/data \
  resume-matcher-fork
```

Endpoints:

- App: <http://localhost:3000>
- API health check: <http://localhost:3000/api/v1/health>
- API docs: <http://localhost:3000/docs>

> **Using Ollama with Docker?** Use `http://host.docker.internal:11434` as the Ollama URL instead of `localhost`.

### Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI, Python 3.13+, LiteLLM |
| Frontend | Next.js 16, React 19, TypeScript |
| Database | SQLite (SQLAlchemy + aiosqlite) |
| Styling | Tailwind CSS 4, Swiss International Style |
| PDF | Headless Chromium via Playwright |

## Join Us and Contribute

![how to contribute](assets/how_to_contribute.png)

We welcome contributions from everyone! Whether you're a developer, designer, or just someone who wants to help out. All the contributors are listed in the [about page](https://resumematcher.fyi/about) on our website and on the GitHub Readme here.

Check out the roadmap if you would like to work on the features that are planned for the future. If you have any suggestions or feature requests, please feel free to open an issue on GitHub and discuss it on our [Discord](https://dsc.gg/resume-matcher) server.

> Contributing to **Resume Matcher itself**? Please open your issue or pull request against the upstream
> repository, [srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher) — that is where the project
> is developed. This fork only carries the personal changes listed above.

<a id="license-and-attribution"></a>

## License and Attribution

Resume Matcher is Copyright © Saurabh Rai and the Resume Matcher contributors, licensed under the
**[Apache License 2.0](LICENSE)**. This fork is distributed under the same licence, unchanged.

- **Original work:** [srbhr/Resume-Matcher](https://github.com/srbhr/Resume-Matcher) by
  [Saurabh Rai](https://srbhr.com) — [resumematcher.fyi](https://resumematcher.fyi)
- **This fork:** modifications © 2026 Codie, also under Apache 2.0
- **Changes made:** files in this repository have been modified from the original; see
  [What's Different in This Fork](#whats-different-in-this-fork)

Nothing here revokes or narrows the upstream licence. If you want the canonical project, use the
upstream repository.

<a id="contributors"></a>

## Contributors

![Contributors](assets/contributors.png)

<a href="https://github.com/srbhr/Resume-Matcher/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=srbhr/Resume-Matcher" />
</a>

These are the people who built Resume Matcher upstream. This fork is maintained by
[Codie](https://github.com/codie-freeman).

<br/>

<details>
  <summary><kbd>Star History</kbd></summary>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=srbhr/resume-matcher&theme=dark&type=Date">
    <img width="100%" src="https://api.star-history.com/svg?repos=srbhr/resume-matcher&theme=dark&type=Date">
  </picture>
</details>

## The upstream Resume Matcher is part of the [Vercel Open Source Program](https://vercel.com/oss)

![Vercel OSS Program](https://vercel.com/oss/program-badge.svg)
