/**
 * InfraCalc Online - Main Application Coordinator
 */

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo Lucide Icons nếu có
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Khởi tạo các Tab & Module
  initTabNavigation();
  initStormwaterTab();
  initRainfallTab();
  initEarthworkTab();
  initWaterSupplyTab();
  initRoadDesignTab();
  initExportUtility();
});

/* ==========================================================================
   1. TAB NAVIGATION
   ========================================================================== */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      // Cập nhật trạng thái nút
      tabButtons.forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white');
        b.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');
      });
      btn.classList.add('active', 'bg-blue-600', 'text-white');
      btn.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800');

      // Cập nhật hiển thị panel
      tabPanels.forEach(p => p.classList.add('hidden'));
      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.remove('hidden');
      }

      // Kích hoạt render lại SVG/Canvas của tab đó
      if (targetId === 'tab-stormwater') triggerStormwaterCalc();
      else if (targetId === 'tab-rainfall') triggerRainfallCalc();
      else if (targetId === 'tab-earthwork') triggerEarthworkCalc();
      else if (targetId === 'tab-watersupply') triggerWaterSupplyCalc();
      else if (targetId === 'tab-roaddesign') triggerRoadDesignCalc();
    });
  });
}

/* ==========================================================================
   2. MODULE THOÁT NƯỚC & CỐNG TỰ CHẢY (MANNING)
   ========================================================================== */
function initStormwaterTab() {
  const pipeTypeSelect = document.getElementById('sw-pipe-type');
  const sizeSelect = document.getElementById('sw-pipe-size');
  const roughnessSelect = document.getElementById('sw-roughness');
  const flowInput = document.getElementById('sw-flow');
  const slopeInput = document.getElementById('sw-slope');
  const boxInputs = document.getElementById('sw-box-inputs');
  const circularInputs = document.getElementById('sw-circular-inputs');

  // Đổ danh sách cống tròn vào dropdown
  if (sizeSelect) {
    sizeSelect.innerHTML = CIRCULAR_PIPES.map(p => 
      `<option value="${p.d_m}" ${p.d_mm === 800 ? 'selected' : ''}>${p.label}</option>`
    ).join('');
  }

  // Đổ hệ số nhám
  if (roughnessSelect) {
    roughnessSelect.innerHTML = MANNING_ROUGHNESS.map(m => 
      `<option value="${m.n}">${m.name} (n = ${m.n})</option>`
    ).join('');
  }

  // Chuyển loại cống (Tròn vs Hộp)
  if (pipeTypeSelect) {
    pipeTypeSelect.addEventListener('change', () => {
      const isCircular = pipeTypeSelect.value === 'circular';
      circularInputs.classList.toggle('hidden', !isCircular);
      boxInputs.classList.toggle('hidden', isCircular);
      triggerStormwaterCalc();
    });
  }

  // Lắng nghe thay đổi giá trị
  [pipeTypeSelect, sizeSelect, roughnessSelect, flowInput, slopeInput, 
   document.getElementById('sw-box-b'), document.getElementById('sw-box-h')].forEach(el => {
    if (el) el.addEventListener('input', triggerStormwaterCalc);
  });

  // Nút tự động tìm cỡ cống tối ưu
  const autoOptimizeBtn = document.getElementById('sw-auto-optimize');
  if (autoOptimizeBtn) {
    autoOptimizeBtn.addEventListener('click', () => {
      const Q = (parseFloat(flowInput.value) || 0) / 1000;
      const slope = (parseFloat(slopeInput.value) || 0.3) / 100;
      const n = parseFloat(roughnessSelect.value) || 0.013;

      // Tìm cống tròn có độ đầy h/D trong khoảng 0.45 - 0.75
      for (const p of CIRCULAR_PIPES) {
        const res = StormwaterModule.calculateCircular(Q, p.d_m, slope, n);
        if (!res.isOverCapacity && res.h_ratio >= 0.4 && res.h_ratio <= p.maxH_ratio) {
          sizeSelect.value = p.d_m;
          break;
        }
      }
      triggerStormwaterCalc();
    });
  }

  triggerStormwaterCalc();
}

