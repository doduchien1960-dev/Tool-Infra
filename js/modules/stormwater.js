/**
 * Module Thủy lực Cống tự chảy & Thoát nước (Manning Hydraulics)
 * Áp dụng TCVN 7957:2023 & TCVN 7957:2008
 */

const StormwaterModule = (() => {
  let animationFrameId = null;
  let wavePhase = 0;
  let particles = [];
  const NUM_PARTICLES = 16;

  // Khởi tạo các hạt bọt nước trôi lơ lửng trong dòng chảy
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random() * 240,
      relY: 0.15 + Math.random() * 0.75, // vị trí tương đối trong lớp nước
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.4 + Math.random() * 0.5
    });
  }

  /**
   * Giải bài toán thủy lực cống tròn chảy không đầy theo Manning
   * @param {number} Q Lưu lượng (m3/s)
   * @param {number} D Đường kính trong cống (m)
   * @param {number} slope Độ dốc i (không thứ nguyên, ví dụ 0.003)
   * @param {number} n Hệ số nhám Manning
   */
  function calculateCircular(Q, D, slope, n) {
    const r = D / 2;
    const S = Math.sqrt(Math.max(slope, 0.00001));

    // Thủy lực khi chảy đầy (h/D = 1.0)
    const A_full = (Math.PI * D * D) / 4;
    const P_full = Math.PI * D;
    const R_full = D / 4;
    const v_full = (1 / n) * Math.pow(R_full, 2 / 3) * S;
    const Q_full = A_full * v_full;

    // Lưu lượng cực đại xảy ra ở h/D ≈ 0.938 (Q_max ≈ 1.076 * Q_full)
    const Q_max = 1.076 * Q_full;

    if (Q <= 0) {
      return {
        D, h: 0, h_ratio: 0, A: 0, P: 0, R: 0, v: 0, Q: 0,
        Q_full, Q_max, isOverCapacity: false,
        status: { code: 'empty', message: 'Không có dòng chảy', color: 'text-slate-500' }
      };
    }

    if (Q > Q_max) {
      // Quá tải thủy lực cống tự chảy (cần tăng đường kính D)
      const v_est = Q / A_full;
      return {
        D, h: D, h_ratio: 1.0, A: A_full, P: P_full, R: R_full, v: v_est, Q,
        Q_full, Q_max, isOverCapacity: true,
        status: { code: 'overload', message: 'Quá tải thủy lực! (Q > Q_max). Cần tăng cỡ cống D.', color: 'text-red-500', bg: 'bg-red-50' }
      };
    }

    // Tìm góc ở tâm theta (radian) sao cho Q(theta) = Q bằng phương pháp chia đôi (Bisection)
    // theta trong khoảng [0.001, 2*PI]
    let low = 0.001;
    let high = 2 * Math.PI * 0.94; // Điểm cực đại lưu lượng theta ≈ 5.28 rad
    let theta = low;

    for (let iter = 0; iter < 40; iter++) {
      theta = (low + high) / 2;
      const A_cur = (D * D / 8) * (theta - Math.sin(theta));
      const P_cur = (D * theta) / 2;
      const R_cur = A_cur / P_cur;
      const v_cur = (1 / n) * Math.pow(R_cur, 2 / 3) * S;
      const Q_cur = A_cur * v_cur;

      if (Math.abs(Q_cur - Q) < 1e-6) break;
      if (Q_cur < Q) {
        low = theta;
      } else {
        high = theta;
      }
    }

    // Tính toán lại các thông số thủy lực tại điểm cân bằng
    const A = (D * D / 8) * (theta - Math.sin(theta));
    const P = (D * theta) / 2;
    const R = A / P;
    const v = Q / A;
    const h = (D / 2) * (1 - Math.cos(theta / 2));
    const h_ratio = h / D;

    // Đánh giá kiểm tra theo tiêu chuẩn TCVN 7957:2023
    let status = evaluateStatus(v, h_ratio, D);

    return {
      D, h, h_ratio, A, P, R, v, Q, Q_full, Q_max,
      theta_deg: (theta * 180 / Math.PI),
      isOverCapacity: false,
      status
    };
  }

  /**
   * Tính toán thủy lực cống hộp B x H
   */
  function calculateBox(Q, B, H, slope, n) {
    const S = Math.sqrt(Math.max(slope, 0.00001));
    const A_full = B * H;
    const P_full = 2 * (B + H);
    const R_full = A_full / P_full;
    const v_full = (1 / n) * Math.pow(R_full, 2 / 3) * S;
    const Q_full = A_full * v_full;

    if (Q <= 0) {
      return { B, H, h: 0, h_ratio: 0, A: 0, P: 0, R: 0, v: 0, Q: 0, Q_full, status: { code: 'empty', message: 'Không có dòng chảy' } };
    }

    if (Q > Q_full) {
      return {
        B, H, h: H, h_ratio: 1.0, A: A_full, P: P_full, R: R_full, v: Q / A_full, Q, Q_full,
        isOverCapacity: true,
        status: { code: 'overload', message: 'Cống hộp ngập quá nóc! Cần tăng kích thước B x H.', color: 'text-red-500' }
      };
    }

    // Bisection tìm h trong [0, H]
    let low = 0.001;
    let high = H;
    let h = low;
    for (let i = 0; i < 40; i++) {
      h = (low + high) / 2;
      const A_cur = B * h;
      const P_cur = B + 2 * h;
      const R_cur = A_cur / P_cur;
      const Q_cur = (1 / n) * A_cur * Math.pow(R_cur, 2 / 3) * S;

      if (Math.abs(Q_cur - Q) < 1e-6) break;
      if (Q_cur < Q) low = h;
      else high = h;
    }

    const A = B * h;
    const P = B + 2 * h;
    const R = A / P;
    const v = Q / A;
    const h_ratio = h / H;
    let status = evaluateStatus(v, h_ratio, Math.min(B, H));

    return { B, H, h, h_ratio, A, P, R, v, Q, Q_full, isOverCapacity: false, status };
  }

  /**
   * Đánh giá vận tốc và độ đầy theo TCVN 7957
   */
  function evaluateStatus(v, h_ratio, d_m) {
    const d_mm = d_m * 1000;
    let maxAllowedH = 0.8;
    if (d_mm <= 300) maxAllowedH = 0.6;
    else if (d_mm <= 900) maxAllowedH = 0.7;
    else maxAllowedH = 0.8;

    let issues = [];
    let isWarning = false;
    let isDanger = false;

    // Kiểm tra lắng cặn (v < 0.7 m/s)
    if (v < 0.7) {
      issues.push(`Vận tốc v = ${v.toFixed(2)} m/s < 0.7 m/s (Cảnh báo nguy cơ lắng cặn, bùn đọng theo TCVN 7957)`);
      isWarning = true;
    }
    // Kiểm tra xói mòn cống (v > 4.0 m/s với cống thường, > 7 m/s với BTCT)
    else if (v > 5.0) {
      issues.push(`Vận tốc v = ${v.toFixed(2)} m/s > 5.0 m/s (Nguy cơ xói mòn đáy và thành cống)`);
      isWarning = true;
    }

    // Kiểm tra độ đầy
    if (h_ratio > maxAllowedH) {
      issues.push(`Độ đầy h/D = ${h_ratio.toFixed(2)} vượt ngưỡng cho phép (${maxAllowedH}) theo TCVN 7957`);
      isWarning = true;
    }

    if (issues.length === 0) {
      return {
        code: 'ok',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        message: `Thủy lực đạt chuẩn TCVN 7957 (v = ${v.toFixed(2)} m/s, h/D = ${(h_ratio * 100).toFixed(1)}%)`
      };
    } else {
      return {
        code: 'warning',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        message: issues.join('. ')
      };
    }
  }

  /**
   * Vẽ và cập nhật hoạt ảnh mặt cắt cống thời gian thực (SVG)
   */
  function renderAnimatedCulvert(svgEl, result, type = 'circular') {
    if (!svgEl) return;

    const width = 280;
    const height = 280;
    const cx = 140;
    const cy = 140;
    const radius = 100; // bán kính hình vẽ trên SVG

    function animate() {
      wavePhase += 0.05 + Math.min(result.v, 4.0) * 0.03; // Vận tốc càng cao sóng càng chạy nhanh

      let html = '';
      const h_ratio = Math.min(Math.max(result.h_ratio, 0), 1.0);

      if (type === 'circular') {
        const d_visual = radius * 2;
        const waterVisualHeight = h_ratio * d_visual;
        const waterTopY = (cy + radius) - waterVisualHeight;

        // Vỏ cống bê tông ngoài và trong
        html += `
          <!-- Thành cống ngoài bê tông dày 14px -->
          <circle cx="${cx}" cy="${cy}" r="${radius + 14}" fill="#94a3b8" opacity="0.3" stroke="#64748b" stroke-width="2"/>
          <!-- Lòng cống trong -->
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#0f172a" stroke="#334155" stroke-width="3"/>
        `;

        if (h_ratio > 0.01) {
          // Tạo đường cong sóng nước mặt thoáng (Sine Wave)
          const waveAmp = Math.min(3 + result.v * 1.5, 8); // Biên độ sóng nước theo vận tốc
          let wavePoints = [];
          const step = 8;
          
          for (let x = cx - radius; x <= cx + radius; x += step) {
            // Kiểm tra xem điểm x có nằm trong đường tròn không
            const dx = x - cx;
            if (Math.abs(dx) <= radius) {
              const maxDy = Math.sqrt(radius * radius - dx * dx);
              const baselineY = waterTopY;
              // Sóng dao động
              const waveY = baselineY + Math.sin((x * 0.08) + wavePhase) * waveAmp;
              // Giới hạn trong lòng cống
              const clampedY = Math.min(Math.max(waveY, cy - maxDy), cy + maxDy);
              wavePoints.push(`${x},${clampedY}`);
            }
          }

          // Tạo ClipPath hình tròn để cắt khối nước hoàn hảo trong cống
          html += `
            <defs>
              <clipPath id="culvert-clip">
                <circle cx="${cx}" cy="${cy}" r="${radius}"/>
              </clipPath>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.95"/>
              </linearGradient>
            </defs>
            <g clip-path="url(#culvert-clip)">
              <!-- Khối nước lấp đầy bên dưới -->
              <rect x="${cx - radius - 5}" y="${waterTopY}" width="${radius * 2 + 10}" height="${waterVisualHeight + 20}" fill="url(#waterGrad)"/>
              <!-- Bề mặt sóng nước chuyển động -->
              <path d="M ${cx - radius},${cy + radius} L ${wavePoints.join(' L ')} L ${cx + radius},${cy + radius} Z" fill="url(#waterGrad)"/>
              <polyline points="${wavePoints.join(' ')}" fill="none" stroke="#e0f2fe" stroke-width="2.5" opacity="0.8"/>
              
              <!-- Hạt bọt nước trôi dạt theo vận tốc v -->
              ${particles.map(p => {
                // Di chuyển hạt theo vận tốc v thực tế
                const speed = Math.max(result.v, 0.4) * 1.2;
                p.x = (p.x + speed) % (radius * 2);
                const actualX = (cx - radius) + p.x;
                const actualY = waterTopY + (waterVisualHeight * p.relY);
                // Chỉ vẽ nếu hạt nằm trong cung tròn
                const distFromCenter = Math.hypot(actualX - cx, actualY - cy);
                if (distFromCenter < radius - 4) {
                  return `<circle cx="${actualX}" cy="${actualY}" r="${p.size}" fill="#ffffff" opacity="${p.opacity}"/>`;
                }
                return '';
              }).join('')}
            </g>
          `;
        }

        // Kích thước & Trục đo cao độ
        html += `
          <!-- Trục tim cống -->
          <line x1="${cx - radius - 15}" y1="${cy}" x2="${cx + radius + 15}" y2="${cy}" stroke="#64748b" stroke-width="1" stroke-dasharray="4,4"/>
          <!-- Đường kính D -->
          <line x1="${cx - radius}" y1="${cy + radius + 22}" x2="${cx + radius}" y2="${cy + radius + 22}" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="${cx}" y="${cy + radius + 36}" fill="#38bdf8" font-size="11" font-weight="600" text-anchor="middle">D = ${(result.D * 1000).toFixed(0)} mm</text>
          
          <!-- Chỉ báo mực nước h -->
          <line x1="${cx + radius + 10}" y1="${cy + radius}" x2="${cx + radius + 10}" y2="${(cy + radius) - (h_ratio * radius * 2)}" stroke="#f59e0b" stroke-width="2"/>
          <text x="${cx + radius + 16}" y="${(cy + radius) - (h_ratio * radius) + 4}" fill="#f59e0b" font-size="11" font-weight="600">h = ${(result.h * 1000).toFixed(0)}mm</text>
        `;
      } else {
        // Cống hộp B x H
        const boxW = 180;
        const boxH = 180;
        const boxLeft = cx - boxW / 2;
        const boxTop = cy - boxH / 2;
        const waterVisualH = h_ratio * boxH;
        const waterY = boxTop + boxH - waterVisualH;

        html += `
          <!-- Thành cống hộp -->
          <rect x="${boxLeft - 10}" y="${boxTop - 10}" width="${boxW + 20}" height="${boxH + 20}" fill="#94a3b8" opacity="0.3" stroke="#64748b" stroke-width="2" rx="4"/>
          <rect x="${boxLeft}" y="${boxTop}" width="${boxW}" height="${boxH}" fill="#0f172a" stroke="#334155" stroke-width="3" rx="2"/>
          
          <!-- Khối nước -->
          <rect x="${boxLeft}" y="${waterY}" width="${boxW}" height="${waterVisualH}" fill="#0284c7" opacity="0.9"/>
          <line x1="${boxLeft}" y1="${waterY}" x2="${boxLeft + boxW}" y2="${waterY}" stroke="#38bdf8" stroke-width="2.5"/>
          
          <!-- Kích thước -->
          <text x="${cx}" y="${boxTop + boxH + 25}" fill="#38bdf8" font-size="11" font-weight="600" text-anchor="middle">B = ${(result.B * 1000).toFixed(0)} mm</text>
          <text x="${boxLeft - 15}" y="${cy}" fill="#f59e0b" font-size="11" font-weight="600" text-anchor="end">H = ${(result.H * 1000).toFixed(0)} mm</text>
          <text x="${boxLeft + boxW + 15}" y="${waterY + waterVisualH / 2 + 4}" fill="#10b981" font-size="11" font-weight="600">h = ${(result.h * 1000).toFixed(0)} mm</text>
        `;
      }

      svgEl.innerHTML = html;
      animationFrameId = requestAnimationFrame(animate);
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animate();
  }

  function stopAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  return {
    calculateCircular,
    calculateBox,
    renderAnimatedCulvert,
    stopAnimation
  };
})();
