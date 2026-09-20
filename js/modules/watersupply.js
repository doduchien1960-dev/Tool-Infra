/**
 * Module Thủy lực Mạng lưới Cấp nước Đô thị (Hazen-Williams)
 * Tiêu chuẩn áp dụng: TCVN 33:2006 (Cấp nước - Mạng lưới đường ống và công trình)
 */

const WaterSupplyModule = (() => {
  let waterFlowAnimId = null;
  let flowOffset = 0;

  /**
   * Tính toán thủy lực cấp nước theo Hazen-Williams
   * Công thức hệ SI: hf = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
   * @param {number} Q_ls Lưu lượng nước (l/s)
   * @param {number} L_m Chiều dài tuyến ống (m)
   * @param {number} C Hệ số nhám Hazen-Williams
   * @param {number} deltaZ Chênh cao địa hình (m)
   * @param {number} H_td Áp lực tự do tối thiểu tại điểm cuối (m)
   * @param {number} selected_dn Cỡ ống người dùng chọn (mm, tùy chọn)
   */
  function calculateNetwork(Q_ls, L_m, C, deltaZ = 0, H_td = 10, selected_dn = null) {
    const Q_m3s = Q_ls / 1000;
    const Q_m3h = Q_ls * 3.6;

    // Phân tích và đánh giá qua toàn bộ dải ống thương mại
    const pipeEvaluations = WATER_SUPPLY_PIPES.map(pipe => {
      const D_m = pipe.di_mm / 1000;
      const A_m2 = (Math.PI * D_m * D_m) / 4;
      const v = Q_m3s / A_m2; // m/s

      // Tổn thất dọc đường Hazen-Williams
      const h_f = 10.67 * L_m * Math.pow(Q_m3s, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
      const i_permille = (h_f / L_m) * 1000; // m tổn thất / 1000m ống (1000i)
      const h_cb = h_f * 0.12; // Tổn thất cục bộ ~ 12%
      const H_tong = h_f + h_cb + deltaZ + H_td;

      // Phân loại dải vận tốc kinh tế theo TCVN 33:2006
      // Kinh tế: 0.8 <= v <= 1.2 m/s (ống nhỏ), 1.2 - 1.5 m/s (ống lớn)
      let ecoStatus = 'normal';
      let ecoLabel = 'Chấp nhận được';
      let isRecommended = false;

      if (v >= 0.8 && v <= 1.25) {
        ecoStatus = 'optimal';
        ecoLabel = 'Vận tốc kinh tế tối ưu (TCVN 33)';
        isRecommended = true;
      } else if (v < 0.8) {
        ecoStatus = 'low_speed';
        ecoLabel = 'Vận tốc thấp (Ống quá lớn, lãng phí chi phí đầu tư)';
      } else if (v > 1.5) {
        ecoStatus = 'high_speed';
        ecoLabel = 'Vận tốc quá cao (Tổn thất áp lực lớn, nguy cơ búa nước)';
      }

      return {
        ...pipe,
        D_m,
        v,
        h_f,
        i_permille,
        h_cb,
        H_tong,
        ecoStatus,
        ecoLabel,
        isRecommended
      };
    });

    // Chọn cỡ ống tối ưu nhất (v gần 1.0 m/s nhất)
    let bestPipe = pipeEvaluations.find(p => p.isRecommended);
    if (!bestPipe) {
      // Nếu không có ống nào trúng dải, lấy ống có v gần 1.0 nhất
      bestPipe = [...pipeEvaluations].sort((a, b) => Math.abs(a.v - 1.0) - Math.abs(b.v - 1.0))[0];
    }

    // Nếu người dùng chỉ định cỡ ống cụ thể
    let currentPipe = bestPipe;
    if (selected_dn) {
      const found = pipeEvaluations.find(p => p.dn_mm === parseInt(selected_dn));
      if (found) currentPipe = found;
    }

    return {
      Q_ls,
      Q_m3h,
      Q_m3s,
      L_m,
      C,
      deltaZ,
      H_td,
      currentPipe,
      bestPipe,
      pipeEvaluations
    };
  }

  /**
   * Vẽ hoạt ảnh tuyến ống dẫn nước chịu áp SVG
   */
  function renderAnimatedPipe(svgEl, result) {
    if (!svgEl) return;

    const pipe = result.currentPipe;
    const v = Math.max(pipe.v, 0.1);

    function animate() {
      flowOffset = (flowOffset + v * 2) % 40;

      let pipeColor = '#0284c7'; // Xanh dương chuẩn
      let statusBadgeColor = '#38bdf8';
      if (pipe.ecoStatus === 'low_speed') {
        pipeColor = '#eab308'; // Vàng cảnh báo vận tốc thấp
        statusBadgeColor = '#fbbf24';
      } else if (pipe.ecoStatus === 'high_speed') {
        pipeColor = '#ef4444'; // Đỏ cảnh báo vận tốc cao
        statusBadgeColor = '#f87171';
      }

      svgEl.innerHTML = `
        <defs>
          <linearGradient id="pipeWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="50%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="waterFlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${pipeColor}" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="${pipeColor}" stop-opacity="0.9"/>
          </linearGradient>
        </defs>

        <!-- Thân ống áp lực ngoài (vỏ ống HDPE/Gang dẻo) -->
        <rect x="20" y="40" width="300" height="90" rx="8" fill="url(#pipeWallGrad)" stroke="#475569" stroke-width="2"/>
        
        <!-- Khối nước áp lực bên trong ống -->
        <rect x="25" y="48" width="290" height="74" fill="url(#waterFlowGrad)"/>

        <!-- Các luồng vệt nước chuyển động theo vận tốc v -->
        <line x1="25" y1="65" x2="315" y2="65" stroke="#ffffff" stroke-width="2" stroke-dasharray="16,14" stroke-dashoffset="${-flowOffset}" opacity="0.6"/>
        <line x1="25" y1="85" x2="315" y2="85" stroke="#ffffff" stroke-width="3" stroke-dasharray="22,18" stroke-dashoffset="${-flowOffset * 1.3}" opacity="0.75"/>
        <line x1="25" y1="105" x2="315" y2="105" stroke="#ffffff" stroke-width="2" stroke-dasharray="14,14" stroke-dashoffset="${-flowOffset * 0.9}" opacity="0.5"/>

        <!-- Mũi tên chỉ hướng dòng chảy -->
        <g transform="translate(140, 75)" opacity="0.85">
          <polygon points="0,0 20,10 0,20 6,10" fill="#ffffff"/>
          <polygon points="25,0 45,10 25,20 31,10" fill="#ffffff"/>
        </g>

        <!-- Mặt bích đấu nối 2 đầu -->
        <rect x="14" y="32" width="12" height="106" rx="3" fill="#cbd5e1" stroke="#334155" stroke-width="1.5"/>
        <rect x="314" y="32" width="12" height="106" rx="3" fill="#cbd5e1" stroke="#334155" stroke-width="1.5"/>

        <!-- Thông số hiển thị trực tiếp lên hình vẽ -->
        <text x="170" y="28" fill="${statusBadgeColor}" font-size="12" font-weight="bold" text-anchor="middle">
          ${pipe.label} (D_trong = ${pipe.di_mm} mm)
        </text>
        <text x="170" y="152" fill="#e2e8f0" font-size="12" font-weight="600" text-anchor="middle">
          Vận tốc v = ${pipe.v.toFixed(2)} m/s | 1000i = ${pipe.i_permille.toFixed(2)} m/km
        </text>
      `;

      waterFlowAnimId = requestAnimationFrame(animate);
    }

    if (waterFlowAnimId) cancelAnimationFrame(waterFlowAnimId);
    animate();
  }

  function stopAnimation() {
    if (waterFlowAnimId) {
      cancelAnimationFrame(waterFlowAnimId);
      waterFlowAnimId = null;
    }
  }

  return {
    calculateNetwork,
    renderAnimatedPipe,
    stopAnimation
  };
})();
