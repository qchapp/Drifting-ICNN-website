# Convex-Potential Drift Fields website

Static website for the CS-503 final project page.

Live site after deployment:

```text
https://qchapp.github.io/Drifting-ICNN-website/
```

Research code repository:

```text
https://github.com/alirezaabdollahpour/Drifting-ICNN
```

## Local preview

Because the page loads `static/data/results.json`, use a local server instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy on GitHub Pages

This repo includes `.github/workflows/pages.yml`. Push to `main`, then set:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

The workflow deploys the full static site from the repository root.

## What to edit

- `index.html`: project text, links, team contributions.
- `static/data/results.json`: metric values used by the table and bar chart.
- `static/images/*.svg`: replace placeholders with final PNG/SVG figures or update paths in `index.html`.
- `static/css/styles.css`: visual style.
- `static/js/main.js`: nav behavior, chart rendering, result-table rendering.

## Theme

The site defaults to the light theme. Visitors can switch between light and dark mode with the toggle in the navigation bar; their choice is saved in `localStorage`.