function triggerStormwaterCalc() {
  const pipeType = document.getElementById('sw-pipe-type')?.value || 'circular';
  const flow_ls = parseFloat(document.getElementById('sw-flow')?.value) || 0;
  const Q = flow_ls / 1000; // chuyển sang m3/s
  const slope_pct = parseFloat(document.getElementById('sw-slope')?.value) || 0.3;
  const slope = slope_pct / 100;
  const n = parseFloat(document.getElementById('sw-roughness')?.value) || 0.013;
  const svgEl = document.getElementById('sw-culvert-svg');

  let result;
  if (pipeType === 'circular') {
    const D = parseFloat(document.getElementById('sw-pipe-size')?.value) || 0.8;
    result = StormwaterModule.calculateCircular(Q, D, slope, n);
  } else {
    const B = parseFloat(document.getElementById('sw-box-b')?.value) || 1.2;
    const H = parseFloat(document.getElementById('sw-box-h')?.value) || 1.2;
    result = StormwaterModule.calculateBox(Q, B, H, slope, n);
  }

  // Cập nhật kết quả lên UI
  document.getElementById('sw-res-v').textContent = `${result.v.toFixed(2)} m/s`;
  document.getElementById('sw-res-h').textContent = `${(result.h * 1000).toFixed(0)} mm`;
  document.getElementById('sw-res-hratio').textContent = `${(result.h_ratio * 100).toFixed(1)} %`;
  document.getElementById('sw-res-qmax').textContent = `${(result.Q_max ? result.Q_max * 1000 : result.Q_full * 1000).toFixed(0)} l/s`;
  document.getElementById('sw-res-area').textContent = `${result.A.toFixed(3)} m²`;
  document.getElementById('sw-res-radius').textContent = `${result.R.toFixed(3)} m`;

  // Trạng thái kiểm tra TCVN 7957
  const statusEl = document.getElementById('sw-status-box');
  if (statusEl && result.status) {
    statusEl.className = `p-4 rounded-xl border text-sm font-medium transition-all ${result.status.bg || 'bg-slate-800 border-slate-700'}`;
    statusEl.innerHTML = `
      <div class="flex items-center gap-2 ${result.status.color}">
        <span class="font-bold">Đánh giá TCVN 7957:</span> ${result.status.message}
      </div>
    `;
  }

  // Vẽ mặt cắt cống hoạt ảnh
  StormwaterModule.renderAnimatedCulvert(svgEl, result, pipeType);
}

/* ==========================================================================
   3. MODULE CƯỜNG ĐỘ MƯA & IDF (TCVN 7957)
   ========================================================================== */
function initRainfallTab() {
  const stationSelect = document.getElementById('rf-station');
  const freqSelect = document.getElementById('rf-freq');
  const runoffSelect = document.getElementById('rf-runoff-type');
  const tInput = document.getElementById('rf-time');
  const fInput = document.getElementById('rf-area');
  const kInput = document.getElementById('rf-k');

  // Đổ trạm mưa
  if (stationSelect) {
    stationSelect.innerHTML = RAINFALL_STATIONS.map(s => 
      `<option value="${s.id}" ${s.id === 'hanoi' ? 'selected' : ''}>${s.name} (${s.region})</option>`
    ).join('');
  }

  // Đổ loại mặt phủ
  if (runoffSelect) {
    runoffSelect.innerHTML = RUNOFF_COEFFICIENTS.map(r => 
      `<option value="${r.psi}">${r.type} (ψ = ${r.psi})</option>`
    ).join('');
  }

  // Khi đổi trạm thì tự cập nhật tham số A, C, b, n, K
  if (stationSelect) {
    stationSelect.addEventListener('change', () => {
      const station = RAINFALL_STATIONS.find(s => s.id === stationSelect.value);
      if (station) {
        document.getElementById('rf-param-a').value = station.A;
        document.getElementById('rf-param-c').value = station.C;
        document.getElementById('rf-param-b').value = station.b;
        document.getElementById('rf-param-n').value = station.n;
        document.getElementById('rf-k').value = station.defaultK || 1.10;
        triggerRainfallCalc();
      }
    });
  }

  // Lắng nghe thay đổi
  [stationSelect, freqSelect, runoffSelect, tInput, fInput, kInput,
   document.getElementById('rf-param-a'), document.getElementById('rf-param-c'),
   document.getElementById('rf-param-b'), document.getElementById('rf-param-n')].forEach(el => {
    if (el) el.addEventListener('input', triggerRainfallCalc);
  });

  // Nút chuyển lưu lượng sang Tab Cống thoát nước
  const sendToCulvertBtn = document.getElementById('rf-send-to-culvert');
  if (sendToCulvertBtn) {
    sendToCulvertBtn.addEventListener('click', () => {
      const qVal = parseFloat(document.getElementById('rf-res-q')?.textContent) || 0;
      const qFlowVal = parseFloat(document.getElementById('rf-res-flow')?.textContent) || 0;
      
      const swFlowInput = document.getElementById('sw-flow');
      if (swFlowInput) {
        swFlowInput.value = qFlowVal.toFixed(1);
        // Chuyển sang Tab Cống
        document.querySelector('[data-tab="tab-stormwater"]')?.click();
      }
    });
  }

  triggerRainfallCalc();
}

