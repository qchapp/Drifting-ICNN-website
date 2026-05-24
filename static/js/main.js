const themeToggle = document.querySelector('[data-theme-toggle]');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const themeLabel = themeToggle?.querySelector('.theme-label');

function applyTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normalized;
  localStorage.setItem('theme', normalized);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', normalized === 'dark' ? '#0a1020' : '#f7f9fc');

  if (themeToggle && themeIcon && themeLabel) {
    const nextTheme = normalized === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    themeIcon.textContent = normalized === 'dark' ? '☀' : '☾';
    themeLabel.textContent = normalized === 'dark' ? 'Light' : 'Dark';
  }
}

applyTheme(localStorage.getItem('theme') || document.documentElement.dataset.theme || 'light');

themeToggle?.addEventListener('click', () => {
  const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

const numberFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
});

const compactFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 3,
});

const header = document.querySelector('[data-scroll-shadow]');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

function updateHeaderShadow() {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
}

window.addEventListener('scroll', updateHeaderShadow, { passive: true });
updateHeaderShadow();

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

async function loadResults() {
  const response = await fetch('./static/data/results.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load results: ${response.status}`);
  return response.json();
}

function renderTable(metrics) {
  const tbody = document.querySelector('#metrics-table tbody');
  if (!tbody) return;

  const bestSw2 = Math.min(...metrics.map((metric) => metric.sw2));

  tbody.innerHTML = metrics
    .map((metric) => {
      const isBest = metric.sw2 === bestSw2;
      return `
        <tr class="${isBest ? 'best' : ''}">
          <td><strong>${metric.method}</strong></td>
          <td>${numberFormat.format(metric.sw2)}</td>
          <td>${compactFormat.format(metric.classW2)}</td>
          <td>${compactFormat.format(metric.featureFid)}</td>
          <td>${compactFormat.format(metric.classAccuracy)}</td>
          <td>${compactFormat.format(metric.minClassAccuracy)}</td>
          <td>${numberFormat.format(metric.latentStdGap)}</td>
          <td>${compactFormat.format(metric.runtimeSeconds)}</td>
          <td>${metric.takeaway}</td>
        </tr>
      `;
    })
    .join('');
}

function renderQualityChart(metrics) {
  const chart = document.querySelector('#quality-chart');
  if (!chart) return;

  const width = 720;
  const height = 360;
  const padding = { top: 30, right: 24, bottom: 74, left: 62 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = 1;
  const barGap = 28;
  const barWidth = (innerWidth - barGap * (metrics.length - 1)) / metrics.length;

  const bars = metrics
    .map((metric, index) => {
      const barHeight = (metric.qualityScore / maxValue) * innerHeight;
      const x = padding.left + index * (barWidth + barGap);
      const y = padding.top + innerHeight - barHeight;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="14" fill="url(#barGradient)" />
          <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" class="chart-value">${compactFormat.format(metric.qualityScore)}</text>
          <text x="${x + barWidth / 2}" y="${height - 34}" text-anchor="middle" class="chart-label">${metric.method}</text>
        </g>
      `;
    })
    .join('');

  const ticks = [0, 0.5, 1]
    .map((value) => {
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
      return `
        <g>
          <line x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}" class="grid-line" />
          <text x="${padding.left - 12}" y="${y + 5}" text-anchor="end" class="axis-label">${compactFormat.format(value)}</text>
        </g>
      `;
    })
    .join('');

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">Mean normalized quality score</title>
      <desc id="chart-desc">Bar chart comparing Kernel, OT-direct, and CCNPF mean normalized quality scores.</desc>
      <defs>
        <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" />
          <stop offset="100%" stop-color="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="22" fill="var(--chart-surface)" />
      ${ticks}
      <line x1="${padding.left}" x2="${padding.left}" y1="${padding.top}" y2="${padding.top + innerHeight}" class="axis-line" />
      <line x1="${padding.left}" x2="${width - padding.right}" y1="${padding.top + innerHeight}" y2="${padding.top + innerHeight}" class="axis-line" />
      ${bars}
      <text x="20" y="24" class="axis-title">Quality ↑</text>
    </svg>
  `;
}

loadResults()
  .then((data) => {
    renderTable(data.metrics);
    renderQualityChart(data.metrics);
  })
  .catch((error) => {
    console.error(error);
    const chart = document.querySelector('#quality-chart');
    if (chart) {
      chart.innerHTML = '<p class="prose">Could not load static/data/results.json. Check the file path.</p>';
    }
  });
