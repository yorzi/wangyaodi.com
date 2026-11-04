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
  404.html         not-found page
  _headers         Cloudflare Pages response headers
  robots.txt, sitemap.xml, llms.txt, llms-full.txt
  assets/          images (background photo credits in assets/bg/CREDITS.md)
  share/           files meant to be linked, such as the resume PDF
bin/serve          local preview
```

Only `public/` is deployed. Files at the repository root are never served.

## Preview locally

```sh
bin/serve          # http://127.0.0.1:8000/, Ctrl-C to stop
```

It needs only Python 3. Like Cloudflare Pages, it serves `/oss` from `oss.html`
and returns `404.html` for unknown paths.

## Deploy

Cloudflare Pages builds from the `main` branch with no build command and
`public` as the output directory. A push to `main` goes live, and other
branches get preview URLs.

Pages serves clean URLs: `/oss.html` redirects to `/oss`. Use the clean form in
links, canonical tags, Open Graph tags, JSON-LD and `sitemap.xml`.

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