function triggerRainfallCalc() {
  const A = parseFloat(document.getElementById('rf-param-a')?.value) || 5890;
  const C = parseFloat(document.getElementById('rf-param-c')?.value) || 0.65;
  const b = parseFloat(document.getElementById('rf-param-b')?.value) || 20;
  const n = parseFloat(document.getElementById('rf-param-n')?.value) || 0.84;
  const K = parseFloat(document.getElementById('rf-k')?.value) || 1.10;

  const P = parseFloat(document.getElementById('rf-freq')?.value) || 5;
  const t = parseFloat(document.getElementById('rf-time')?.value) || 15;
  const psi = parseFloat(document.getElementById('rf-runoff-type')?.value) || 0.65;
  const F = parseFloat(document.getElementById('rf-area')?.value) || 5;

  const q = RainfallModule.calculateIntensity(A, C, b, n, P, t, K);
  const flow = RainfallModule.calculateFlow(q, psi, F);

  // Cập nhật UI
  document.getElementById('rf-res-q').textContent = q.toFixed(1);
  document.getElementById('rf-res-flow').textContent = flow.Q_ls.toFixed(1);
  document.getElementById('rf-res-flow-m3s').textContent = flow.Q_m3s.toFixed(3);
  document.getElementById('rf-res-flow-m3h').textContent = flow.Q_m3h.toFixed(0);

  // Cập nhật biểu đồ IDF
  const idfCanvas = document.getElementById('rf-idf-chart');
  RainfallModule.renderIDFChart(idfCanvas, A, C, b, n, K, P, t, q);

  // Cập nhật mô phỏng mưa rơi
  const rainCanvas = document.getElementById('rf-rain-canvas');
  RainfallModule.startRainSimulator(rainCanvas, q);
}

/* ==========================================================================
   4. MODULE SAN NỀN & CÂN BẰNG ĐÀO - ĐẮP
   ========================================================================== */
let earthworkLots = [
  { id: 1, name: 'Lô A - Khu Nhà Phố', area: 5000, h_tn: 3.80, h_tk: 4.20 },
  { id: 2, name: 'Lô B - Khu Biệt Thự', area: 4500, h_tn: 4.50, h_tk: 4.20 },
  { id: 3, name: 'Lô C - Công Viên Cây Xanh', area: 3000, h_tn: 4.60, h_tk: 4.10 },
  { id: 4, name: 'Lô D - Đường Giao Thông', area: 3500, h_tn: 3.70, h_tk: 4.00 }
];

function initEarthworkTab() {
  renderLotTable();

  // Nút thêm lô đất mới
  const addLotBtn = document.getElementById('ew-add-lot');
  if (addLotBtn) {
    addLotBtn.addEventListener('click', () => {
      const nextId = earthworkLots.length > 0 ? Math.max(...earthworkLots.map(l => l.id)) + 1 : 1;
      earthworkLots.push({
        id: nextId,
        name: `Lô ${String.fromCharCode(65 + (nextId - 1) % 26)}`,
        area: 2500,
        h_tn: 4.00,
        h_tk: 4.20
      });
      renderLotTable();
      triggerEarthworkCalc();
    });
  }

  // Lắng nghe hệ số lu lèn và tơi xốp
  const klInput = document.getElementById('ew-kl');
  const ktxInput = document.getElementById('ew-ktx');
  if (klInput) klInput.addEventListener('input', triggerEarthworkCalc);
  if (ktxInput) ktxInput.addEventListener('input', triggerEarthworkCalc);

  triggerEarthworkCalc();
}

