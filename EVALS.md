# Evals

Run:

```bash
npm run eval
```

Current evals are JSON fixtures under `evals/paperclips/cases`. They validate the post-VLM contract:

- scene validation accepts readable Paperclips fields;
- policy chooses the expected action;
- advice is approved only when it cites visible current fields.

The next eval expansion should add real saved screenshots and compare VLM extraction against human-authored labels. Browser automation may open the game for fixture capture, but it must not generate runtime labels or feed DOM values into the app.
