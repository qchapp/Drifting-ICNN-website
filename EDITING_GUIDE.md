# Editing guide

## 1. Update repository links

In `index.html`, search for:

```html
https://github.com/qchapp/Drifting-ICNN
```

Change it if your website repo lives elsewhere.

## 2. Replace placeholder figures

The page currently uses:

```text
static/images/mnist-samples-placeholder.svg
static/images/ablation-placeholder.svg
static/images/method-diagram.svg
```

You can either replace those files directly or update the `<img src="...">` paths in `index.html`.

Recommended final figure names:

```text
static/images/mnist-samples-final.png
static/images/convergence-sw2.png
static/images/ablation-heatmap.png
static/images/final-samples-grid.png
```

## 3. Update final metrics

Edit:

```text
static/data/results.json
```

The JavaScript automatically updates the table and the SW2² chart from that file.

## 4. Edit the team section

In `index.html`, search for:

```text
Edit contribution.
```

Replace each placeholder with the final individual contribution.

## 5. Add the final report link

If you commit your final PDF to the repo, for example:

```text
static/reports/final_report.pdf
```

Add a button in the hero section:

```html
<a class="button ghost" href="./static/reports/final_report.pdf">Final report</a>
```

## Theme

The site defaults to the light theme. Visitors can switch between light and dark mode with the toggle in the navigation bar; their choice is saved in `localStorage`.