function renderLotTable() {
  const tbody = document.getElementById('ew-lot-tbody');
  if (!tbody) return;

  tbody.innerHTML = earthworkLots.map(lot => `
    <tr class="border-b border-slate-700/60 hover:bg-slate-800/40 transition-colors">
      <td class="py-2 px-3">
        <input type="text" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 lot-name-input" data-id="${lot.id}" value="${lot.name}"/>
      </td>
      <td class="py-2 px-3">
        <input type="number" step="50" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 lot-area-input" data-id="${lot.id}" value="${lot.area}"/>
      </td>
      <td class="py-2 px-3">
        <input type="number" step="0.05" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 lot-htn-input" data-id="${lot.id}" value="${lot.h_tn}"/>
      </td>
      <td class="py-2 px-3">
        <input type="number" step="0.05" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 lot-htk-input" data-id="${lot.id}" value="${lot.h_tk}"/>
      </td>
      <td class="py-2 px-3 text-center">
        <button class="text-rose-400 hover:text-rose-300 p-1 delete-lot-btn" data-id="${lot.id}" title="Xóa ô này">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </td>
    </tr>
  `).join('');

  // Gắn sự kiện cho các ô nhập liệu
  tbody.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = parseInt(e.target.dataset.id);
      const lot = earthworkLots.find(l => l.id === id);
      if (!lot) return;

      if (e.target.classList.contains('lot-name-input')) lot.name = e.target.value;
      if (e.target.classList.contains('lot-area-input')) lot.area = parseFloat(e.target.value) || 0;
      if (e.target.classList.contains('lot-htn-input')) lot.h_tn = parseFloat(e.target.value) || 0;
      if (e.target.classList.contains('lot-htk-input')) lot.h_tk = parseFloat(e.target.value) || 0;

      triggerEarthworkCalc();
    });
  });

  // Gắn sự kiện xóa
  tbody.querySelectorAll('.delete-lot-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      earthworkLots = earthworkLots.filter(l => l.id !== id);
      renderLotTable();
      triggerEarthworkCalc();
    });
  });
}

function triggerEarthworkCalc() {
  const kl = parseFloat(document.getElementById('ew-kl')?.value) || 1.10;
  const ktx = parseFloat(document.getElementById('ew-ktx')?.value) || 1.20;

  const result = EarthworkModule.calculateBalance(earthworkLots, kl, ktx);

  // Cập nhật thẻ tóm tắt số liệu
  document.getElementById('ew-res-total-area').textContent = `${result.totalArea.toLocaleString('vi-VN')} m²`;
  document.getElementById('ew-res-cut').textContent = `${result.totalCutNatural.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m³`;
  document.getElementById('ew-res-fill').textContent = `${result.totalFillDesign.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m³`;
  document.getElementById('ew-res-req-fill').textContent = `${result.requiredFillNatural.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m³`;

  // Hộp khuyến nghị cán cân đào đắp
  const recoBox = document.getElementById('ew-recommendation-box');
  if (recoBox && result.recommendation) {
    recoBox.className = `p-4 rounded-xl border ${result.recommendation.bg}`;
    recoBox.innerHTML = `
      <h4 class="font-bold text-base ${result.recommendation.color} mb-1">${result.recommendation.title}</h4>
      <p class="text-xs text-slate-300">${result.recommendation.desc}</p>
    `;
  }

  // Vẽ biểu đồ Bar Chart
  const chartCanvas = document.getElementById('ew-chart');
  EarthworkModule.renderEarthworkChart(chartCanvas, result);

  // Vẽ mặt cắt SVG
  const svgEl = document.getElementById('ew-cross-section-svg');
  EarthworkModule.renderCrossSectionSVG(svgEl, result);
}

