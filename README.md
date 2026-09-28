# thoughts — demo

A mobile-first, swipeable prototype with 200 baseline thoughts and optional batches of newer thoughts. The baseline was inspired by reporting published or updated on September 27, 2026 (US Eastern time). Each thought links to the reporting that sparked it. The thoughts are reflections, not summaries or verified news claims.

## Run

Requires Node.js 18 or newer. No install step or API key is needed. Open a terminal in the folder containing `package.json` and run:

```powershell
npm start
```

Open <http://127.0.0.1:4173> in a browser. Use a narrow browser window to see the phone layout. Swipe left and right on a thought, use the arrow buttons, or press the keyboard arrow keys.

Keep the terminal open while using the demo. Opening `index.html` directly from your files uses a `file://` URL; browsers block the JavaScript module import that loads the 200 thoughts. Use the local address above instead. Press Ctrl+C in the terminal to stop the server.

## What works

- Topic filters and a feed of 200 baseline thoughts plus active batches
- Likes and saves
- Collections, including adding and removing thoughts
- Multiple local demo profiles
- Source links on every thought
- Browser storage persistence across refreshes

Profiles are **local to one browser**. They do not have passwords, email delivery, or a shared backend. This is intentional for a prototype; production accounts will need authentication, a database, privacy controls, and an automated editorial pipeline.

## Manage thought batches

The baseline 200 stay in `data.js`. Add each new set as one JSON file in `batches/`, then add one entry to `batches/index.json`. The feed loads only enabled, unexpired batches and shows them before the baseline. Batch files that are disabled or expired stay in the repository but are not downloaded by visitors.

Example `batches/example-current-events.json`:

```json
{
  "id": "example-current-events",
  "thoughts": [
    {
      "id": "question-01",
      "text": "What small routine changes when a city has to start over?",
      "topic": "World",
      "label": "Community",
      "story": "A verified article headline",
      "source": "The publisher",
      "url": "https://example.com/actual-article",
      "published": "2026-09-28"
    }
  ]
}
```

Add its control entry to the `batches` array in `batches/index.json`:

```json
{
  "id": "example-current-events",
  "file": "example-current-events.json",
  "enabled": true,
  "expiresAt": "2026-10-05T04:00:00Z",
  "expectedCount": 1
}
```

Set `enabled` to `false` to pull a batch from the feed. Set `expiresAt` to a UTC timestamp to hide it automatically after that time, or `null` to keep it active until you turn it off. The September 28 batch contains 80 thoughts and expires after seven days. To re-enable it, change `enabled` back to `true` and give it a future `expiresAt` or `null`. `expectedCount` guards against an incomplete batch. A page refresh picks up the new active list after GitHub Pages publishes the change. Removing a batch from the feed also removes its thoughts from saved lists and collections while it is inactive; their IDs remain stable if the batch is re-enabled.

Each thought gets a permanent ID made from its batch ID and local ID, such as `2026-09-28-current-events:swift-vmas-01`. Do not rename a published batch or reuse an ID for different text. New batches can use the existing topics: `World`, `Life`, `Tech`, `Sports`, and `Culture`.

Run `npm.cmd run check` on Windows (or `npm run check` elsewhere) before submitting a batch. It checks the baseline and every batch listed in the index. The browser does not contain API keys; Grok Bot can prepare a batch file and a pull request for review. This repository does not yet include automatic daily generation or publication.
