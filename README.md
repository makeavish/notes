# Vishal's Digital Garden

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

This is Vishal's Digital Garden, powered by [Quartz](https://quartz.jzhao.xyz/).

## Commands

- **Build**: `npx quartz build --serve`
- **Sync**: `npx quartz sync`
- **Update Quartz**: `npx quartz update`

## Content Structure

- `content/Blog/`
- `content/Life/`
- `content/Notes/`
- `content/Projects/`
- `content/Recommendations/`

## Recommendations Taxonomy

Recommendations are organized by category folders with one note per item:

```text
content/Recommendations/
  index.md
  Podcasts/
    index.md
    lenny-podcast.md
    5-questions-to-ask-when-your-product-stops-growing-jason-cohen.md
  Talks/
    index.md
  Blogs/
    index.md
  Books/
    index.md
```

Podcast recommendations use two types:

- `podcast` for show-level recommendations
- `podcast-episode` for episode-level recommendations

Episode notes should link back to their parent podcast note for graph navigation.

## Recommendations Authoring Notes

These conventions are for maintainers and should stay out of reader-facing index pages.

- Podcast recommendations are split into two kinds:
  - `podcast` for show-level recommendations
  - `podcast-episode` for specific episodes
- Use `content/Recommendations/Podcasts/podcast-template.md` for show-level notes.
- Use `content/Recommendations/Podcasts/podcast-episode-template.md` for episode-level notes.
- Prefer slug-style filenames and set `draft: false` when publishing.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/