/* ==========================================================================
   5. MODULE CẤP NƯỚC ĐÔ THỊ (HAZEN-WILLIAMS)
   ========================================================================== */
function initWaterSupplyTab() {
  const flowInput = document.getElementById('ws-flow');
  const lengthInput = document.getElementById('ws-length');
  const materialSelect = document.getElementById('ws-material');
  const deltaZInput = document.getElementById('ws-deltaz');
  const htdInput = document.getElementById('ws-htd');
  const pipeSelect = document.getElementById('ws-pipe-select');

  // Đổ danh sách vật liệu
  if (materialSelect) {
    materialSelect.innerHTML = HAZEN_WILLIAMS_C.map(m => 
      `<option value="${m.c}">${m.material} (C = ${m.c})</option>`
    ).join('');
  }

  // Đổ danh sách ống
  if (pipeSelect) {
    pipeSelect.innerHTML = `<option value="">Tự động tối ưu theo vận tốc kinh tế (0.8 - 1.2 m/s)</option>` +
      WATER_SUPPLY_PIPES.map(p => `<option value="${p.dn_mm}">${p.label} (D_trong = ${p.di_mm}mm)</option>`).join('');
  }

  [flowInput, lengthInput, materialSelect, deltaZInput, htdInput, pipeSelect].forEach(el => {
    if (el) el.addEventListener('input', triggerWaterSupplyCalc);
  });

  triggerWaterSupplyCalc();
}

function triggerWaterSupplyCalc() {
  const Q_ls = parseFloat(document.getElementById('ws-flow')?.value) || 20;
  const L = parseFloat(document.getElementById('ws-length')?.value) || 500;
  const C = parseFloat(document.getElementById('ws-material')?.value) || 140;
  const deltaZ = parseFloat(document.getElementById('ws-deltaz')?.value) || 0;
  const H_td = parseFloat(document.getElementById('ws-htd')?.value) || 12;
  const selected_dn = document.getElementById('ws-pipe-select')?.value || null;

  const result = WaterSupplyModule.calculateNetwork(Q_ls, L, C, deltaZ, H_td, selected_dn);
  const cur = result.currentPipe;

  // Cập nhật kết quả UI
  document.getElementById('ws-res-pipe-name').textContent = cur.label;
  document.getElementById('ws-res-v').textContent = `${cur.v.toFixed(2)} m/s`;
  document.getElementById('ws-res-hf').textContent = `${cur.h_f.toFixed(2)} m`;
  document.getElementById('ws-res-1000i').textContent = `${cur.i_permille.toFixed(2)} m/km`;
  document.getElementById('ws-res-htong').textContent = `${cur.H_tong.toFixed(2)} m`;

  // Trạng thái vận tốc kinh tế
  const statusBox = document.getElementById('ws-status-box');
  if (statusBox) {
    let bg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-400';
    if (cur.ecoStatus === 'low_speed') bg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-400';
    if (cur.ecoStatus === 'high_speed') bg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-400';

    statusBox.className = `p-3 rounded-xl border text-xs font-semibold ${bg}`;
    statusBox.innerHTML = `<span>Đánh giá TCVN 33:2006:</span> ${cur.ecoLabel}`;
  }

  // Đổ bảng phân tích so sánh các cỡ ống
  const tbody = document.getElementById('ws-comparison-tbody');
  if (tbody) {
    tbody.innerHTML = result.pipeEvaluations.map(p => {
      const isCur = p.dn_mm === cur.dn_mm;
      let badge = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">Bình thường</span>`;
      if (p.isRecommended) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">★ Tối ưu kinh tế</span>`;
      else if (p.ecoStatus === 'low_speed') badge = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-900/40 text-amber-300">Vận tốc thấp</span>`;
      else if (p.ecoStatus === 'high_speed') badge = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-900/40 text-rose-300">Vận tốc cao</span>`;

      return `
        <tr class="border-b border-slate-700/50 ${isCur ? 'bg-blue-900/30 font-semibold' : 'hover:bg-slate-800/40'}">
          <td class="py-2 px-3 text-slate-200">${p.label}</td>
          <td class="py-2 px-3 text-right text-slate-200">${p.v.toFixed(2)} m/s</td>
          <td class="py-2 px-3 text-right text-slate-200">${p.i_permille.toFixed(2)}</td>
          <td class="py-2 px-3 text-right text-slate-200">${p.h_f.toFixed(2)} m</td>
          <td class="py-2 px-3 text-right text-slate-200">${p.H_tong.toFixed(2)} m</td>
          <td class="py-2 px-3 text-center">${badge}</td>
        </tr>
      `;
    }).join('');
  }

  // Vẽ hoạt ảnh tuyến ống cấp nước
  const svgEl = document.getElementById('ws-pipe-svg');
  WaterSupplyModule.renderAnimatedPipe(svgEl, result);
}

