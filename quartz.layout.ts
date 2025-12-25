import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      sortFn: (a, b) => {
        // Folders first, then files
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        // Both folders: alphabetical
        if (a.isFolder && b.isFolder) {
          return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
        }
        // Both files: sort by date (newest first)
        const dateA = a.data?.date ? new Date(a.data.date).getTime() : 0
        const dateB = b.data?.date ? new Date(b.data.date).getTime() : 0
        return dateB - dateA
      },
    }),
    Component.RecentNotes({
      title: "Recent Updates",
      limit: 3,
      filter: (f) => !f.slug!.startsWith("tags/") && f.slug! !== "index" && !f.frontmatter?.noindex,
      linkToMore: false,
      showTags: false,
    }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      sortFn: (a, b) => {
        // Folders first, then files
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        // Both folders: alphabetical
        if (a.isFolder && b.isFolder) {
          return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
        }
        // Both files: sort by date (newest first)
        const dateA = a.data?.date ? new Date(a.data.date).getTime() : 0
        const dateB = b.data?.date ? new Date(b.data.date).getTime() : 0
        return dateB - dateA
      },
    }),
    Component.RecentNotes({
      title: "Recent Updates",
      limit: 3,
      filter: (f) => !f.slug!.startsWith("tags/") && f.slug! !== "index" && !f.frontmatter?.noindex,
      linkToMore: false,
      showTags: false,
    }),
  ],
  right: [],
}
