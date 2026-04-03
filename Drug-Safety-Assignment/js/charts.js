// charts.js — Chart rendering using Chart.js

import { formatNumber, getDrugColor, getDrugColorLight, groupByYear, mapSex } from './utils.js';

/**
 * Destroy an existing chart on a canvas if present.
 */
function clearChart(canvas) {
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
}

/**
 * Donut chart: serious vs non-serious reports.
 */
export function renderDonutChart(canvas, seriousness) {
  clearChart(canvas);
  const { serious, nonSerious } = seriousness;
  if (!serious && !nonSerious) return null;
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Serious', 'Non-Serious'],
      datasets: [{
        data: [serious, nonSerious],
        backgroundColor: ['#B91C1C', '#0D7377'],
        borderWidth: 2,
        borderColor: '#FAFAF7',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'Source Sans 3', sans-serif", size: 13 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatNumber(ctx.raw)} reports`
          }
        }
      }
    }
  });
}

/**
 * Horizontal bar chart: seriousness breakdown.
 */
export function renderSeriousnessBar(canvas, breakdown, total) {
  clearChart(canvas);
  const labels = ['Death', 'Hospitalization', 'Life-Threatening', 'Disabling'];
  const keys = ['seriousnessdeath', 'seriousnesshospitalization', 'seriousnesslifethreatening', 'seriousnessdisabling'];
  const data = keys.map(k => breakdown[k] || 0);
  const colors = ['#B91C1C', '#D97706', '#CA8A04', '#475569'];

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : '?';
              return `${formatNumber(ctx.raw)} reports (${pct}% of total)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: '#E5E5E0' }, ticks: { font: { family: "'Source Sans 3', sans-serif" } } },
        y: { grid: { display: false }, ticks: { font: { family: "'Source Sans 3', sans-serif", size: 12 } } }
      }
    }
  });
}

/**
 * Horizontal bar chart: top reactions for a single drug.
 */
export function renderReactionsBar(canvas, reactions, total, count = 15) {
  clearChart(canvas);
  const top = reactions.slice(0, count);
  if (!top.length) return null;

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: top.map(r => r.term),
      datasets: [{
        data: top.map(r => r.count),
        backgroundColor: '#0D7377',
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : '?';
              return `${formatNumber(ctx.raw)} reports (${pct}% of total)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: '#E5E5E0' }, ticks: { font: { family: "'Source Sans 3', sans-serif" } } },
        y: { grid: { display: false }, ticks: { font: { family: "'Source Sans 3', sans-serif", size: 11 } } }
      }
    }
  });
}

/**
 * Line chart: reporting trends over time.
 */
export function renderTrendLine(canvas, dateCounts) {
  clearChart(canvas);
  const yearData = groupByYear(dateCounts);
  if (!yearData.length) return null;

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: yearData.map(d => d.year),
      datasets: [{
        label: 'Reports',
        data: yearData.map(d => d.count),
        borderColor: '#0D7377',
        backgroundColor: 'rgba(13,115,119,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `${formatNumber(ctx.raw)} reports` }
        }
      },
      scales: {
        x: { grid: { color: '#E5E5E0' }, ticks: { font: { family: "'Source Sans 3', sans-serif" } } },
        y: { grid: { color: '#E5E5E0' }, beginAtZero: true, ticks: { font: { family: "'Source Sans 3', sans-serif" } } }
      }
    }
  });
}

/**
 * Grouped horizontal bar chart: compare reactions across drugs.
 */
export function renderComparisonReactions(canvas, drugsData) {
  clearChart(canvas);
  // Get union of top 10 reactions per drug
  const reactionSet = new Map();
  for (const drug of drugsData) {
    for (const r of drug.reactions.slice(0, 10)) {
      const existing = reactionSet.get(r.term) || 0;
      reactionSet.set(r.term, existing + r.count);
    }
  }
  // Sort by combined count, take top 10
  const topReactions = [...reactionSet.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term);

  const datasets = drugsData.map((drug, i) => {
    const countMap = {};
    for (const r of drug.reactions) countMap[r.term] = r.count;
    return {
      label: drug.genericName,
      data: topReactions.map(t => countMap[t] || 0),
      backgroundColor: getDrugColor(i),
      borderRadius: 3,
    };
  });

  return new Chart(canvas, {
    type: 'bar',
    data: { labels: topReactions, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: "'Source Sans 3', sans-serif", size: 12 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.raw)} reports` }
        }
      },
      scales: {
        x: { grid: { color: '#E5E5E0' }, ticks: { font: { family: "'Source Sans 3', sans-serif" } } },
        y: { grid: { display: false }, ticks: { font: { family: "'Source Sans 3', sans-serif", size: 11 } } }
      }
    }
  });
}

/**
 * Stacked bar chart: severity comparison as percentages.
 */
export function renderSeverityComparison(canvas, drugsData) {
  clearChart(canvas);
  const categories = [
    { key: 'seriousnessdeath', label: 'Death', color: '#B91C1C' },
    { key: 'seriousnesshospitalization', label: 'Hospitalization', color: '#D97706' },
    { key: 'seriousnesslifethreatening', label: 'Life-Threatening', color: '#CA8A04' },
    { key: 'seriousnessdisabling', label: 'Disabling', color: '#475569' },
  ];

  const labels = drugsData.map(d => d.genericName);
  const datasets = categories.map(cat => ({
    label: cat.label,
    data: drugsData.map(d => {
      const total = d.totalReports || 1;
      return parseFloat(((d.breakdown[cat.key] || 0) / total * 100).toFixed(1));
    }),
    backgroundColor: cat.color,
    borderRadius: 2,
  }));

  return new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: "'Source Sans 3', sans-serif", size: 12 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%` }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { family: "'Source Sans 3', sans-serif" } } },
        y: { stacked: true, grid: { color: '#E5E5E0' }, ticks: { callback: v => v + '%', font: { family: "'Source Sans 3', sans-serif" } } }
      }
    }
  });
}

