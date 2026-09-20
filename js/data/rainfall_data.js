/**
 * Dữ liệu hằng số khí hậu tính toán cường độ mưa theo TCVN 7957:2023 / 2008
 * Công thức: q = [A * (1 + C * lg(P)) / (t + b)^n] * K
 * Trong đó:
 * - q: Cường độ mưa (l/s.ha)
 * - P: Chu kỳ lặp lại trận mưa tính toán (năm)
 * - t: Thời gian mưa tính toán (phút)
 * - A, C, b, n: Hằng số khí hậu đặc trưng địa phương
 * - K: Hệ số biến đổi khí hậu (TCVN 7957:2023 khuyến nghị K >= 1.05 - 1.20)
 */

const RAINFALL_STATIONS = [
  // Miền Bắc
  { id: 'hanoi', name: 'Hà Nội (Trạm Láng)', region: 'Bắc Bộ', A: 5890, C: 0.65, b: 20, n: 0.84, defaultK: 1.10 },
  { id: 'haiphong', name: 'Hải Phòng (Phù Liễn)', region: 'Bắc Bộ', A: 5950, C: 0.55, b: 21, n: 0.82, defaultK: 1.10 },
  { id: 'namdinh', name: 'Nam Định', region: 'Bắc Bộ', A: 6100, C: 0.53, b: 20, n: 0.81, defaultK: 1.10 },
  { id: 'quangninh', name: 'Quảng Ninh (Bãi Cháy)', region: 'Bắc Bộ', A: 6420, C: 0.58, b: 22, n: 0.83, defaultK: 1.12 },
  { id: 'thainguyen', name: 'Thái Nguyên', region: 'Bắc Bộ', A: 5400, C: 0.60, b: 19, n: 0.80, defaultK: 1.08 },
  { id: 'laocai', name: 'Lào Cai', region: 'Bắc Bộ', A: 4900, C: 0.52, b: 18, n: 0.78, defaultK: 1.08 },

  // Miền Trung
  { id: 'thanhhoa', name: 'Thanh Hóa', region: 'Bắc Trung Bộ', A: 6250, C: 0.52, b: 21, n: 0.82, defaultK: 1.10 },
  { id: 'vinh', name: 'Nghệ An (Trạm Vinh)', region: 'Bắc Trung Bộ', A: 6800, C: 0.50, b: 20, n: 0.80, defaultK: 1.12 },
  { id: 'hue', name: 'Thừa Thiên Huế (TP. Huế)', region: 'Bắc Trung Bộ', A: 9500, C: 0.42, b: 22, n: 0.78, defaultK: 1.15 },
  { id: 'danang', name: 'Đà Nẵng', region: 'Duyên hải Nam Trung Bộ', A: 8900, C: 0.40, b: 19, n: 0.75, defaultK: 1.15 },
  { id: 'quangngai', name: 'Quảng Ngãi', region: 'Duyên hải Nam Trung Bộ', A: 8650, C: 0.42, b: 20, n: 0.76, defaultK: 1.15 },
  { id: 'quynhon', name: 'Bình Định (Quy Nhơn)', region: 'Duyên hải Nam Trung Bộ', A: 7800, C: 0.44, b: 19, n: 0.76, defaultK: 1.12 },
  { id: 'nhatrang', name: 'Khánh Hòa (Nha Trang)', region: 'Duyên hải Nam Trung Bộ', A: 8200, C: 0.45, b: 19, n: 0.76, defaultK: 1.12 },
  { id: 'phanthett', name: 'Bình Thuận (Phan Thiết)', region: 'Duyên hải Nam Trung Bộ', A: 6300, C: 0.48, b: 18, n: 0.77, defaultK: 1.10 },

  // Tây Nguyên
  { id: 'pleiku', name: 'Gia Lai (Pleiku)', region: 'Tây Nguyên', A: 7100, C: 0.46, b: 19, n: 0.78, defaultK: 1.10 },
  { id: 'buonmathuot', name: 'Đắk Lắk (Buôn Ma Thuột)', region: 'Tây Nguyên', A: 7400, C: 0.44, b: 18, n: 0.76, defaultK: 1.10 },
  { id: 'dalat', name: 'Lâm Đồng (Đà Lạt)', region: 'Tây Nguyên', A: 6800, C: 0.42, b: 17, n: 0.75, defaultK: 1.10 },

  // Miền Nam
  { id: 'hcm', name: 'TP. Hồ Chí Minh (Tân Sơn Hòa)', region: 'Nam Bộ', A: 11650, C: 0.58, b: 32, n: 0.95, defaultK: 1.15 },
  { id: 'vungtau', name: 'Bà Rịa - Vũng Tàu', region: 'Nam Bộ', A: 10500, C: 0.52, b: 28, n: 0.90, defaultK: 1.15 },
  { id: 'binhduong', name: 'Bình Dương (Thủ Dầu Một)', region: 'Nam Bộ', A: 11200, C: 0.56, b: 30, n: 0.93, defaultK: 1.15 },
  { id: 'dongnai', name: 'Đồng Nai (Biên Hòa)', region: 'Nam Bộ', A: 11000, C: 0.55, b: 29, n: 0.92, defaultK: 1.12 },
  { id: 'cantho', name: 'Cần Thơ', region: 'Đồng bằng Sông Cửu Long', A: 7200, C: 0.35, b: 18, n: 0.71, defaultK: 1.12 },
  { id: 'kiengiang', name: 'Kiên Giang (Rạch Giá)', region: 'Đồng bằng Sông Cửu Long', A: 7600, C: 0.38, b: 19, n: 0.72, defaultK: 1.12 },
  { id: 'camau', name: 'Cà Mau', region: 'Đồng bằng Sông Cửu Long', A: 7900, C: 0.36, b: 19, n: 0.71, defaultK: 1.15 }
];

