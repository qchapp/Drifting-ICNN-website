# Convex-Potential Drift Fields Website

Static GitHub Pages website for the CS-503 final project **Convex-Potential Drift Fields: Replacing Kernels with Input-Convex Neural Networks in Drifting Generative Models**.

## Structure

```text
.
├── index.html
├── static/
│   ├── css/styles.css
│   ├── js/main.js
│   ├── data/results.json
│   └── images/
├── .github/workflows/pages.yml
└── .nojekyll
```

## Local preview

Any static file server works. For example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

1. Push these files to the `main` branch of the GitHub Pages repository.
2. In GitHub, go to `Settings -> Pages`.
3. Set `Build and deployment -> Source` to `GitHub Actions`.
4. Each push to `main` will deploy the site.

## Updating results

- Edit `static/data/results.json` to update the metrics table and quality chart.
- Replace the figure PNGs in `static/images/` with newer exports if final experiments change.
- Keep image filenames the same unless you also update the corresponding paths in `index.html`.


## Interactive generation demo

The page includes the class-conditional MNIST generation widget from the teammate commit. Keep `static/data/NPF_MNIST_sample_bank.json` in the repository; it is intentionally not overwritten by the update bundle if it already exists. The widget can also use a live endpoint later via `window.DIGIT_GENERATION_ENDPOINT`.