/**
 * Multi-line chart: compare reporting trends.
 */
export function renderComparisonTrends(canvas, drugsData) {
  clearChart(canvas);
  const allYears = new Set();
  const yearDataPerDrug = drugsData.map(d => {
    const yd = groupByYear(d.trends);
    yd.forEach(y => allYears.add(y.year));
    return yd;
  });
  const sortedYears = [...allYears].sort();

  const datasets = drugsData.map((drug, i) => {
    const yearMap = {};
    yearDataPerDrug[i].forEach(y => yearMap[y.year] = y.count);
    return {
      label: drug.genericName,
      data: sortedYears.map(yr => yearMap[yr] || 0),
      borderColor: getDrugColor(i),
      backgroundColor: getDrugColorLight(i),
      fill: false,
      tension: 0.3,
      pointRadius: 3,
    };
  });

  return new Chart(canvas, {
    type: 'line',
    data: { labels: sortedYears, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: "'Source Sans 3', sans-serif", size: 12 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.raw)}` }
        }
      },
      scales: {
        x: { grid: { color: '#E5E5E0' }, ticks: { font: { family: "'Source Sans 3', sans-serif" } } },
        y: { grid: { color: '#E5E5E0' }, beginAtZero: true, ticks: { font: { family: "'Source Sans 3', sans-serif" } } }
      }
    }
  });
}

/**
 * Donut chart: demographics (sex distribution).
 */
export function renderDemographicsChart(canvas, demographics) {
  clearChart(canvas);
  if (!demographics.length) return null;
  const labels = demographics.map(d => mapSex(d.term));
  const data = demographics.map(d => d.count);
  const colors = ['#475569', '#0D7377', '#BE185D', '#94938E'];

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#FAFAF7',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'Source Sans 3', sans-serif", size: 13 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = data.reduce((a, b) => a + b, 0);
              const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : '?';
              return `${ctx.label}: ${formatNumber(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Reaction Network Graph — canvas-based force-directed-like layout.
 */
export function renderReactionNetwork(canvas, drugName, reactions, maxNodes = 12) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width || 800;
  const H = 500;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const top = reactions.slice(0, maxNodes);
  if (!top.length) return;

  const maxCount = top[0].count;
  const centerX = W / 2;
  const centerY = H / 2;
  const radius = Math.min(W, H) * 0.35;

  // Build nodes
  const nodes = top.map((r, i) => {
    const angle = (i / top.length) * Math.PI * 2 - Math.PI / 2;
    const dist = radius * (0.7 + Math.random() * 0.3);
    const size = 8 + (r.count / maxCount) * 30;
    return {
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      r: size,
      label: r.term,
      count: r.count,
      color: `rgba(13,115,119,${0.3 + (r.count / maxCount) * 0.7})`,
    };
  });

  // Clear
  ctx.fillStyle = '#FAFAF7';
  ctx.fillRect(0, 0, W, H);

  // Draw connections
  for (const node of nodes) {
    const thickness = 1 + (node.count / maxCount) * 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(node.x, node.y);
    ctx.strokeStyle = `rgba(13,115,119,${0.1 + (node.count / maxCount) * 0.2})`;
    ctx.lineWidth = thickness;
    ctx.stroke();
  }

  // Draw center node (drug)
  ctx.beginPath();
  ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#0D7377';
  ctx.fill();
  ctx.strokeStyle = '#FAFAF7';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 11px 'Source Sans 3', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const shortName = drugName.length > 14 ? drugName.slice(0, 12) + '...' : drugName;
  ctx.fillText(shortName, centerX, centerY);

  // Draw reaction nodes
  for (const node of nodes) {
    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();
    ctx.strokeStyle = '#0D7377';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#1A1A2E';
    ctx.font = `${Math.max(9, Math.min(12, node.r * 0.8))}px 'Source Sans 3', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelY = node.y + node.r + 4;
    const labelText = node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label;
    ctx.fillText(labelText, node.x, labelY);

    // Count
    ctx.fillStyle = '#64748B';
    ctx.font = `10px 'IBM Plex Mono', monospace`;
    ctx.fillText(formatNumber(node.count), node.x, labelY + 14);
  }
}
