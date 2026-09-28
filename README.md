# thoughts — demo

A mobile-first, swipeable prototype with 280 original thoughts inspired by reporting published or updated on September 27 and September 28, 2026 (US Eastern time). Each thought links to the reporting that sparked it. The thoughts are reflections, not summaries or verified news claims.

The Sep 27 edition holds 200 thoughts across 25 stories. The Sep 28 edition adds 80 thoughts across 10 stories, including current events and pop culture.

## Run

Requires Node.js 18 or newer. No install step or API key is needed.

```powershell
cd F:\Thoughts
npm start
```

Open <http://127.0.0.1:4173> in a browser. Use a narrow browser window to see the phone layout. Swipe left and right on a thought, use the arrow buttons, or press the keyboard arrow keys.

## What works

- Topic filters and a 280-thought feed
- Likes and saves
- Collections, including adding and removing thoughts
- Multiple local demo profiles
- Source links on every thought
- Browser storage persistence across refreshes

Profiles are **local to one browser**. They do not have passwords, email delivery, or a shared backend. This is intentional for a prototype; production accounts will need authentication, a database, privacy controls, and an automated editorial pipeline.

The editions are dated snapshots. No daily or hourly ingestion job runs in this demo.
