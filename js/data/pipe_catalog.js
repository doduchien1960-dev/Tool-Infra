/**
 * Danh mục quy cách cống và ống thương mại theo tiêu chuẩn Việt Nam
 * Áp dụng cho: Thoát nước mưa, Nước thải và Cấp nước đô thị
 */

// Cỡ cống tròn BTCT tiêu chuẩn (TCVN 9113 / TCVN 7957)
const CIRCULAR_PIPES = [
  { d_mm: 300, d_m: 0.3, label: 'D300 mm (Cống nhánh/đấu nối)', maxH_ratio: 0.6 },
  { d_mm: 400, d_m: 0.4, label: 'D400 mm (Cống thu gom nhánh)', maxH_ratio: 0.7 },
  { d_mm: 500, d_m: 0.5, label: 'D500 mm (Cống thu gom)', maxH_ratio: 0.7 },
  { d_mm: 600, d_m: 0.6, label: 'D600 mm (Cống đường phân khu vực)', maxH_ratio: 0.7 },
  { d_mm: 800, d_m: 0.8, label: 'D800 mm (Cống đường khu vực)', maxH_ratio: 0.7 },
  { d_mm: 1000, d_m: 1.0, label: 'D1000 mm (Cống chính phân lưu)', maxH_ratio: 0.8 },
  { d_mm: 1200, d_m: 1.2, label: 'D1200 mm (Cống chính)', maxH_ratio: 0.8 },
  { d_mm: 1500, d_m: 1.5, label: 'D1500 mm (Cống trục chính)', maxH_ratio: 0.8 },
  { d_mm: 1800, d_m: 1.8, label: 'D1800 mm (Cống liên khu vực)', maxH_ratio: 0.8 },
  { d_mm: 2000, d_m: 2.0, label: 'D2000 mm (Cống xả chính)', maxH_ratio: 0.8 }
];

// Cống hộp BTCT tiêu chuẩn (TCVN 9116 / B x H)
const BOX_CULVERTS = [
  { b_m: 1.0, h_m: 1.0, label: 'Hộp 1.0 x 1.0 m' },
  { b_m: 1.2, h_m: 1.2, label: 'Hộp 1.2 x 1.2 m' },
  { b_m: 1.5, h_m: 1.5, label: 'Hộp 1.5 x 1.5 m' },
  { b_m: 1.6, h_m: 1.6, label: 'Hộp 1.6 x 1.6 m' },
  { b_m: 2.0, h_m: 1.5, label: 'Hộp 2.0 x 1.5 m' },
  { b_m: 2.0, h_m: 2.0, label: 'Hộp 2.0 x 2.0 m' },
  { b_m: 2.5, h_m: 2.0, label: 'Hộp 2.5 x 2.0 m' },
  { b_m: 3.0, h_m: 2.0, label: 'Hộp 3.0 x 2.0 m' }
];

// Hệ số nhám Manning n (TCVN 7957)
const MANNING_ROUGHNESS = [
  { name: 'Bê tông cốt thép đúc sẵn (láng mịn)', n: 0.013, desc: 'Phổ biến nhất trong thiết kế cống đô thị hiện nay' },
  { name: 'Bê tông đổ tại chỗ (thông thường)', n: 0.014, desc: 'Bề mặt trung bình, có mạch ghép cốp pha' },
  { name: 'Ống nhựa HDPE gân xoắn 2 vách / uPVC', n: 0.010, desc: 'Lòng trơn nhẵn, trở lực nhỏ' },
  { name: 'Mương xây đá hộc / gạch có trát vữa', n: 0.017, desc: 'Mương rãnh hở, thoát nước địa hình' },
  { name: 'Mương đất tự nhiên nạo vét định kỳ', n: 0.025, desc: 'Kênh dẫn nước thô, mương thủy lợi' }
];

// Ống cấp nước áp lực tiêu chuẩn (HDPE Tiền Phong / Hoa Sen / Bình Minh, Gang cầu DCI)
const WATER_SUPPLY_PIPES = [
  { dn_mm: 50, di_mm: 44.0, label: 'DN50 (Ống dịch vụ vào nhà)' },
  { dn_mm: 63, di_mm: 55.4, label: 'DN63 (Ống phân phối ngõ xóm)' },
  { dn_mm: 75, di_mm: 66.0, label: 'DN75 (Ống phân phối ngõ)' },
  { dn_mm: 90, di_mm: 79.2, label: 'DN90 (Ống phân phối nhánh)' },
  { dn_mm: 110, di_mm: 96.8, label: 'DN110 (Tuyến phân phối chính)' },
  { dn_mm: 160, di_mm: 140.8, label: 'DN160 (Tuyến cấp nước khu vực)' },
  { dn_mm: 200, di_mm: 176.0, label: 'DN200 (Tuyến truyền dẫn liên khu)' },
  { dn_mm: 250, di_mm: 220.0, label: 'DN250 (Tuyến truyền dẫn chính)' },
  { dn_mm: 315, di_mm: 277.2, label: 'DN315 (Tuyến trục đô thị)' },
  { dn_mm: 400, di_mm: 352.0, label: 'DN400 (Tuyến trục chính phát nước)' },
  { dn_mm: 500, di_mm: 440.0, label: 'DN500 (Ống truyền tải trạm cấp)' }
];

// Hệ số nhám Hazen-Williams C (TCVN 33:2006)
const HAZEN_WILLIAMS_C = [
  { material: 'Ống nhựa HDPE / uPVC / PPR (Mới & thiết kế)', c: 140, desc: 'Ống chất dẻo hiện đại, không bám cặn' },
  { material: 'Ống Gang dẻo tráng vữa xi măng (Ductile Iron)', c: 130, desc: 'Độ bền cơ học cao, tuổi thọ trên 50 năm' },
  { material: 'Ống Thép có sơn phủ bảo vệ', c: 120, desc: 'Dùng cho các vị trí vượt sông, cầu máng' },
  { material: 'Ống Gang cũ / Bê tông dự ứng lực lâu năm', c: 100, desc: 'Có độ nhám và bám cặn theo thời gian' }
];
