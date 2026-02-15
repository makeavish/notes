---
title: "FocusDeck: Intentional Feed"
date: 2025-02-14
tags:
  - browser-extension
  - productivity
  - open-source
---

[FocusDeck](https://github.com/makeavish/FocusDeck) is a browser extension that turns infinite, dopamine drip social feeds into an intentional "deck" you step through one post at a time.

## Why I built this

Social media feeds are designed to keep you scrolling forever. I wanted a way to browse intentionally — see posts one at a time, take a deliberate action (save or skip), and then move on with my day. FocusDeck adds a session-based layer on top of the native feed so you stay in control.

## How it works

- **Session-gated browsing** — Feed is locked until you start a session with a post limit (10 / 20 / 30 / custom).
- **One post at a time** — Only the focused post is visible; everything else is hidden.
- **Quick actions** — Save or mark "Not interested" to train the platform's algorithm to your taste.
- **Daily limits** — Set a total daily post cap that resets at midnight.
- **Keyboard-first** — Navigate with `J`/`K`, save with `S`, skip with `X`.

## Tech stack

- TypeScript
- Vite build pipeline
- WebExtensions MV3 (Chrome + Firefox)
- Minimal dependencies, no remote code loading

## Current scope & roadmap

Currently focused on **X/Twitter**. Adapter skeletons for Hacker News, Reddit, and LinkedIn are in the repo for future expansion.

## Links

- **Source**: [github.com/makeavish/FocusDeck](https://github.com/makeavish/FocusDeck)
- **Architecture**: [/docs/architecture.md](https://github.com/makeavish/FocusDeck/blob/main/docs/architecture.md)
- **Privacy policy**: [/docs/privacy-policy.md](https://github.com/makeavish/FocusDeck/blob/main/docs/privacy-policy.md)
