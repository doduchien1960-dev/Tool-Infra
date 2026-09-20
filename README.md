# InfraCalc Online - Bộ Công Cụ Thủy Lực & Hạ Tầng Kỹ Thuật Đô Thị

> Ứng dụng web chuyên ngành dành cho kỹ sư thiết kế cơ sở hạ tầng (Thoát nước mưa, Nước thải, Cấp nước, San nền, Thiết kế đường) chuẩn quy chuẩn Việt Nam hiện hành.

---

## 🚀 Tính năng & Các Module Kỹ thuật

### 1. Thủy lực Cống tự chảy (Manning Hydraulics)
*   **Tiêu chuẩn:** TCVN 7957:2023 & TCVN 7957:2008.
*   **Tính toán:** Cống tròn BTCT ($D300 \to D2000$) và Cống hộp ($B \times H$).
*   **Giải thuật:** Phương pháp chia đôi (Bisection) giải chính xác góc mở dòng chảy $\theta$, diện tích ướt $A$, bán kính thủy lực $R$, độ đầy $h/D$ và vận tốc $v$.
*   **Hoạt ảnh trực quan (SVG Animation):** Mặt cắt cống hiển thị sóng nước dao động mềm mại và các hạt bọt nước trôi dạt với tốc độ tỷ lệ thuận với vận tốc thực tế $v$ (m/s).
*   **Cảnh báo tự động:**
    *   Lắng cặn bùn nếu $v < 0.7\text{ m/s}$.
    *   Xói mòn cống nếu $v > 5.0\text{ m/s}$.
    *   Quá tải độ đầy $h/D > 0.6 - 0.8$.

### 2. Cường độ mưa & Biểu đồ IDF (Rainfall & IDF Curves)
*   **Tiêu chuẩn:** TCVN 7957:2023.
*   **Công thức:** $q = \frac{A \cdot (1 + C \cdot \lg P)}{(t + b)^n} \cdot K$.
*   **Dữ liệu trạm khí tượng:** Tích hợp sẵn hằng số khí hậu ($A, C, b, n$) cho các đô thị lớn: Hà Nội, TP.HCM (Tân Sơn Hòa), Đà Nẵng, Hải Phòng, Cần Thơ, Nha Trang, Huế, Vinh, Vũng Tàu, Buôn Ma Thuột...
*   **Lưu lượng dòng chảy:** $Q = q \cdot \psi \cdot F$ (l/s và $m^3/s$).
*   **Mô phỏng mưa (Rain Simulator):** Canvas hiển thị các giọt mưa rơi với mật độ và tốc độ tăng giảm theo giá trị $q$.
*   **Đường cong IDF:** Biểu đồ tương tác Chart.js cho các chu kỳ $P = 1, 2, 5, 10, 20$ năm.

### 3. San nền & Cân bằng Đào - Đắp (Earthwork Balance)
*   **Tính toán:** Quản lý danh sách nhiều lô đất/phân khu. Tính khối lượng đào nguyên thổ ($V_{đào}$), đắp thiết kế ($V_{đắp}$).
*   **Hệ số kỹ thuật:** Xét hệ số lu lèn đầm nén $k_l$ (K95, K98) và hệ số tơi xốp đất đào $k_{tx}$.
*   **Cán cân đất:** Đưa ra khuyến nghị chi tiết: Thừa đất (xuất đi đổ bãi thải) hoặc Thiếu đất (cần mua mỏ mang về) kèm ước tính số chuyến xe ben 10m³.
*   **Đồ họa:** Biểu đồ cột khối lượng và mặt cắt SVG so sánh địa hình tự nhiên vs đường đỏ thiết kế.

### 4. Thủy lực Mạng lưới Cấp nước (Hazen-Williams)
*   **Tiêu chuẩn:** TCVN 33:2006.
*   **Công thức SI:** $h_f = 10.67 \cdot \frac{L \cdot Q^{1.852}}{C^{1.852} \cdot D^{4.87}}$.
*   **Tối ưu kinh tế:** Tự động quét danh mục ống thương mại (HDPE, uPVC, Gang cầu DCI từ DN50 đến DN500) và đề xuất cỡ ống rơi vào dải vận tốc kinh tế $0.8 \le v \le 1.2\text{ m/s}$.
*   **Hoạt ảnh:** Tuyến ống 3D SVG mô phỏng luồng nước chảy theo tốc độ thực.

