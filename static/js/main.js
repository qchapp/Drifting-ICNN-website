const themeToggle = document.querySelector('[data-theme-toggle]');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const themeLabel = themeToggle?.querySelector('.theme-label');

function applyTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normalized;
  localStorage.setItem('theme', normalized);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', normalized === 'dark' ? '#0a1020' : '#f7f9fc');

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
  const best = Math.min(...metrics.map((metric) => metric.sw2));

  tbody.innerHTML = metrics
    .map((metric) => {
      const isBest = metric.sw2 === best;
      return `
        <tr class="${isBest ? 'best' : ''}">
          <td><strong>${metric.method}</strong></td>
          <td>${numberFormat.format(metric.sw2)}</td>
          <td>${numberFormat.format(metric.meanGap)}</td>
          <td>${numberFormat.format(metric.stdGap)}</td>
          <td>${numberFormat.format(metric.vEval)}</td>
          <td>${metric.takeaway}</td>
        </tr>
      `;
    })
    .join('');
}

function renderChart(metrics) {
  const chart = document.querySelector('#sw2-chart');
  if (!chart) return;

  const width = 720;
  const height = 360;
  const padding = { top: 28, right: 24, bottom: 74, left: 62 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...metrics.map((metric) => metric.sw2)) * 1.18;
  const barGap = 28;
  const barWidth = (innerWidth - barGap * (metrics.length - 1)) / metrics.length;

  const bars = metrics
    .map((metric, index) => {
      const barHeight = (metric.sw2 / maxValue) * innerHeight;
      const x = padding.left + index * (barWidth + barGap);
      const y = padding.top + innerHeight - barHeight;
      const label = metric.method.replace(' regression', '');
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="14" fill="url(#barGradient)" />
          <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" class="chart-value">${numberFormat.format(metric.sw2)}</text>
          <text x="${x + barWidth / 2}" y="${height - 34}" text-anchor="middle" class="chart-label">${label}</text>
        </g>
      `;
    })
    .join('');

  const ticks = [0, maxValue / 2, maxValue]
    .map((value) => {
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
      return `
        <g>
          <line x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}" class="grid-line" />
          <text x="${padding.left - 12}" y="${y + 5}" text-anchor="end" class="axis-label">${numberFormat.format(value)}</text>
        </g>
      `;
    })
    .join('');

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">SW2 squared comparison</title>
      <desc id="chart-desc">Bar chart comparing kernel drift, OT-direct, and NPF ICNN regression.</desc>
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
      <text x="20" y="24" class="axis-title">SW2² ↓</text>
    </svg>
  `;
}

loadResults()
  .then((data) => {
    renderTable(data.metrics);
    renderChart(data.metrics);
  })
  .catch((error) => {
    console.error(error);
    const chart = document.querySelector('#sw2-chart');
    if (chart) {
      chart.innerHTML = '<p class="prose">Could not load static/data/results.json. Check the file path.</p>';
    }
  });


// ── Interactive digit widget ──────────────────────────────────────────────

const SAMPLE_BANK_URL = './static/data/NPF_MNIST_sample_bank.json';
const DIGIT_GENERATION_ENDPOINT = document.querySelector('#interactive')?.dataset.generationEndpoint || window.DIGIT_GENERATION_ENDPOINT || '';

async function loadSampleBank() {
  const response = await fetch(`${SAMPLE_BANK_URL}?v=2`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${SAMPLE_BANK_URL}: ${response.status}`);
  return response.json();
}

async function generateDigitSample(digit) {
  if (!DIGIT_GENERATION_ENDPOINT) return null;

  const response = await fetch(DIGIT_GENERATION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ digit: Number(digit) }),
  });

  if (!response.ok) {
    throw new Error(`Could not generate digit ${digit}: ${response.status}`);
  }

  const payload = await response.json();
  const imageUrl = payload.imageUrl || payload.image || payload.dataUrl || payload.sample || null;
  if (!imageUrl) {
    throw new Error('Generation endpoint returned no image URL or data URI.');
  }

  return {
    imageUrl,
    caption: payload.caption || `Generated digit ${digit}`,
  };
}

function initWidget(sampleBank) {
  const selector  = document.querySelector('.digit-selector');
  const btnGen    = document.getElementById('btn-generate');
  const output    = document.getElementById('widget-output');
  const caption   = document.getElementById('widget-caption');

  if (!selector || !btnGen || !output) return;

  const placeholder = output.querySelector('.output-placeholder');
  let selectedDigit = null;
  let isGenerating = false;
  // Track which index was last shown per digit so we never repeat twice in a row
  const lastShown = {};

  function setOutputMessage(message) {
    output.innerHTML = '';
    const messageNode = document.createElement('div');
    messageNode.className = 'output-placeholder';
    messageNode.textContent = message;
    output.appendChild(messageNode);
  }

  function setCaption(text) {
    if (caption) {
      caption.textContent = text;
    }
  }

  function renderImage(imageUrl, altText, captionText) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = altText;
    output.innerHTML = '';
    output.appendChild(img);
    setCaption(captionText);
  }

  function updateButtonState() {
    btnGen.disabled = selectedDigit === null || isGenerating;
    btnGen.textContent = isGenerating ? 'Generating...' : 'Generate';
  }

  // Build digit buttons 0-9
  for (let d = 0; d <= 9; d++) {
    const btn = document.createElement('button');
    btn.className = 'digit-btn';
    btn.textContent = String(d);
    btn.setAttribute('aria-label', `Select digit ${d}`);
    btn.addEventListener('click', () => {
      selector.querySelectorAll('.digit-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDigit = d;
      updateButtonState();
    });
    selector.appendChild(btn);
  }

  if (placeholder) {
    placeholder.textContent = DIGIT_GENERATION_ENDPOINT
      ? 'Select a digit and generate a live sample.'
      : 'Select a digit and click Generate.';
  }

  updateButtonState();

  btnGen.addEventListener('click', async () => {
    if (selectedDigit === null) return;

    isGenerating = true;
    updateButtonState();

    try {
      if (DIGIT_GENERATION_ENDPOINT) {
        try {
          const liveSample = await generateDigitSample(selectedDigit);
          if (liveSample) {
            renderImage(liveSample.imageUrl, `Generated image of digit ${selectedDigit}`, liveSample.caption);
            return;
          }
        } catch (error) {
          console.warn('Live generation failed, falling back to the pre-generated bank.', error);
        }
      }

      const pool = sampleBank[String(selectedDigit)] || sampleBank[selectedDigit];
      if (!pool || pool.length === 0) {
        throw new Error(`No samples available for digit ${selectedDigit}.`);
      }

      // Pick a random index different from the last one shown.
      let idx;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (pool.length > 1 && idx === lastShown[selectedDigit]);
      lastShown[selectedDigit] = idx;

      renderImage(
        pool[idx],
        `Pre-generated sample of digit ${selectedDigit}`,
        `Sample ${idx + 1} / ${pool.length} — digit "${selectedDigit}" — NPF / ICNN conditional generator`
      );
    } catch (error) {
      console.error(error);
      setOutputMessage('Could not generate a sample. Check the data path or generation endpoint.');
      setCaption('');
    } finally {
      isGenerating = false;
      updateButtonState();
    }
  });
}

loadSampleBank()
  .then(initWidget)
  .catch(err => {
    console.warn('Sample bank not available:', err);
    const placeholder = document.querySelector('.output-placeholder');
    if (placeholder) placeholder.textContent = 'Sample bank not yet available.';
  });