/* ==========================================================================
   6. MODULE THIẾT KẾ HÌNH HỌC ĐƯỜNG ĐÔ THỊ (TCVN 4054 / QCVN 07)
   ========================================================================== */
function initRoadDesignTab() {
  const classSelect = document.getElementById('rd-class');
  const speedSelect = document.getElementById('rd-speed');
  const radiusInput = document.getElementById('rd-radius');
  const vehicleSelect = document.getElementById('rd-vehicle');

  // Đổ danh sách cấp đường
  if (classSelect) {
    classSelect.innerHTML = ROAD_CLASSES.map(c => 
      `<option value="${c.id}" ${c.id === 'dt_lien_khu' ? 'selected' : ''}>${c.name}</option>`
    ).join('');
  }

  // Cập nhật dải tốc độ theo cấp đường
  function updateSpeeds() {
    const roadClass = ROAD_CLASSES.find(r => r.id === classSelect.value) || ROAD_CLASSES[0];
    if (speedSelect) {
      speedSelect.innerHTML = roadClass.speedOptions.map(v => 
        `<option value="${v}" ${v === roadClass.defaultSpeed ? 'selected' : ''}>${v} km/h</option>`
      ).join('');
    }
  }

  if (classSelect) {
    classSelect.addEventListener('change', () => {
      updateSpeeds();
      // Đặt lại bán kính gợi ý
      const speed = parseInt(speedSelect.value) || 60;
      const specs = ROAD_GEOMETRIC_SPECS[speed] || ROAD_GEOMETRIC_SPECS[60];
      if (radiusInput) radiusInput.value = specs.R_min_tt;
      triggerRoadDesignCalc();
    });
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', () => {
      const speed = parseInt(speedSelect.value) || 60;
      const specs = ROAD_GEOMETRIC_SPECS[speed] || ROAD_GEOMETRIC_SPECS[60];
      if (radiusInput) radiusInput.value = specs.R_min_tt;
      triggerRoadDesignCalc();
    });
  }

  updateSpeeds();

  [radiusInput, vehicleSelect].forEach(el => {
    if (el) el.addEventListener('input', triggerRoadDesignCalc);
  });

  triggerRoadDesignCalc();
}

function triggerRoadDesignCalc() {
  const roadClassId = document.getElementById('rd-class')?.value || 'dt_lien_khu';
  const speed = parseInt(document.getElementById('rd-speed')?.value) || 60;
  const userR = parseFloat(document.getElementById('rd-radius')?.value) || 250;
  const vehicle = document.getElementById('rd-vehicle')?.value || 'bus';

  const res = RoadDesignModule.calculateGeometry(roadClassId, speed, userR, vehicle);

  // Cập nhật UI
  document.getElementById('rd-res-rmingh').textContent = `${res.specs.R_min_gh} m`;
  document.getElementById('rd-res-rmintt').textContent = `${res.specs.R_min_tt} m`;
  document.getElementById('rd-res-rksc').textContent = `${res.specs.R_ksc} m`;
  document.getElementById('rd-res-isc').textContent = `${res.superelevation} %`;
  document.getElementById('rd-res-lct').textContent = `${res.L_ct} m`;
  document.getElementById('rd-res-deltab').textContent = `${res.deltaB} m`;
  document.getElementById('rd-res-rloi').textContent = `${res.specs.R_loi_min} m`;
  document.getElementById('rd-res-rhom').textContent = `${res.specs.R_hom_min} m`;
  document.getElementById('rd-res-imax').textContent = `${res.specs.i_max} %`;
  document.getElementById('rd-res-sdung').textContent = `${res.specs.S_dung} m`;

  // Trạng thái kiểm tra bán kính R
  const rStatusBox = document.getElementById('rd-status-box');
  if (rStatusBox) {
    rStatusBox.innerHTML = `
      <div class="flex items-center gap-2 ${res.rStatus.color} font-semibold text-xs">
        <span>Đánh giá Bán kính thiết kế R = ${res.R}m:</span> ${res.rStatus.text}
      </div>
    `;
  }

  // Vẽ hoạt ảnh mô phỏng xe chạy đường cong
  const svgEl = document.getElementById('rd-road-svg');
  RoadDesignModule.renderAnimatedRoad(svgEl, res);
}