// Bảng hệ số dòng chảy mặt phủ psi (TCVN 7957)
const RUNOFF_COEFFICIENTS = [
  { type: 'Mái nhà, mặt đường nhựa, bê tông nguyên khối', psi: 0.90, desc: 'Không thấm nước, dòng chảy tập trung nhanh' },
  { type: 'Đường lát gạch, đá dăm có chèn khe chặt chẽ', psi: 0.75, desc: 'Thấm nước rất ít' },
  { type: 'Khu dân cư mật độ cao (nhà phố liền kề, chung cư)', psi: 0.70, desc: 'Tỷ lệ bê tông hóa cao' },
  { type: 'Khu dân cư mật độ trung bình (biệt thự vườn, nhà ở thấp tầng)', psi: 0.55, desc: 'Có sân vườn, thảm cỏ xen kẽ' },
  { type: 'Khu công viên, cây xanh tập trung', psi: 0.20, desc: 'Đất tự nhiên, độ thấm cao' },
  { type: 'Khu đô thị hỗn hợp tổng hợp', psi: 0.65, desc: 'Giá trị trung bình phổ biến dùng trong quy hoạch' }
];

// Khuyến nghị chu kỳ lặp trận mưa P (năm) theo TCVN 7957:2023
const DESIGN_RAIN_FREQUENCIES = [
  { urbanType: 'Đô thị loại đặc biệt, loại I - Cống chính', pMin: 5, pMax: 10, recommended: 5 },
  { urbanType: 'Đô thị loại đặc biệt, loại I - Cống nhánh', pMin: 2, pMax: 5, recommended: 3 },
  { urbanType: 'Đô thị loại II, III, IV - Cống chính', pMin: 2, pMax: 5, recommended: 3 },
  { urbanType: 'Đô thị loại II, III, IV - Cống nhánh', pMin: 1, pMax: 3, recommended: 2 },
  { urbanType: 'Khu công nghiệp tập trung', pMin: 3, pMax: 5, recommended: 3 },
  { urbanType: 'Đô thị loại V, điểm dân cư nông thôn', pMin: 1, pMax: 2, recommended: 1 }
];
