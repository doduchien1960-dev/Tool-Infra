/**
 * Tiêu chuẩn thiết kế hình học đường ô tô & đường đô thị
 * Căn cứ: TCVN 4054:2005 (Đường ô tô - Yêu cầu thiết kế) & QCVN 07-1:2016/BXD (Công trình giao thông đô thị)
 */

const ROAD_CLASSES = [
  {
    id: 'dt_truc_chinh',
    name: 'Đường trục chính đô thị',
    speedOptions: [80, 60],
    defaultSpeed: 60,
    desc: 'Nối các trung tâm đô thị lớn, lưu lượng giao thông cao'
  },
  {
    id: 'dt_lien_khu',
    name: 'Đường liên khu vực',
    speedOptions: [60, 50],
    defaultSpeed: 60,
    desc: 'Kết nối giữa các khu đô thị chức năng, quận huyện'
  },
  {
    id: 'dt_chinh_khu',
    name: 'Đường chính khu vực',
    speedOptions: [50, 40],
    defaultSpeed: 50,
    desc: 'Trục giao thông chính bên trong từng phân khu đô thị'
  },
  {
    id: 'dt_phan_khu',
    name: 'Đường phân khu vực',
    speedOptions: [40, 30],
    defaultSpeed: 40,
    desc: 'Phân chia các ô phố, tiếp cận các công trình công cộng'
  },
  {
    id: 'dt_noi_bo',
    name: 'Đường nhóm nhà ở / Nội bộ',
    speedOptions: [30, 20],
    defaultSpeed: 30,
    desc: 'Phục vụ cư dân tiếp cận nhà ở, tốc độ thấp, an toàn người đi bộ'
  },
  {
    id: 'cao_toc',
    name: 'Đường cao tốc (Cao tốc đô thị / Liên tỉnh)',
    speedOptions: [120, 100, 80],
    defaultSpeed: 100,
    desc: 'Chỉ dành riêng cho ô tô cơ giới chạy tốc độ cao'
  }
];

// Thông số kỹ thuật theo Vận tốc thiết kế Vtk (TCVN 4054:2005 & QCVN 07-1:2016)
const ROAD_GEOMETRIC_SPECS = {
  120: {
    R_min_gh: 600,   // Bán kính cong nằm tối thiểu giới hạn (m)
    R_min_tt: 1000,  // Bán kính cong nằm tối thiểu thông thường (m)
    R_ksc: 3000,     // Bán kính không cần bố trí siêu cao (m)
    L_ct_min: 100,   // Chiều dài đường cong chuyển tiếp tối thiểu (m)
    i_max: 4.0,      // Độ dốc dọc tối đa cho phép (%)
    R_loi_min: 15000,// Bán kính cong đứng lồi tối thiểu (m)
    R_hom_min: 4500, // Bán kính cong đứng hõm tối thiểu (m)
    S_dung: 210,     // Tầm nhìn dừng xe (m)
    isc_max: 6.0     // Siêu cao lớn nhất trong đô thị (%)
  },
  100: {
    R_min_gh: 400,
    R_min_tt: 700,
    R_ksc: 2500,
    L_ct_min: 85,
    i_max: 5.0,
    R_loi_min: 10000,
    R_hom_min: 3000,
    S_dung: 160,
    isc_max: 6.0
  },
  80: {
    R_min_gh: 250,
    R_min_tt: 400,
    R_ksc: 2000,
    L_ct_min: 70,
    i_max: 6.0,
    R_loi_min: 4500,
    R_hom_min: 2000,
    S_dung: 110,
    isc_max: 6.0
  },
  60: {
    R_min_gh: 125,
    R_min_tt: 250,
    R_ksc: 1500,
    L_ct_min: 50,
    i_max: 7.0,
    R_loi_min: 2000,
    R_hom_min: 1000,
    S_dung: 75,
    isc_max: 6.0
  },
  50: {
    R_min_gh: 80,
    R_min_tt: 150,
    R_ksc: 1000,
    L_ct_min: 40,
    i_max: 8.0,
    R_loi_min: 1200,
    R_hom_min: 700,
    S_dung: 55,
    isc_max: 5.0
  },
  40: {
    R_min_gh: 50,
    R_min_tt: 100,
    R_ksc: 600,
    L_ct_min: 30,
    i_max: 9.0,
    R_loi_min: 700,
    R_hom_min: 450,
    S_dung: 40,
    isc_max: 4.0
  },
  30: {
    R_min_gh: 30,
    R_min_tt: 60,
    R_ksc: 400,
    L_ct_min: 25,
    i_max: 10.0,
    R_loi_min: 400,
    R_hom_min: 250,
    S_dung: 30,
    isc_max: 3.0
  },
  20: {
    R_min_gh: 15,
    R_min_tt: 30,
    R_ksc: 200,
    L_ct_min: 20,
    i_max: 11.0,
    R_loi_min: 200,
    R_hom_min: 150,
    S_dung: 20,
    isc_max: 2.0
  }
};
