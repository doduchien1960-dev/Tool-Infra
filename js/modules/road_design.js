/**
 * Module Thiết kế Hình học Tuyến đường Đô thị (TCVN 4054:2005 & QCVN 07-1:2016)
 */

const RoadDesignModule = (() => {
  let roadAnimId = null;
  let carProgress = 0; // 0 -> 1

  /**
   * Tính toán và tra cứu các yếu tố hình học đường
   * @param {string} roadClassId ID cấp đường
   * @param {number} speed Vận tốc thiết kế Vtk (km/h)
   * @param {number} userR Bán kính cong nằm người dùng chọn thiết kế (m)
   * @param {string} vehicleType Loại xe thiết kế ('car', 'bus', 'truck_trailer')
   */
  function calculateGeometry(roadClassId, speed, userR, vehicleType = 'bus') {
    const specs = ROAD_GEOMETRIC_SPECS[speed] || ROAD_GEOMETRIC_SPECS[60];
    const roadClass = ROAD_CLASSES.find(r => r.id === roadClassId) || ROAD_CLASSES[0];

    const R = Math.max(parseFloat(userR) || specs.R_min_tt, 10);

    // Tính siêu cao i_sc (%)
    // Nếu R >= R_ksc => Không cần siêu cao (độ dốc mui luyện 2%)
    // Nếu R_min_gh <= R < R_ksc => Cần bố trí siêu cao
    let needSuperelevation = R < specs.R_ksc;
    let superelevation = 2.0; // mặt đường tiêu chuẩn có độ dốc ngang thoát nước 2%

    if (needSuperelevation) {
      if (R <= specs.R_min_gh) {
        superelevation = specs.isc_max;
      } else {
        // Nội suy siêu cao từ 2% đến isc_max
        const ratio = (specs.R_ksc - R) / (specs.R_ksc - specs.R_min_gh);
        superelevation = 2.0 + ratio * (specs.isc_max - 2.0);
      }
    }
    superelevation = parseFloat(superelevation.toFixed(1));

    // Chiều dài đoạn vuốt siêu cao / đường cong chuyển tiếp L_ct (m)
    let L_ct = specs.L_ct_min;
    if (R >= specs.R_ksc) {
      L_ct = 0; // Không cần cong chuyển tiếp
    }

    // Độ mở rộng phần xe chạy trong đường cong Delta B (m)
    // Theo TCVN 4054: Với R < 250m cần mở rộng phần xe chạy
    // Delta B = L^2 / (2R) + (0.05 * V) / sqrt(R)
    // Xe con: L = 3.5m; Xe buýt đô thị: L = 8.0m; Xe container: L = 12.0m
    let vehicleWheelbase = 8.0; // mặc định xe buýt
    if (vehicleType === 'car') vehicleWheelbase = 3.5;
    else if (vehicleType === 'truck_trailer') vehicleWheelbase = 12.0;

    let deltaB = 0;
    if (R < 250) {
      const deltaB_rigid = (vehicleWheelbase * vehicleWheelbase) / (2 * R);
      const deltaB_dynamic = (0.05 * speed) / Math.sqrt(R);
      deltaB = deltaB_rigid + deltaB_dynamic;
    }
    deltaB = parseFloat(deltaB.toFixed(2));

    // Đánh giá bán kính R theo tiêu chuẩn
    let rStatus = { code: 'optimal', text: 'Bán kính tốt (R ≥ R_tt)', color: 'text-emerald-500' };
    if (R < specs.R_min_gh) {
      rStatus = { code: 'danger', text: 'Vi phạm: R nhỏ hơn R_min giới hạn!', color: 'text-red-500' };
    } else if (R < specs.R_min_tt) {
      rStatus = { code: 'warning', text: 'Cảnh báo: R nằm trong khoảng giới hạn (cần châm chước)', color: 'text-amber-500' };
    } else if (R >= specs.R_ksc) {
      rStatus = { code: 'no_sc', text: 'Bán kính rất lớn: Không cần bố trí siêu cao', color: 'text-sky-500' };
    }

    return {
      roadClass,
      speed,
      R,
      specs,
      superelevation,
      needSuperelevation,
      L_ct,
      deltaB,
      vehicleType,
      vehicleWheelbase,
      rStatus
    };
  }

  /**
   * Hoạt ảnh mô phỏng xe chạy ôm cua đường cong SVG
   */
  function renderAnimatedRoad(svgEl, result) {
    if (!svgEl) return;

    const width = 360;
    const height = 240;

    // Quỹ đạo đường cong dạng Cubic Bezier
    // Từ tiếp tuyến trái -> vòng cua -> tiếp tuyến trên
    const pathD = "M 40,200 C 180,200 280,180 280,40";

    function animate() {
      carProgress = (carProgress + 0.005) % 1.0;

      // Tính tọa độ vị trí xe dọc theo Bezier curve bậc 3
      // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
      const t = carProgress;
      const p0 = { x: 40, y: 200 };
      const p1 = { x: 180, y: 200 };
      const p2 = { x: 280, y: 180 };
      const p3 = { x: 280, y: 40 };

      const cx = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
      const cy = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;

      // Góc tiếp tuyến đạo hàm B'(t)
      const dx = 3 * Math.pow(1 - t, 2) * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * Math.pow(t, 2) * (p3.x - p2.x);
      const dy = 3 * Math.pow(1 - t, 2) * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * Math.pow(t, 2) * (p3.y - p2.y);
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      svgEl.innerHTML = `
        <defs>
          <linearGradient id="asphaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>

        <!-- Nền mặt cỏ đô thị -->
        <rect x="0" y="0" width="${width}" height="${height}" fill="#0f172a" rx="8"/>

        <!-- Dải đường nhựa rộng 44px -->
        <path d="${pathD}" fill="none" stroke="#334155" stroke-width="46" stroke-linecap="round"/>
        <!-- Mặt đường chính -->
        <path d="${pathD}" fill="none" stroke="#1e293b" stroke-width="40" stroke-linecap="round"/>

        <!-- Vạch sơn tim đường màu vàng đứt quãng -->
        <path d="${pathD}" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="8,6" opacity="0.8"/>

        <!-- Vùng mở rộng bụng đường cong (Delta B) màu cam nhạt -->
        ${result.deltaB > 0 ? `
          <path d="M 120,220 Q 200,210 260,130" fill="none" stroke="#f97316" stroke-width="6" opacity="0.5"/>
          <text x="180" y="232" fill="#fb923c" font-size="10" font-weight="bold">+ Mở rộng bụng đường cong ΔB = ${result.deltaB}m</text>
        ` : ''}

        <!-- Biểu tượng Chiếc xe ô tô đang chạy và bẻ lái theo đường cong -->
        <g transform="translate(${cx}, ${cy}) rotate(${angleDeg})">
          <!-- Đèn pha xe chiếu sáng -->
          <polygon points="12,-5 35,-12 35,12 12,5" fill="#fef08a" opacity="0.35"/>
          <!-- Thân xe -->
          <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
          <!-- Kính chắn gió -->
          <rect x="-2" y="-6" width="6" height="12" rx="1" fill="#0284c7"/>
          <!-- Đèn hậu xe -->
          <circle cx="-13" cy="-6" r="1.5" fill="#ef4444"/>
          <circle cx="-13" cy="6" r="1.5" fill="#ef4444"/>
        </g>

        <!-- Bán kính R và tâm cong minh họa -->
        <circle cx="160" cy="80" r="3" fill="#38bdf8"/>
        <line x1="160" y1="80" x2="230" y2="150" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4,3"/>
        <text x="175" y="115" fill="#38bdf8" font-size="11" font-weight="600">R = ${result.R} m</text>

        <!-- Thước đo thông số góc trên -->
        <g transform="translate(15, 25)">
          <rect x="0" y="0" width="130" height="42" rx="4" fill="#1e293b" opacity="0.8" stroke="#475569" stroke-width="1"/>
          <text x="8" y="16" fill="#94a3b8" font-size="10">Siêu cao e: <tspan fill="#38bdf8" font-weight="bold">${result.superelevation}%</tspan></text>
          <text x="8" y="32" fill="#94a3b8" font-size="10">Đoạn vuốt Lct: <tspan fill="#10b981" font-weight="bold">${result.L_ct} m</tspan></text>
        </g>
      `;

      roadAnimId = requestAnimationFrame(animate);
    }

    if (roadAnimId) cancelAnimationFrame(roadAnimId);
    animate();
  }

  function stopAnimation() {
    if (roadAnimId) {
      cancelAnimationFrame(roadAnimId);
      roadAnimId = null;
    }
  }

  return {
    calculateGeometry,
    renderAnimatedRoad,
    stopAnimation
  };
})();
