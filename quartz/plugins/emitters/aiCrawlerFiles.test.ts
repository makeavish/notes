import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { Root } from "hast"
import { VFile } from "vfile"

import { QuartzConfig } from "../../cfg"
import { BuildCtx } from "../../util/ctx"
import { FilePath, FullSlug } from "../../util/path"
import { StaticResources } from "../../util/resources"
import { ProcessedContent } from "../vfile"
import { AICrawlerFiles } from "./aiCrawlerFiles"

function makeCtx(outputDir: string): BuildCtx {
  const cfg = {
    configuration: {
      pageTitle: "Vishal's Home",
      enableSPA: true,
      enablePopovers: true,
      analytics: null,
      ignorePatterns: [],
      defaultDateType: "modified",
      baseUrl: "vishal.wtf",
      locale: "en-US",
      theme: {
        fontOrigin: "googleFonts",
        cdnCaching: true,
        typography: {
          header: "Schibsted Grotesk",
          body: "Source Sans Pro",
          code: "IBM Plex Mono",
        },
        colors: {
          lightMode: {
            light: "#fff",
            lightgray: "#eee",
            gray: "#999",
            darkgray: "#666",
            dark: "#111",
            secondary: "#333",
            tertiary: "#555",
            highlight: "rgba(0,0,0,0.1)",
            textHighlight: "#ffff00",
          },
          darkMode: {
            light: "#111",
            lightgray: "#222",
            gray: "#777",
            darkgray: "#bbb",
            dark: "#fff",
            secondary: "#ddd",
            tertiary: "#ccc",
            highlight: "rgba(255,255,255,0.1)",
            textHighlight: "#ffff00",
          },
        },
      },
    },
    plugins: {
      transformers: [],
      filters: [],
      emitters: [],
    },
  } as unknown as QuartzConfig

  return {
    buildId: "test-build",
    argv: {
      directory: "content",
      verbose: false,
      output: outputDir,
      serve: false,
      watch: false,
      port: 8080,
      wsPort: 8081,
    },
    cfg,
    allSlugs: [],
    allFiles: [],
    incremental: false,
  }
}

function makeProcessedContent({
  slug,
  title,
  markdown,
  description,
  draft,
  modified,
}: {
  slug: string
  title: string
  markdown: string
  description?: string
  draft?: boolean
  modified?: Date
}): ProcessedContent {
  const tree: Root = { type: "root", children: [] }
  const file = new VFile(markdown)
  file.data = {
    slug: slug as FullSlug,
    filePath: `${slug}.md` as FilePath,
    relativePath: `${slug}.md` as FilePath,
    description: description ?? "",
    frontmatter: {
      title,
      tags: [],
      ...(draft ? { draft: true } : {}),
    },
    dates: modified
      ? {
          created: modified,
          modified,
          published: modified,
        }
      : undefined,
  }

  return [tree, file]
}

test("AICrawlerFiles emitter generates crawler files and markdown mirrors", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "quartz-ai-crawler-"))
  const ctx = makeCtx(tmpDir)
  const resources: StaticResources = { css: [], js: [], additionalHead: [] }
  const emitter = AICrawlerFiles()
  const content: ProcessedContent[] = [
    makeProcessedContent({
      slug: "index",
      title: "Home",
      markdown: "---\ntitle: Home\n---\nWelcome home.",
      description: "Home page.",
      modified: new Date("2026-02-01T12:00:00.000Z"),
    }),
    makeProcessedContent({
      slug: "Notes/cafe-é",
      title: "Cafe Note",
      markdown: "---\ntitle: Cafe Note\n---\nPublished body for robots and llms.",
      description: "Cafe entry.",
      modified: new Date("2026-02-10T12:00:00.000Z"),
    }),
    makeProcessedContent({
      slug: "Notes/draft-note",
      title: "Draft Note",
      markdown: "---\ntitle: Draft Note\n---\nThis draft should not be published.",
      draft: true,
      modified: new Date("2026-02-15T12:00:00.000Z"),
    }),
    makeProcessedContent({
      slug: "tags/observability",
      title: "Tag Utility Page",
      markdown: "Generated utility page.",
      modified: new Date("2026-02-11T12:00:00.000Z"),
    }),
  ]

  const emitted = await emitter.emit(ctx, content, resources)
  if (Symbol.asyncIterator in emitted) {
    for await (const _ of emitted) {
      // consume output paths for side effects
    }
  } else {
    await emitted
  }

  const robotsTxt = await fs.readFile(path.join(tmpDir, "robots.txt"), "utf8")
  const llmsTxt = await fs.readFile(path.join(tmpDir, "llms.txt"), "utf8")
  const llmsFullTxt = await fs.readFile(path.join(tmpDir, "llms-full.txt"), "utf8")
  const homeMirror = await fs.readFile(path.join(tmpDir, "index.md"), "utf8")
  const noteMirror = await fs.readFile(path.join(tmpDir, "Notes", "cafe-é.md"), "utf8")

  assert.match(robotsTxt, /^User-agent: \*$/m)
  assert.match(robotsTxt, /^Allow: \/$/m)
  assert.match(robotsTxt, /^Sitemap: https:\/\/vishal\.wtf\/sitemap\.xml$/m)

  assert.ok(llmsTxt.includes("https://vishal.wtf/llms-full.txt"))
  assert.ok(llmsTxt.includes("https://vishal.wtf/sitemap.xml"))
  assert.ok(llmsTxt.includes("may be indexed, summarized, and used for model training"))

  assert.ok(llmsFullTxt.includes("https://vishal.wtf/Notes/cafe-%C3%A9"))
  assert.ok(llmsFullTxt.includes("https://vishal.wtf/Notes/cafe-%C3%A9.md"))
  assert.ok(llmsFullTxt.includes("Published body for robots and llms."))
  assert.ok(!llmsFullTxt.includes("title: Cafe Note"))
  assert.ok(!llmsFullTxt.includes("This draft should not be published."))
  assert.ok(!llmsFullTxt.includes("tags/observability"))

  assert.ok(homeMirror.includes("title: Home"))
  assert.ok(noteMirror.includes("title: Cafe Note"))
  await assert.rejects(fs.access(path.join(tmpDir, "Notes", "draft-note.md")))
  await assert.rejects(fs.access(path.join(tmpDir, "tags", "observability.md")))

  await fs.rm(tmpDir, { recursive: true, force: true })
})
