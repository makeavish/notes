import matter from "gray-matter"
import { getDate } from "../../components/Date"
import { QuartzEmitterPlugin } from "../types"
import { FullSlug, joinSegments, simplifySlug } from "../../util/path"
import { write } from "./helpers"
import { ProcessedContent, QuartzPluginData } from "../vfile"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"

interface Options {
  enableRobotsTxt: boolean
  enableLlmsTxt: boolean
  enableLlmsFullTxt: boolean
  emitMarkdownMirrors: boolean
}

const defaultOptions: Options = {
  enableRobotsTxt: true,
  enableLlmsTxt: true,
  enableLlmsFullTxt: true,
  emitMarkdownMirrors: true,
}

type PublishablePage = {
  slug: FullSlug
  title: string
  description: string
  canonicalPath: string
  canonicalUrl: string
  markdownUrl: string
  markdownWithFrontmatter: string
  markdownWithoutFrontmatter: string
  date?: Date
}

function isDraft(frontmatter: QuartzPluginData["frontmatter"]): boolean {
  return frontmatter?.draft === true || frontmatter?.draft === "true"
}

function isPublishablePage(fileData: QuartzPluginData): boolean {
  const slug = fileData.slug
  if (!slug) return false
  if (slug === "404") return false
  if (slug.startsWith("tags/")) return false
  if (isDraft(fileData.frontmatter)) return false
  return true
}

function getMarkdownContent(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (value instanceof Uint8Array) return Buffer.from(value).toString().trim()
  return String(value ?? "").trim()
}

function toAbsoluteUrl(baseUrl: string, slugOrPath: string): string {
  if (slugOrPath === "/") {
    return `https://${baseUrl}`
  }

  return `https://${joinSegments(baseUrl, encodeURI(slugOrPath))}`
}

function toPages(
  baseUrl: string,
  defaultDateTypeCfg: Parameters<typeof getDate>[0],
  content: ProcessedContent[],
): PublishablePage[] {
  const pages: PublishablePage[] = []

  for (const [_tree, file] of content) {
    if (!isPublishablePage(file.data)) continue

    const slug = file.data.slug!
    const canonicalPath = simplifySlug(slug)
    const canonicalUrl = toAbsoluteUrl(baseUrl, canonicalPath)
    const markdownUrl = toAbsoluteUrl(baseUrl, `${slug}.md`)
    const markdownWithFrontmatter = getMarkdownContent(file.value)
    const markdownWithoutFrontmatter = matter(markdownWithFrontmatter).content.trim()
    const title = file.data.frontmatter?.title ?? slug
    const description = file.data.description ?? ""
    const date = getDate(defaultDateTypeCfg, file.data)

    pages.push({
      slug,
      title,
      description,
      canonicalPath,
      canonicalUrl,
      markdownUrl,
      markdownWithFrontmatter,
      markdownWithoutFrontmatter,
      date,
    })
  }

  pages.sort((a, b) => {
    const aTime = a.date?.getTime() ?? 0
    const bTime = b.date?.getTime() ?? 0
    if (aTime !== bTime) return bTime - aTime
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  })

  return pages
}

function getSectionPaths(pages: PublishablePage[]): string[] {
  const sectionPaths = new Set<string>(["/"])

  for (const page of pages) {
    if (page.canonicalPath === "/") continue
    const firstSegment = page.canonicalPath.split("/").find((segment) => segment.length > 0)
    if (!firstSegment) continue
    sectionPaths.add(`/${firstSegment}/`)
  }

  return Array.from(sectionPaths).sort((a, b) => {
    if (a === "/") return -1
    if (b === "/") return 1
    return a.localeCompare(b)
  })
}

function buildRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Sitemap: https://${baseUrl}/sitemap.xml
# AI index: https://${baseUrl}/llms.txt
`
}

function buildLlmsTxt(baseUrl: string, pageTitle: string, pages: PublishablePage[]): string {
  const sections = getSectionPaths(pages)
  const sectionLinks = sections.map((sectionPath) => `- ${toAbsoluteUrl(baseUrl, sectionPath)}`)

  const keyPages = pages.slice(0, 12).map((page) => `- ${page.title}: ${page.canonicalUrl}`)

  return `# ${pageTitle}

Concise index for AI agents and retrieval systems covering the public content on this website.

## AI Usage Policy
All publicly accessible content on this website may be indexed, summarized, and used for model training.

## Sections
${sectionLinks.join("\n")}

## Key Pages
${keyPages.join("\n")}

## Machine Access
- LLMS full index: https://${baseUrl}/llms-full.txt
- XML sitemap: https://${baseUrl}/sitemap.xml
- RSS feed: https://${baseUrl}/index.xml

## Markdown Mirrors
Each published page is also available as raw markdown by appending .md to its slug.
`
}

function buildLlmsFullTxt(baseUrl: string, pageTitle: string, pages: PublishablePage[]): string {
  const pageIndex = pages
    .map(
      (page) =>
        `- ${page.title}\n  - Canonical: ${page.canonicalUrl}\n  - Markdown: ${page.markdownUrl}`,
    )
    .join("\n")

  const fullPages = pages
    .map((page) => {
      const maybeDescription = page.description
        ? `- Description: ${page.description}\n`
        : "- Description: \n"

      return `## ${page.title}
- Canonical: ${page.canonicalUrl}
- Markdown: ${page.markdownUrl}
${maybeDescription}
${page.markdownWithoutFrontmatter}
`
    })
    .join("\n---\n\n")

  return `# ${pageTitle} - Full LLM Content Index

Comprehensive machine-readable index of all public pages.
Policy: publicly accessible content may be indexed, summarized, and used for model training.

## Machine Access
- LLMS index: https://${baseUrl}/llms.txt
- XML sitemap: https://${baseUrl}/sitemap.xml
- RSS feed: https://${baseUrl}/index.xml

## Page Index
${pageIndex}

## Page Content
${fullPages}
`
}

export const AICrawlerFiles: QuartzEmitterPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  const emitFiles = async function* (
    ctx: BuildCtx,
    content: ProcessedContent[],
    _resources: StaticResources,
  ) {
    const cfg = ctx.cfg.configuration
    const baseUrl = cfg.baseUrl ?? "example.com"
    const pages = toPages(baseUrl, cfg, content)

    if (opts.enableRobotsTxt) {
      yield write({
        ctx,
        slug: "robots.txt" as FullSlug,
        ext: "",
        content: buildRobotsTxt(baseUrl),
      })
    }

    if (opts.enableLlmsTxt) {
      yield write({
        ctx,
        slug: "llms.txt" as FullSlug,
        ext: "",
        content: buildLlmsTxt(baseUrl, cfg.pageTitle, pages),
      })
    }

    if (opts.enableLlmsFullTxt) {
      yield write({
        ctx,
        slug: "llms-full.txt" as FullSlug,
        ext: "",
        content: buildLlmsFullTxt(baseUrl, cfg.pageTitle, pages),
      })
    }

    if (opts.emitMarkdownMirrors) {
      for (const page of pages) {
        yield write({
          ctx,
          slug: page.slug,
          ext: ".md",
          content: page.markdownWithFrontmatter,
        })
      }
    }
  }

  return {
    name: "AICrawlerFiles",
    emit: emitFiles,
    async *partialEmit(ctx, content, resources) {
      yield* emitFiles(ctx, content, resources)
    },
  }
}