/* ==========================================================================
   7. TIỆN ÍCH XUẤT BÁO CÁO / IN ẤN
   ========================================================================== */
function initExportUtility() {
  const printBtn = document.getElementById('btn-print-report');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const copySummaryBtn = document.getElementById('btn-copy-summary');
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
      let text = '=== INFRACALC ONLINE - KẾT QUẢ TÍNH TOÁN HẠ TẦNG KỸ THUẬT ===\n';

      if (activeTab === 'tab-stormwater') {
        text += `\n[THỦY LỰC CỐNG TỰ CHẢY - TCVN 7957]\n`;
        text += `- Lưu lượng tính toán: ${document.getElementById('sw-flow')?.value} l/s\n`;
        text += `- Độ dốc thủy lực i: ${document.getElementById('sw-slope')?.value} %\n`;
        text += `- Vận tốc dòng chảy: ${document.getElementById('sw-res-v')?.textContent}\n`;
        text += `- Chiều sâu nước h: ${document.getElementById('sw-res-h')?.textContent}\n`;
        text += `- Độ đầy h/D: ${document.getElementById('sw-res-hratio')?.textContent}\n`;
      } else if (activeTab === 'tab-rainfall') {
        text += `\n[CƯỜNG ĐỘ MƯA & LƯU LƯỢNG - TCVN 7957]\n`;
        text += `- Cường độ mưa q: ${document.getElementById('rf-res-q')?.textContent} l/s.ha\n`;
        text += `- Lưu lượng tính toán Q: ${document.getElementById('rf-res-flow')?.textContent} l/s (${document.getElementById('rf-res-flow-m3s')?.textContent} m3/s)\n`;
      } else if (activeTab === 'tab-watersupply') {
        text += `\n[MẠNG LƯỚI CẤP NƯỚC - HAZEN-WILLIAMS - TCVN 33:2006]\n`;
        text += `- Tuyến ống: ${document.getElementById('ws-res-pipe-name')?.textContent}\n`;
        text += `- Vận tốc v: ${document.getElementById('ws-res-v')?.textContent}\n`;
        text += `- Tổn thất dọc đường hf: ${document.getElementById('ws-res-hf')?.textContent}\n`;
        text += `- Tổng tổn thất áp lực: ${document.getElementById('ws-res-htong')?.textContent}\n`;
      } else if (activeTab === 'tab-roaddesign') {
        text += `\n[YẾU TỐ HÌNH HỌC ĐƯỜNG - TCVN 4054 / QCVN 07]\n`;
        text += `- Vận tốc thiết kế Vtk: ${document.getElementById('rd-speed')?.value} km/h\n`;
        text += `- Bán kính cong nằm R: ${document.getElementById('rd-radius')?.value} m\n`;
        text += `- Siêu cao e: ${document.getElementById('rd-res-isc')?.textContent}\n`;
        text += `- Đoạn vuốt siêu cao Lct: ${document.getElementById('rd-res-lct')?.textContent}\n`;
      }

      navigator.clipboard.writeText(text).then(() => {
        alert('Đã sao chép tóm tắt kết quả tính toán vào bộ nhớ tạm (Clipboard)! Bạn có thể dán ngay vào Thuyết minh thiết kế.');
      });
    });
  }
}
