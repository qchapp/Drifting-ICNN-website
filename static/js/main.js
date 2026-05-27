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

// ── Interactive digit widget ──────────────────────────────────────────────

const SAMPLE_BANK_URL = './static/data/NPF_MNIST_sample_bank.json';
const interactiveSection = document.querySelector('#interactive');
const DIGIT_GENERATION_ENDPOINT = interactiveSection?.dataset.generationEndpoint || window.DIGIT_GENERATION_ENDPOINT || '';
const DIGIT_GENERATION_METHOD = interactiveSection?.dataset.generationMethod || window.DIGIT_GENERATION_METHOD || 'npf';
const MODEL_ORDER = ['kernel', 'ot_direct', 'npf'];

function formatMethodLabel(method) {
  if (method === 'ot_direct') return 'OT-direct';
  if (method === 'npf') return 'CCNPF';
  if (method === 'kernel') return 'Kernel';
  return method;
}

function normalizeGenerationEndpoint(endpoint) {
  const trimmedEndpoint = endpoint.trim();
  if (!trimmedEndpoint) return '';

  try {
    const parsedUrl = new URL(trimmedEndpoint, window.location.href);

    if (parsedUrl.hostname === 'huggingface.co' && parsedUrl.pathname.startsWith('/spaces/')) {
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const owner = parts[1];
      const spaceName = parts[2];
      if (owner && spaceName) {
        return `https://${owner.toLowerCase()}-${spaceName.toLowerCase()}.hf.space`;
      }
    }

    return parsedUrl.origin;
  } catch {
    return trimmedEndpoint.replace(/\/$/, '');
  }
}

function getLiveGenerationUrl(digit) {
  if (!DIGIT_GENERATION_ENDPOINT) return null;

  const normalizedEndpoint = normalizeGenerationEndpoint(DIGIT_GENERATION_ENDPOINT);
  if (!normalizedEndpoint) return null;

  const baseUrl = normalizedEndpoint.endsWith('/generate')
    ? normalizedEndpoint
    : `${normalizedEndpoint.replace(/\/$/, '')}/generate`;

  const url = new URL(baseUrl, window.location.href);
  url.searchParams.set('label', String(Number(digit)));
  url.searchParams.set('n_samples', '1');
  url.searchParams.set('t', String(Date.now()));
  return url;
}

async function loadSampleBank() {
  const response = await fetch(`${SAMPLE_BANK_URL}?v=2`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${SAMPLE_BANK_URL}: ${response.status}`);
  return response.json();
}

async function generateDigitSample(digit) {
  const requestUrl = getLiveGenerationUrl(digit);
  if (!requestUrl) return null;

  const response = await fetch(requestUrl, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Could not generate digit ${digit}: ${response.status}`);
  }

  const payload = await response.json();
  const samples = MODEL_ORDER.map((method) => {
    const methodPayload = payload?.[method] || null;
    if (!methodPayload) return null;

    const imageUrl = methodPayload.image || methodPayload.imageUrl || methodPayload.dataUrl || methodPayload.sample || null;
    if (!imageUrl) return null;

    return {
      method,
      imageUrl,
      metrics: {
        inferenceMs: methodPayload.inference_ms,
        clfConfidence: methodPayload.clf_confidence,
        clfPrediction: methodPayload.clf_prediction,
        correct: methodPayload.correct,
      },
    };
  }).filter(Boolean);

  if (samples.length === 0) {
    throw new Error('Generation endpoint returned no renderable method payloads.');
  }

  return {
    samples,
    caption: `Live comparison for digit ${digit}`,
  };
}

