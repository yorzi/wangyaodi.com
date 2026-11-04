# wangyaodi.com

Source of [www.wangyaodi.com](https://www.wangyaodi.com), the personal site of
Andy Wang, a senior Ruby on Rails and AI product engineer.

The site is hand-written static HTML. There is no framework, no build step and
no dependencies. Each page is a single self-contained file with its own
`<style>` and `<script>`.

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
    blog.css       shared styles for the blog pages
    blog.js        shared script for the blog pages
    feed.xml       Atom feed
  404.html         not-found page
  _headers         Cloudflare Pages response headers
  robots.txt, sitemap.xml, llms.txt, llms-full.txt
  assets/          images (background photo credits in assets/bg/CREDITS.md)
  share/           files meant to be linked, such as the resume PDF
templates/post.html   starting point for a new post (not deployed)
bin/serve             local preview
```

Only `public/` is deployed. Files at the repository root are never served.

## Preview locally

```sh
bin/serve          # http://127.0.0.1:8000/, Ctrl-C to stop
```

It needs only Python 3. Like Cloudflare Pages, it serves `/oss` from `oss.html`
and returns `404.html` for unknown paths.

## Write a blog post

1. Copy `templates/post.html` to `public/blog/<slug>.html`. Use a short
   lowercase slug with hyphens, such as `rails-upgrade-checklist`.
2. Replace the `POST_*` placeholders in the head and header: title,
   description, slug and date.
3. Write the article in plain HTML inside `<div class="prose">`: `p`, `h2`,
   `h3`, `ul`/`ol`, `blockquote`, `pre><code`, `figure` with `figcaption`,
   `table`, footnotes. The template's sample body shows each of these. Put
   images in `public/assets/blog/<slug>/`, resized to at most 1600px wide.
4. Preview it at `http://127.0.0.1:8000/blog/<slug>`. The blank template is
   at `/_templates/post`.

Publish a post by adding it to the blog's lists, then pushing to `main`:

- `public/blog/index.html`: a `<li>` at the top of `.post-list` (and, for the
  first post, remove the "First posts are on the way" box), plus an entry in
  the JSON-LD `blogPost` array.
- `public/blog/feed.xml`: an `<entry>`, and update the feed's `<updated>`.
- `public/sitemap.xml`: the post URL, and `/blog/` itself with the first post.
- `public/llms.txt`: a line for the post (and a Blog section with the first
  post).

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
