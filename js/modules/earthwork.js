/**
 * Module San nền & Cân bằng Đào - Đắp (Earthwork Balance)
 */

const EarthworkModule = (() => {
  let chartInstance = null;

  /**
   * Tính toán cân bằng đào đắp cho danh sách các lô đất
   * @param {Array} lots Mảng các lô [{ name, area, h_tn, h_tk }]
   * @param {number} k_l Hệ số lu lèn (ví dụ 1.10 - 1.15)
   * @param {number} k_tx Hệ số tơi xốp đất đào (ví dụ 1.20)
   */
  function calculateBalance(lots, k_l = 1.10, k_tx = 1.20) {
    let totalArea = 0;
    let totalCutNatural = 0;   // Thể tích đào nguyên thổ (m3)
    let totalFillDesign = 0;   // Thể tích đắp thiết kế (m3)

    const lotResults = lots.map(lot => {
      const area = parseFloat(lot.area) || 0;
      const h_tn = parseFloat(lot.h_tn) || 0;
      const h_tk = parseFloat(lot.h_tk) || 0;
      const deltaH = h_tk - h_tn; // > 0: đắp, < 0: đào

      totalArea += area;
      let cut_m3 = 0;
      let fill_m3 = 0;

      if (deltaH < 0) {
        // Cao độ tự nhiên cao hơn thiết kế => ĐÀO ĐẤT
        cut_m3 = area * Math.abs(deltaH);
        totalCutNatural += cut_m3;
      } else {
        // Cao độ thiết kế cao hơn tự nhiên => ĐẮP ĐẤT
        fill_m3 = area * deltaH;
        totalFillDesign += fill_m3;
      }

      return {
        ...lot,
        deltaH,
        cut_m3,
        fill_m3,
        type: deltaH < 0 ? 'Đào' : (deltaH > 0 ? 'Đắp' : 'Cân bằng')
      };
    });

    // Lượng đất cần đắp quy đổi nguyên thổ (đã xét hệ số lu lèn)
    const requiredFillNatural = totalFillDesign * k_l;
    // Chênh lệch cán cân (V_đào - V_đắp_cần)
    const netBalance = totalCutNatural - requiredFillNatural;

    let recommendation = {};
    if (Math.abs(netBalance) < 1) {
      recommendation = {
        type: 'balanced',
        title: 'Mặt bằng hoàn toàn cân bằng đào - đắp!',
        desc: 'Khối lượng đất đào tại chỗ vừa đủ để lu lèn đắp cho các vùng trũng. Không phát sinh chi phí vận chuyển ngoài.',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300'
      };
    } else if (netBalance > 0) {
      // Thừa đất đào
      const excessLoose = netBalance * k_tx; // quy đổi đất rời để điều xe chở đi
      const numTrucks10m3 = Math.ceil(excessLoose / 10);
      recommendation = {
        type: 'surplus',
        title: `Thừa đất đào: +${netBalance.toFixed(1)} m³ nguyên thổ`,
        desc: `Cần vận chuyển đổ đi bãi thải khoảng ${excessLoose.toFixed(1)} m³ đất rời (~${numTrucks10m3} chuyến xe ben 10m³).`,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300'
      };
    } else {
      // Thiếu đất đắp
      const deficitNatural = Math.abs(netBalance);
      const deficitLoose = deficitNatural * k_tx; // khối lượng đất rời mua tại mỏ
      const numTrucks10m3 = Math.ceil(deficitLoose / 10);
      recommendation = {
        type: 'deficit',
        title: `Thiếu đất đắp: -${deficitNatural.toFixed(1)} m³ nguyên thổ`,
        desc: `Cần mua thêm từ mỏ đất mang về công trường khoảng ${deficitLoose.toFixed(1)} m³ đất rời (~${numTrucks10m3} chuyến xe ben 10m³).`,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/40 border-red-300'
      };
    }

    return {
      lots: lotResults,
      totalArea,
      totalCutNatural,
      totalFillDesign,
      requiredFillNatural,
      netBalance,
      k_l,
      k_tx,
      recommendation
    };
  }

  /**
   * Vẽ biểu đồ so sánh Đào vs Đắp
   */
  function renderEarthworkChart(canvasEl, result) {
    if (!canvasEl || typeof Chart === 'undefined') return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvasEl.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Đào nguyên thổ (V_đào)', 'Đắp thiết kế (V_đắp)', 'Đất đắp cần (có lu lèn)'],
        datasets: [{
          label: 'Thể tích (m³)',
          data: [
            parseFloat(result.totalCutNatural.toFixed(1)),
            parseFloat(result.totalFillDesign.toFixed(1)),
            parseFloat(result.requiredFillNatural.toFixed(1))
          ],
          backgroundColor: [
            'rgba(239, 68, 68, 0.75)',   // Đào: Đỏ
            'rgba(59, 130, 246, 0.75)',  // Đắp: Xanh dương
            'rgba(16, 185, 129, 0.75)'   // Đắp cần: Xanh lá
          ],
          borderColor: [
            '#ef4444',
            '#3b82f6',
            '#10b981'
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString('vi-VN')} m³`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Khối lượng đất (m³)', font: { size: 11, weight: 'bold' } }
          }
        }
      }
    });
  }

  /**
   * Vẽ mặt cắt trực quan san nền địa hình SVG
   */
  function renderCrossSectionSVG(svgEl, result) {
    if (!svgEl) return;

    const width = 360;
    const height = 180;
    const padding = 20;

    // Giả lập mặt cắt địa hình tự nhiên lượn sóng vs mặt bằng quy hoạch
    const baselineY = 110;
    const cutAmount = Math.min(result.totalCutNatural / 100, 35);
    const fillAmount = Math.min(result.totalFillDesign / 100, 35);

    const naturalPath = `M ${padding},${baselineY - 15} Q 100,${baselineY - 30 - cutAmount} 180,${baselineY} T ${width - padding},${baselineY + 25 + fillAmount}`;
    const designLineY = baselineY - 5;

    svgEl.innerHTML = `
      <defs>
        <pattern id="cutHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" stroke-width="1.5" opacity="0.6"/>
        </pattern>
        <pattern id="fillHatch" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#10b981" stroke-width="1.5" opacity="0.6"/>
        </pattern>
      </defs>

      <!-- Đường cơ sở đất sâu -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="#0f172a" rx="8"/>

      <!-- Vùng ĐÀO (Cut) -->
      <path d="M 30,${designLineY} Q 100,${baselineY - 30 - cutAmount} 170,${designLineY} Z" fill="url(#cutHatch)" opacity="0.8"/>
      <text x="100" y="${baselineY - 35 - cutAmount / 2}" fill="#f87171" font-size="11" font-weight="bold" text-anchor="middle">VÙNG ĐÀO (CUT)</text>

      <!-- Vùng ĐẮP (Fill) -->
      <path d="M 170,${designLineY} Q 250,${baselineY + 30 + fillAmount} 330,${designLineY} Z" fill="url(#fillHatch)" opacity="0.8"/>
      <text x="250" y="${baselineY + 45 + fillAmount / 2}" fill="#34d399" font-size="11" font-weight="bold" text-anchor="middle">VÙNG ĐẮP (FILL)</text>

      <!-- Đường tự nhiên (nét gãy nhấp nhô) -->
      <path d="${naturalPath}" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="5,3"/>
      
      <!-- Đường đỏ thiết kế phẳng khống chế -->
      <line x1="${padding}" y1="${designLineY}" x2="${width - padding}" y2="${designLineY}" stroke="#ef4444" stroke-width="2.5"/>

      <!-- Chú thích -->
      <g transform="translate(25, 20)">
        <line x1="0" y1="0" x2="25" y2="0" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,2"/>
        <text x="32" y="4" fill="#cbd5e1" font-size="10">Địa hình tự nhiên (H_tn)</text>

        <line x1="180" y1="0" x2="205" y2="0" stroke="#ef4444" stroke-width="2"/>
        <text x="212" y="4" fill="#fca5a5" font-size="10">Cao độ thiết kế (H_tk)</text>
      </g>
    `;
  }

  return {
    calculateBalance,
    renderEarthworkChart,
    renderCrossSectionSVG
  };
})();
