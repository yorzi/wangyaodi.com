# wangyaodi.com

Source of [www.wangyaodi.com](https://www.wangyaodi.com), the personal site of
Andy Wang, a senior Ruby on Rails and AI product engineer.

The site is static HTML with no framework, no build step and no dependencies.
Each page is a single self-contained file with its own `<style>` and
`<script>`.

## Layout

```
public/            everything that is deployed, served as the site root
  index.html       home
  oss.html         open-source work, served at /oss
  rails-maintenance.html, vibecare.html, accessibility.html   services
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
templates/post.html   starting point for a new post (not deployed)
templates/cards/      HTML sources of share cards and post images (not deployed)
bin/serve             local preview
bin/render-card       renders a card from templates/cards/ to a JPEG
bin/post-md           writes the Markdown copy of a blog post
```

Only `public/` is deployed. Files at the repository root are never served.

## Preview locally

```sh
bin/serve          # http://127.0.0.1:8000/, Ctrl-C to stop
```

It needs only Python 3. Like Cloudflare Pages, it serves `/oss` from `oss.html`
and returns `404.html` for unknown paths.

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

After publishing, announce the post on X, then set the post's "Discuss on X"
link to that X post.

Keep unpublished posts in `drafts/` at the repository root. It is
git-ignored, so drafts never become public by accident.

## Deploy

Cloudflare Pages builds from the `main` branch with no build command and
`public` as the output directory. A push to `main` goes live, and other
branches get preview URLs.

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

The background photos in `assets/bg/` are from Unsplash, under the
[Unsplash License](https://unsplash.com/license). See
`assets/bg/CREDITS.md`.

If you reuse the code, replace the content, analytics ID and contact details
with your own.
