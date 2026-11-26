# wangyaodi.com

Source of [www.wangyaodi.com](https://www.wangyaodi.com), the personal site of
Andy Wang, a senior Ruby on Rails and AI product engineer.

The site is static HTML with no framework, no build step and no dependencies.
Top-level pages keep styles and scripts inline. The blog pages share `blog.css` and `blog.js`.

## Layout

```
public/            everything that is deployed, served as the site root
  index.html       home
  hire-me.html     target roles, remote logistics and hiring/services overview, served at /hire-me
  oss.html         open-source work, served at /oss
  ai-audits.html, rails-maintenance.html, accessibility.html  services
  _redirects       Cloudflare Pages redirects (/vibecare -> /ai-audits)
  products.html    products (not linked from the nav yet)
  blog/            the blog, served at /blog/
    index.html     list of posts (newest first)
    <slug>.html    one file per post, served at /blog/<slug>
    <slug>.md      its Markdown copy for AI tools, made by bin/post-md
    blog.css       shared styles for the blog pages
    blog.js        shared script for the blog pages
    feed.xml       Atom feed
  404.html         not-found page
  _headers         Cloudflare Pages response headers
  robots.txt, sitemap.xml, llms.txt, llms-full.txt
  assets/          images (background photo credits in assets/bg/CREDITS.md)
  share/           files meant to be linked, such as the resume PDF
data/oss.yml           the open-source record: every merged upstream PR
templates/post.html   starting point for a new post (not deployed)
templates/cards/      HTML sources of share cards and post images (not deployed)
bin/serve             local preview
bin/render-card       renders a card from templates/cards/ to a JPEG
bin/post-md           writes the Markdown copy of a blog post
bin/oss-sync          refreshes data/oss.yml from GitHub and rebuilds the OSS sections
bin/check-site        checks that pages, posts, sitemap, feed and LLM files agree
```

Only `public/` is deployed. Files at the repository root are never served.

## Preview locally

```sh
bin/serve          # http://127.0.0.1:8000/, Ctrl-C to stop
```

It needs only Python 3. Like Cloudflare Pages, it serves `/oss` from `oss.html`
and returns `404.html` for unknown paths. The preview also applies the exact redirects in `public/_redirects` and redirects public HTML filenames to clean URLs.

## Write a blog post

Posts are written with AI from real work, and every post shows it. Each one
follows the same pattern, which `templates/post.html` already contains:

- **Head.** The meta row reads: date, reading time, "Written with AI", then
  plain hashtags such as `#Ruby #MCP`. Below it the title and dek on the
  left, and on wide screens the reading-mode switch on the right, in line
  with the title.
- **How it was made.** The "Written with AI" link in the meta row (its title
  holds the one-line provenance) jumps to a closing "How this post was made" section that names the sources, what AI drafted and with
  which tool, what was checked against the sources, and who reviewed it.
- **Read this with an AI.** A closing section with a Markdown copy of the
  post (same address plus `.md`), "Ask Claude" and "Ask ChatGPT" links,
  "Copy as Markdown", and a few prompts a reader can paste into a chat or a
  coding agent.
- **Full post or Brief.** One switch, at the top right beside the title,
  changes the reading mode. Brief keeps only what carries the main
  ideas: headings, figures and charts, `.facts`, `.lesson` boxes, the
  `p.brief-only` "In short" key point each `h2` section should have, and any
  block marked `data-brief`. Each button shows its own reading time; the
  choice is remembered per browser, and `?read=brief` links straight to the
  brief. `bin/post-md` turns the key points into "In short:" lines.
- **Contents rail.** `blog.js` builds the contents from every `h2`/`h3` with
  an `id`, so give each one an id. From 1120px wide the rail is a sticky
  column on the right, with the share and AI links under it; on narrow
  screens the contents fold into an "On this page" box above the text.
- **Discussion on X, not email.** The post ends with the author, a "Talk
  about this post on X" card and Share on X / LinkedIn. "Discuss on X"
  opens a reply to @yorzi with the post link until the post is announced on
  X; then point it at that X post and label it "Reply to the thread".
- **References.** Sources and links go in a closing "References" section,
  not in the head.
- **Images that travel.** Every post has its own 1200×630 share card, and a
  long post can add a one-image summary (4:5, 1200×1500) near the top, made
  to be saved and shared.

Steps:

1. Copy `templates/post.html` to `public/blog/<slug>.html`. Use a short
   lowercase slug with hyphens, such as `rails-upgrade-checklist`.
2. Replace the `POST_*` placeholders (the template's top comment lists them).
3. Write the article in plain HTML inside `<div class="prose">`: `p`, `h2`,
   `h3`, `ul`/`ol`, `blockquote`, `pre><code`, `figure` with `figcaption`,
   `table`, footnotes. The template's sample body shows each of these. Put
   images in `public/assets/blog/<slug>/`, resized to at most 1600px wide.
   Diagrams and charts are inline SVG in `<figure class="diagram">`, styled
   by the POST FIGURES classes in `blog.css` so they follow the theme. Give
   each SVG a `<title>` and a `<desc>` that says what it shows: the Markdown
   copy uses them in place of the drawing. See
   `public/blog/learning-mcp-by-fixing-rubyllm.html` for examples.
4. Make the images from HTML sources in `templates/cards/` (not deployed;
   `card.css` holds the shared look):

   ```sh
   bin/render-card templates/cards/<slug>-og.html public/assets/og/blog-<slug>.jpg 1200x630
   bin/render-card templates/cards/<slug>-summary.html public/assets/blog/<slug>/summary.jpg 1200x1500
   ```

   It uses headless Google Chrome and macOS `sips`. Re-render a card when
   the headline or the numbers on it change.
5. Write the Markdown copy with `bin/post-md public/blog/<slug>.html`. Run it
   again after every change to the post; never edit the `.md` by hand.
6. Preview it at `http://127.0.0.1:8000/blog/<slug>`. The blank template is
   at `/_templates/post`.

Publish a post by adding it to the blog's lists, then pushing to `main`:

- `public/blog/index.html`: a `<li>` at the top of `.post-list`, plus an
  entry in the JSON-LD `blogPost` array.
- `public/blog/feed.xml`: an `<entry>`, and update the feed's `<updated>`.
- `public/sitemap.xml`: the post URL (not the `.md` copy).
- `public/llms.txt`: a line in the Blog section that links the `.md` copy.

Then run `bin/check-site` (below) before pushing.

After publishing, announce the post on X, then set the post's "Discuss on X"
link to that X post.

Keep unpublished posts in `drafts/` at the repository root. It is
git-ignored, so drafts never become public by accident.

## Refresh the open-source page

`data/oss.yml` is the record behind `/oss`: one block per upstream project,
one entry per pull request that project's maintainers merged. Nothing in the
numbers or lists is hand-written; `bin/oss-sync` reads the file and rewrites
the generated parts of `public/index.html`, `public/oss.html`, `public/llms.txt`,
`public/llms-full.txt` and the affected sitemap dates. The homepage date advances when its contribution summary changes.

```sh
bin/oss-sync            # fetch new merged PRs from GitHub, then rebuild
bin/oss-sync --render   # rebuild only, from data/oss.yml (no network)
bin/oss-sync --check    # fail if the files and the record disagree
```

The fetch uses `gh`, keeps public repositories only, and leaves out the
author's own repositories and anything listed under `meta.excluded_repos` or
`meta.excluded_prs` (`owner/repo#123`). A pull request merged by the author
into someone else's repository is reported so it can be excluded by hand.
The sync checks that every search page is complete and the distinct PR count matches GitHub's total before it removes records.

The page shows projects with four or more merged PRs as rows, each with its
featured PRs in place (or the newest five) and an "All N on GitHub" link to
that repository's merged-PR filter. Smaller projects share an "Other
projects" table (project, what was merged, year, a link to the GitHub
filter), followed by one GitHub search link across all of them. The top of
the page shows the stats. The homepage shows a generated contribution count in Background and links to `/oss`. Each project item is generated one per line, so a weekly
refresh reads as a small `git diff`.

To change how something reads, edit `data/oss.yml` and run
`bin/oss-sync --render`:

- `featured: true` on a pull request shows it in place on its project and
  uses it as an example in `llms-full.txt`. Keep about three to five per
  large project; the rest are linked on GitHub.
- `summary:` rewords one pull request. Without it the upstream PR title is
  used, cleaned of `fix(scope):` prefixes. Text in backticks renders as code.
- `name:` and `about:` describe a project; `about` defaults to the GitHub
  repository description.
- `meta.description` (the share description) and `meta.llms_intro` (the
  `llms-full.txt` summary) take `{total}`, `{projects}`, `{first}` and
  `{second}`.
- Projects are ordered by merged count, so a new project needs no placement.

Then run `bin/check-site` and push. `bin/check-site` also runs
`bin/oss-sync --check`, so a page that was edited by hand, or a record that
was not re-rendered, fails before it ships.

## Check before pushing

```sh
bin/check-site
```

Run it after adding a page or post or changing copy. It fails on errors and
prints warnings, and the same check runs in GitHub Actions on every push. It
checks that:

- every page's canonical, `og:url`, share image and JSON-LD match its clean
  URL and files that exist
- the GA4 tag loads only on `https://www.wangyaodi.com` and sets a
  `content_group` on every page and in the post template
- every internal link and `#fragment` resolves
- `robots.txt` advertises the canonical sitemap and permits Googlebot and
  Bingbot to crawl its entries. The sitemap is valid XML and covers the
  indexable pages, with a warning for stale `lastmod` dates
- every post is in the blog index list and JSON-LD, `feed.xml`, `sitemap.xml`
  and `llms.txt`, has its share card, and its `.md` copy is current
- `data/oss.yml`, `oss.html`, `llms.txt` and `llms-full.txt` agree
  (`bin/oss-sync --check`)
- no page or LLM file shows a price, and `drafts/` is not tracked

## Search and analytics

Google Search Console uses the URL-prefix property `https://www.wangyaodi.com/`.
Keep the `google-site-verification` meta tag in the homepage head. The sitemap
is `https://www.wangyaodi.com/sitemap.xml`. When a page's content changes,
update its `lastmod`. Check the Sitemaps report for fetch errors and use URL
Inspection for individual pages.

GA4 uses the `wangyaodi.com` property (`504669281`) and web measurement ID
`G-10DB1YDXR8`. The `generate_lead` key event measures contact intent. A mail link click sends `lead_source=email`; a successful clipboard copy sends `lead_source=email_copy`. Both carry the site-defined `lead_topic`. Actual enquiries are counted from messages received.

## Deploy

Cloudflare Pages builds from the `main` branch with no build command and
`public` as the output directory. A push to `main` goes live, and other
branches get preview URLs. The deploy check waits for Cloudflare Pages to succeed for the pushed commit, then checks the new pages, legacy service redirects and a missing URL on the production host.

Pages serves clean URLs: `/oss.html` redirects to `/oss`, and the blog index
lives at `/blog/` (with the slash). Use the clean form in links, canonical
tags, Open Graph tags, JSON-LD, `sitemap.xml` and `feed.xml`.

## License

The source code (HTML structure, CSS, JavaScript and configuration) is under
the [MIT License](LICENSE).

The content is not. All rights are reserved for:

- the writing on every page and in `llms.txt` / `llms-full.txt`
- photos and portraits of Andy Wang (`assets/andy.jpeg`, `assets/portraits/`)
- the resume (`public/share/`) and the share images (`assets/og/`)
- the testimonial quotes, which belong to their authors

Six background photographs use the [Unsplash License](https://unsplash.com/license). The Hire me and blog index backgrounds were AI-generated for this site. Per-image credits are in `assets/bg/CREDITS.md`.

If you reuse the code, replace the content, analytics ID and contact details
with your own.
