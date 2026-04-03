// charts.js — Chart rendering using Chart.js

import { formatNumber, getDrugColor, getDrugColorLight, groupByYear } from './utils.js';

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