### 5. Yếu tố Hình học Tuyến đường (Road Geometric Design)
*   **Tiêu chuẩn:** TCVN 4054:2005 & QCVN 07-1:2016/BXD.
*   **Tra cứu & Tính toán:** Bán kính $R_{\min, gh}$, $R_{\min, tt}$, $R_{ksc}$; Độ dốc siêu cao $i_{sc}\%$; Đoạn vuốt siêu cao $L_{ct}$; Độ mở rộng bụng đường cong $\Delta B$; Bán kính cong đứng lồi/hõm và độ dốc dọc $i_{\max}\%$.
*   **Hoạt ảnh:** Chiếc xe ô tô chạy ôm cua mượt mà theo đường cong Bezier và góc quay vô-lăng tiếp tuyến quỹ đạo.

---

## 🌐 Quy trình đưa lên Web tối ưu nhất (GitHub + Vercel)

Quy trình bạn đang dùng (**Tạo mã nguồn trên máy tính -> Đẩy lên GitHub -> Deploy tự động qua Vercel**) là **quy trình chuẩn mực (Best Practice) hàng đầu thế giới hiện nay** vì:
1. **Hoàn toàn miễn phí:** Vercel miễn phí cho dự án cá nhân, băng thông cực lớn.
2. **Tốc độ tải trang siêu nhanh:** Tích hợp CDN toàn cầu (Edge Network gần Việt Nam ở Singapore và Hong Kong), mở trang chỉ mất chưa tới 0.3 giây.
3. **CI/CD tự động:** Mỗi khi bạn sửa code trên máy tính và đẩy lên GitHub, Vercel sẽ tự động cập nhật web trong 15-30 giây mà không cần thao tác gì thêm.

### Các bước triển khai đơn giản:

#### Cách 1: Sử dụng Git & GitHub CLI (Khuyên dùng)
1. Mở PowerShell hoặc Terminal tại thư mục `C:\Users\DucBao\Desktop\Web\Tool`:
   ```powershell
   cd C:\Users\DucBao\Desktop\Web\Tool
   git init
   git add .
   git commit -m "Initial commit InfraCalc Online v2.0"
   ```
2. Tạo một Repository mới trên tài khoản [GitHub](https://github.com/new) của bạn (ví dụ đặt tên: `infracalc-tool`).
3. Liên kết và đẩy code lên:
   ```powershell
   git remote add origin https://github.com/<tai-khoan-cua-ban>/infracalc-tool.git
   git branch -M main
   git push -u origin main
   ```
4. Truy cập [vercel.com](https://vercel.com) -> Đăng nhập bằng tài khoản GitHub -> Nhấn **"Add New Project"** -> Chọn repository `infracalc-tool` -> Nhấn **"Deploy"**.
5. Trong vòng 20 giây, bạn sẽ nhận được một đường link HTTPS miễn phí (ví dụ: `https://infracalc-tool.vercel.app`) để sử dụng trên điện thoại hoặc chia sẻ cho đồng nghiệp!

#### Cách 2: Dùng GitHub Desktop (Nếu không muốn gõ lệnh)
1. Tải và mở ứng dụng **GitHub Desktop**.
2. Chọn **File -> Add Local Repository** -> Trỏ tới thư mục `C:\Users\DucBao\Desktop\Web\Tool`.
3. Nhấn **Publish repository** lên tài khoản GitHub của bạn.
4. Mở Vercel và bấm Import để deploy.

---

## 💻 Sử dụng Offline trực tiếp trên máy tính

Nếu bạn đang ở công trường không có mạng internet, ứng dụng vẫn hoạt động hoàn hảo:
* Chỉ cần click đúp vào file `index.html` trên máy tính để mở trên Chrome hoặc Edge.
* Khi cần in ấn hoặc xuất Thuyết minh tính toán kỹ thuật, nhấn nút **"In / Xuất PDF"** trên thanh tiêu đề để in ra khổ giấy A4 sạch đẹp, chuẩn chỉ!