function initWidget(sampleBankState = { data: {}, loaded: false, error: null }) {
  const selector  = document.querySelector('.digit-selector');
  const btnGen    = document.getElementById('btn-generate');
  const output    = document.getElementById('widget-output');
  const caption   = document.getElementById('widget-caption');

  if (!selector || !btnGen || !output) return;

  // Avoid duplicating buttons if the script is loaded twice during local previews.
  selector.innerHTML = '';

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
    output.dataset.state = 'placeholder';
  }

  function renderMetricEntries(metricData) {
    const confidence = typeof metricData.clfConfidence === 'number'
      ? `${(metricData.clfConfidence * 100).toFixed(1)}%`
      : 'n/a';
    const inferenceMs = typeof metricData.inferenceMs === 'number'
      ? `${metricData.inferenceMs.toFixed(1)} ms`
      : 'n/a';
    const prediction = Number.isFinite(metricData.clfPrediction)
      ? String(metricData.clfPrediction)
      : 'n/a';
    const correct = typeof metricData.correct === 'boolean'
      ? (metricData.correct ? 'yes' : 'no')
      : 'n/a';

    return `
      <div class="widget-metric"><span>Inference</span><strong>${inferenceMs}</strong></div>
      <div class="widget-metric"><span>Confidence</span><strong>${confidence}</strong></div>
      <div class="widget-metric"><span>Prediction</span><strong>${prediction}</strong></div>
      <div class="widget-metric"><span>Correct</span><strong>${correct}</strong></div>
    `;
  }

  function setCaption(text) {
    if (caption) {
      caption.textContent = text;
    }
  }

  function renderComparison(samples, digit) {
    output.innerHTML = '';
    output.dataset.state = 'comparison';

    const grid = document.createElement('div');
    grid.className = 'comparison-grid';

    samples.forEach(({ method, imageUrl, metrics: metricData }) => {
      const card = document.createElement('article');
      card.className = `comparison-card comparison-card--${method}`;
      card.innerHTML = `
        <div class="comparison-card-head">
          <span class="comparison-badge">${formatMethodLabel(method)}</span>
          <p>Live sample for digit ${digit}</p>
        </div>
        <img src="${imageUrl}" alt="${formatMethodLabel(method)} generated image of digit ${digit}" />
        <div class="comparison-metrics">
          ${renderMetricEntries(metricData)}
        </div>
      `;
      grid.appendChild(card);
    });

    output.appendChild(grid);
    setCaption('Live comparison across Kernel, OT-direct, and CCNPF.');
  }

  function renderFallbackSample(imageUrl, digit, captionText) {
    output.innerHTML = '';
    output.dataset.state = 'fallback';

    const card = document.createElement('article');
    card.className = 'comparison-card comparison-card--fallback';
    card.innerHTML = `
      <div class="comparison-card-head">
        <span class="comparison-badge">Fallback sample</span>
        <p>Saved digit ${digit} sample</p>
      </div>
      <img src="${imageUrl}" alt="Saved fallback sample of digit ${digit}" />
      <div class="comparison-metrics">
        <p class="widget-metrics-note">Live metrics are unavailable for saved samples.</p>
      </div>
    `;

    output.appendChild(card);
    setCaption(captionText);
  }

  function updateButtonState() {
    btnGen.disabled = selectedDigit === null || isGenerating;
    btnGen.textContent = isGenerating ? 'Generating...' : 'Generate sample';
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
      ? `Select a digit and generate a live ${DIGIT_GENERATION_METHOD.toUpperCase()} sample.`
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
            renderComparison(liveSample.samples, selectedDigit);
            return;
          }
        } catch (error) {
          console.warn('Live generation failed, falling back to the pre-generated bank.', error);
          setOutputMessage(`Live generation failed (${error.message}). Showing a saved fallback sample.`);
          setCaption('The Space responded with an error, so the widget is using the saved bank instead.');
        }
      }

      const sampleBank = sampleBankState.data || {};
      const pool = sampleBank[String(selectedDigit)] || sampleBank[selectedDigit];
      if (!pool || pool.length === 0) {
        if (!sampleBankState.loaded && !sampleBankState.error) {
          setOutputMessage('The sample bank is still loading. Please try again in a moment.');
          setCaption('Waiting for static/data/NPF_MNIST_sample_bank.json');
          return;
        }
        if (sampleBankState.error) {
          setOutputMessage('Sample bank not found. Keep static/data/NPF_MNIST_sample_bank.json in the repo.');
          setCaption('The controls are working, but the pre-generated samples are missing.');
          return;
        }
        throw new Error(`No samples available for digit ${selectedDigit}.`);
      }

      // Pick a random index different from the last one shown.
      let idx;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (pool.length > 1 && idx === lastShown[selectedDigit]);
      lastShown[selectedDigit] = idx;

      renderFallbackSample(
        pool[idx],
        selectedDigit,
        `Saved sample ${idx + 1} / ${pool.length} — digit "${selectedDigit}" — CCNPF / ICNN conditional generator`
      );
    } catch (error) {
      console.error(error);
      setOutputMessage('Could not generate a sample. Check the live endpoint or the fallback data path.');
      setCaption('');
    } finally {
      isGenerating = false;
      updateButtonState();
    }
  });
}

const sampleBankState = { data: {}, loaded: false, error: null };

// Build the UI immediately. The previous version only created the digit
// buttons after the JSON bank loaded, so a missing/slow sample-bank request
// made the widget look broken and left only a disabled Generate button.
initWidget(sampleBankState);

loadSampleBank()
  .then((data) => {
    sampleBankState.data = data || {};
    sampleBankState.loaded = true;
    sampleBankState.error = null;
    const caption = document.getElementById('widget-caption');
    if (caption) caption.textContent = 'Ready: select a digit, then generate a pre-computed CCNPF/ICNN sample.';
  })
  .catch(err => {
    console.warn('Sample bank not available:', err);
    sampleBankState.loaded = false;
    sampleBankState.error = err;
    const placeholder = document.querySelector('.output-placeholder');
    if (placeholder) placeholder.textContent = 'Select a digit. Samples need static/data/NPF_MNIST_sample_bank.json.';
    const caption = document.getElementById('widget-caption');
    if (caption) caption.textContent = 'Missing sample bank: restore the JSON file from the generation-widget commit.';
  });
