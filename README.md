# Notion Flashcards

A spaced-repetition flashcard app powered by your own Notion database. Study smarter with the SM-2 algorithm, AI-generated cards, and an AI tutor — all connected to Notion as your data layer.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2FYOUR_REPO&env=NOTION_API_KEY,NOTION_DATABASE_ID&envDescription=Required%3A%20Notion%20API%20key%20and%20your%20flashcard%20database%20ID&project-name=notion-flashcards&root-directory=notion_flashcard)

> **Before sharing:** replace `YOUR_USERNAME/YOUR_REPO` in the button URL above with your GitHub repo.

---

## Features

- **Spaced repetition** — SM-2 algorithm, same as Anki
- **3D card flip** — tap to reveal, rate with Again / Hard / Good / Easy
- **AI flashcard generation** — generate 10 cards from any resource with one click (requires Anthropic API key)
- **AI tutor chat** — ask questions about what you're studying
- **Deck organisation** — link cards to books, courses, or articles
- **Optional sections** — Habits, Tasks, Projects, Journal, Content calendar — each powered by its own Notion database, all optional

---

## Quick start

### 1. Create a Notion integration

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations) → **New integration**
2. Name it (e.g. "Flashcards"), select your workspace, click **Save**
3. Copy the **Internal Integration Secret** — this is your `NOTION_API_KEY`

### 2. Set up your flashcard database

Create a Notion database with these properties:

| Property | Type | Required |
|---|---|---|
| Question | Title | ✓ |
| Answer | Text | ✓ |
| EaseFactor | Number | ✓ |
| Interval | Number | ✓ |
| Repetitions | Number | ✓ |
| NextReview | Date | ✓ |
| LastReview | Date | ✓ |
| Deck | Select | optional |
| Resources | Relation → Resources DB | optional |

Share the database with your integration: open the database → **Share** → **Connect to** → select your integration.

Copy the database ID from the URL — the 32-character string before the `?`.

### 3. Run locally

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO
cd YOUR_REPO/notion_flashcard
cp .env.local.example .env.local
# Edit .env.local — add NOTION_API_KEY and NOTION_DATABASE_ID
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — if env vars are missing the app will show setup instructions.

### 4. Deploy to Vercel

Click **Deploy with Vercel** above, or:

```bash
npm i -g vercel
vercel --cwd notion_flashcard
```

Add `NOTION_API_KEY` and `NOTION_DATABASE_ID` in Vercel → Project Settings → Environment Variables.

---

## Optional sections

Every section beyond the core flashcard system is opt-in. Add the env var to unlock it:

| Section | Env var | Notion database needs |
|---|---|---|
| Resources & Decks | `NOTION_RESOURCES_DB` | Title, Status, URL, Source, Topic |
| Habits tracker | `NOTION_HABITS_DB` | Date (date) + one checkbox column per habit |
| Task scheduler | `NOTION_TASKS_DB` | Name, Do date, Due date, Priority, Done (status) |
| Projects | `NOTION_PROJECTS_DB` | Name, Status, Tasks (relation to tasks DB) |
| Journal | `NOTION_JOURNAL_DB` | Date (date) |
| Content calendar | `NOTION_SOCIAL_DB` | Name, Published Date, Status |

See [`.env.local.example`](.env.local.example) for all variables with descriptions.

---

## Setup page

Visit `/setup` at any time to see which env vars are configured, get copy-paste instructions, and check your database schema.

---

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [Notion API](https://developers.notion.com)
- [Anthropic Claude](https://anthropic.com) for AI features
- [Tailwind CSS](https://tailwindcss.com)
- SM-2 spaced repetition algorithm
