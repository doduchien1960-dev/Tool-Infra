/**
 * Module Tra cứu Cường độ mưa & Đường cong IDF theo TCVN 7957:2023 / 2008
 */

const RainfallModule = (() => {
  let idfChartInstance = null;
  let rainAnimId = null;
  let rainDrops = [];

  /**
   * Tính cường độ mưa q (l/s.ha)
   * q = [A * (1 + C * lg(P)) / (t + b)^n] * K
   */
  function calculateIntensity(A, C, b, n, P, t, K = 1.0) {
    if (t <= 0 || P <= 0) return 0;
    const numerator = A * (1 + C * Math.log10(P));
    const denominator = Math.pow(t + b, n);
    const q = (numerator / denominator) * K;
    return Math.max(0, q);
  }

  /**
   * Tính lưu lượng mưa Q = q * psi * F
   * @param {number} q Cường độ mưa (l/s.ha)
   * @param {number} psi Hệ số dòng chảy (0.1 - 0.95)
   * @param {number} F Diện tích lưu vực (ha)
   * @returns {object} { Q_ls: l/s, Q_m3s: m3/s, Q_m3h: m3/h }
   */
  function calculateFlow(q, psi, F) {
    const Q_ls = q * psi * F;
    const Q_m3s = Q_ls / 1000;
    const Q_m3h = Q_m3s * 3600;
    return { Q_ls, Q_m3s, Q_m3h };
  }

  /**
   * Vẽ biểu đồ IDF (Intensity-Duration-Frequency)
   */
  function renderIDFChart(canvasEl, A, C, b, n, K, currentP, currentT, currentQ) {
    if (!canvasEl) return;

    const timeSteps = [5, 10, 15, 20, 30, 45, 60, 90, 120];
    const returnPeriods = [1, 2, 5, 10, 20];
    const colors = {
      1: '#94a3b8',
      2: '#38bdf8',
      5: '#3b82f6',
      10: '#f59e0b',
      20: '#ef4444'
    };

    const datasets = returnPeriods.map(p => {
      const data = timeSteps.map(t => {
        return {
          x: t,
          y: parseFloat(calculateIntensity(A, C, b, n, p, t, K).toFixed(1))
        };
      });

      return {
        label: `P = ${p} năm`,
        data: data,
        borderColor: colors[p],
        backgroundColor: colors[p],
        borderWidth: p === currentP ? 3 : 1.5,
        tension: 0.35,
        pointRadius: p === currentP ? 4 : 2
      };
    });

    // Thêm điểm hoạt động hiện tại (Operating Point)
    datasets.push({
      label: `Điểm thiết kế (t=${currentT}', q=${currentQ.toFixed(0)})`,
      data: [{ x: currentT, y: parseFloat(currentQ.toFixed(1)) }],
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      pointRadius: 7,
      pointHoverRadius: 9,
      showLine: false
    });

    if (idfChartInstance) {
      idfChartInstance.destroy();
    }

    const ctx = canvasEl.getContext('2d');
    idfChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeSteps,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y} l/s.ha`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Thời gian tập trung nước t (phút)',
              font: { weight: 'bold', size: 11 }
            },
            min: 5,
            max: 120
          },
          y: {
            title: {
              display: true,
              text: 'Cường độ mưa q (l/s·ha)',
              font: { weight: 'bold', size: 11 }
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  /**
   * Mô phỏng hoạt ảnh hạt mưa rơi theo cường độ q (Canvas)
   */
  function startRainSimulator(canvasEl, q) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const width = canvasEl.width = canvasEl.clientWidth || 300;
    const height = canvasEl.height = canvasEl.clientHeight || 160;

    // Số hạt mưa tỷ lệ thuận với q (tối thiểu 20 hạt, tối đa 200 hạt)
    const dropCount = Math.min(Math.max(Math.floor(q * 0.4), 25), 220);
    rainDrops = [];

    for (let i = 0; i < dropCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 8 + Math.random() * 14,
        speed: 6 + Math.min(q * 0.03, 10) + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.6
      });
    }

    function animateRain() {
      ctx.clearRect(0, 0, width, height);

      // Nền trời mưa tối sầm nhẹ khi mưa lớn
      const darkness = Math.min(q / 600, 0.45);
      ctx.fillStyle = `rgba(15, 23, 42, ${darkness})`;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;

      for (let i = 0; i < rainDrops.length; i++) {
        const drop = rainDrops[i];
        ctx.beginPath();
        ctx.globalAlpha = drop.opacity;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= 1.5; // gió nghiêng nhẹ

        if (drop.y > height) {
          drop.y = -15;
          drop.x = Math.random() * (width + 50);
        }
      }

      ctx.globalAlpha = 1.0;
      rainAnimId = requestAnimationFrame(animateRain);
    }

    if (rainAnimId) cancelAnimationFrame(rainAnimId);
    animateRain();
  }

  function stopRain() {
    if (rainAnimId) {
      cancelAnimationFrame(rainAnimId);
      rainAnimId = null;
    }
  }

  return {
    calculateIntensity,
    calculateFlow,
    renderIDFChart,
    startRainSimulator,
    stopRain
  };
})();
