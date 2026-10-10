/**
 * ============================================================================
 * ĐỒ ÁN MÔN HỌC: HỆ THỐNG QUẢN LÝ GHI CHÚ VÀ THÔNG TIN RIÊNG TƯ
 * FILE: backend/server.js
 * MÔ TẢ: Máy chủ REST API - SPRINT 2 (Tính năng Ghi chú thông thường / Public Notes)
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Phục vụ giao diện web tĩnh dự phòng tại thư mục public (Tránh lỗi Cannot GET /)
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const notesDir = path.join(dataDir, 'notes');
const profilePath = path.join(dataDir, 'profile.json');
const privateNotesPath = path.join(dataDir, 'private.json');

// 1. Khởi tạo các thư mục lưu trữ dữ liệu
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Thẻ 2 (Sprint 2): Khởi tạo thư mục data/notes/
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

// 2. Khởi tạo file profile.json mặc định
if (!fs.existsSync(profilePath)) {
  const defaultProfile = {
    displayName: "Sinh viên nhóm 1",
    theme: "light",
    primaryColor: "#2563eb",
    password: "123" // Mật khẩu mẫu mặc định cho vùng riêng tư
  };
  fs.writeFileSync(profilePath, JSON.stringify(defaultProfile, null, 2), 'utf8');
}

// 3. Khởi tạo file private.json mặc định
if (!fs.existsSync(privateNotesPath)) {
  const defaultPrivate = [
    {
      id: "priv-001",
      title: "Thông tin thẻ ngân hàng & tài khoản",
      content: "Số tài khoản: 1903xxxxxx - Ngân hàng Techcombank (Chi nhánh TP.HCM)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(privateNotesPath, JSON.stringify(defaultPrivate, null, 2), 'utf8');
}

// 4. Khởi tạo dữ liệu mẫu cho các chủ đề công khai
const initSampleTopic = (topic, sampleNotes) => {
  const filePath = path.join(notesDir, `${topic}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(sampleNotes, null, 2), 'utf8');
  }
};

initSampleTopic('hoc-tap', [
  {
    id: "note-ht-1",
    title: "Kế hoạch bảo vệ đồ án Web",
    content: "Chuẩn bị Slide thuyết trình, phân công kịch bản 4 người, kiểm tra server và client trước 30 phút.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "note-ht-2",
    title: "Ôn tập kiến trúc React SPA",
    content: "Nắm vững luồng State, Props, useEffect, Context API và cách kết nối RESTful API với Express.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]);

initSampleTopic('cong-viec', [
  {
    id: "note-cv-1",
    title: "Rà soát mã nguồn Sprint 4",
    content: "Xóa console.log thừa, kiểm tra lại file README.md và xuất file zip nộp bài.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]);

initSampleTopic('ca-nhan', [
  {
    id: "note-cn-1",
    title: "Mục tiêu tuần này",
    content: "Tập thuyết trình cùng nhóm qua Google Meet ít nhất 2 lần để khớp thời gian 12-15 phút.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]);

// Helper: Lấy đường dẫn file JSON theo chủ đề
const getTopicFilePath = (topic) => path.join(notesDir, `${topic}.json`);

// ==========================================
// API CHO SPRINT 1 (PROFILE)
// ==========================================

// API 1: Đọc thông tin Profile
app.get('/api/profile', (req, res) => {
  try {
    const rawData = fs.readFileSync(profilePath, 'utf8');
    const profile = JSON.parse(rawData);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc file profile", error: error.message });
  }
});

// API 2: Cập nhật Profile
app.put('/api/profile', (req, res) => {
  try {
    const newProfile = req.body;
    fs.writeFileSync(profilePath, JSON.stringify(newProfile, null, 2), 'utf8');
    res.json({ success: true, message: "Đã cập nhật Profile thành công", data: newProfile });
  } catch (error) {
    res.status(500).json({ message: "Lỗi ghi file profile", error: error.message });
  }
});

// ==========================================
// BỔ SUNG API CHO SPRINT 2 (PUBLIC NOTES)
// ==========================================

/**
 * THẺ 2 (BE): API GET /api/notes/:topic
 * MÔ TẢ: Lấy danh sách ghi chú theo chủ đề
 */
app.get('/api/notes/:topic', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    // Nếu file chưa tồn tại -> Trả về mảng rỗng []
    if (!fs.existsSync(filePath)) {
      return res.json([]);
    }
    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc danh sách ghi chú", error: error.message });
  }
});

/**
 * THẺ 2 (BE): API POST /api/notes/:topic
 * MÔ TẢ: Thêm mới ghi chú vào chủ đề
 */
app.post('/api/notes/:topic', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    let notes = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];

    // Thẻ 1 & 2: Tạo object ghi chú mới
    const newNote = {
      id: Date.now().toString(), // Sinh id ngẫu nhiên bằng chuỗi thời gian
      title: req.body.title ? req.body.title.trim() : "Không tiêu đề",
      content: req.body.content ? req.body.content.trim() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Đẩy ghi chú mới vào đầu mảng
    notes.unshift(newNote);

    // Lưu đè lại vào file JSON
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf8');
    res.status(201).json({ success: true, message: "Thêm ghi chú thành công", note: newNote });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm ghi chú mới", error: error.message });
  }
});

/**
 * THẺ 3 (BE): API PUT /api/notes/:topic/:id
 * MÔ TẢ: Sửa ghi chú theo ID
 */
app.put('/api/notes/:topic/:id', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  const { id } = req.params;

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Không tìm thấy chủ đề" });
    }

    let notes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const index = notes.findIndex(n => n.id === id);

    if (index !== -1) {
      // Cập nhật nội dung & thời gian sửa đổi (updatedAt)
      notes[index].title = req.body.title !== undefined ? req.body.title.trim() : notes[index].title;
      notes[index].content = req.body.content !== undefined ? req.body.content.trim() : notes[index].content;
      notes[index].updatedAt = new Date().toISOString();

      // Lưu lại file
      fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf8');
      return res.json({ success: true, message: "Đã sửa ghi chú thành công", note: notes[index] });
    }

    res.status(404).json({ message: "Không tìm thấy ghi chú cần sửa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật ghi chú", error: error.message });
  }
});

/**
 * THẺ 3 (BE): API DELETE /api/notes/:topic/:id
 * MÔ TẢ: Xóa ghi chú theo ID bằng filter()
 */
app.delete('/api/notes/:topic/:id', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  const { id } = req.params;

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Không tìm thấy chủ đề" });
    }

    let notes = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Lọc bỏ phần tử có id trùng khớp
    const filteredNotes = notes.filter(n => n.id !== id);

    // Lưu mảng mới lại vào file
    fs.writeFileSync(filePath, JSON.stringify(filteredNotes, null, 2), 'utf8');
    res.json({ success: true, message: "Đã xóa ghi chú thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa ghi chú", error: error.message });
  }
});

// Trang chủ hướng dẫn API
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NoteKeeper API - Sprint 2</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        h2 { color: #2563eb; }
        ul { list-style-type: square; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h2>NoteKeeper API - Sprint 2 (Public Notes Active)</h2>
      <p>Hệ thống API đã hoàn thiện đầy đủ các chức năng cho Ghi chú thông thường.</p>

      <h3>Cấu hình (Sprint 1)</h3>
      <ul>
        <li><a href="${baseUrl}/api/profile">${baseUrl}/api/profile</a> - Cấu hình người dùng (GET/PUT)</li>
      </ul>

      <h3>Ghi chú công khai (Sprint 2)</h3>
      <ul>
        <li><a href="${baseUrl}/api/notes/hoc-tap">${baseUrl}/api/notes/hoc-tap</a> - Ghi chú học tập (GET/POST)</li>
        <li><a href="${baseUrl}/api/notes/cong-viec">${baseUrl}/api/notes/cong-viec</a> - Ghi chú công việc (GET/POST)</li>
        <li><a href="${baseUrl}/api/notes/ca-nhan">${baseUrl}/api/notes/ca-nhan</a> - Ghi chú cá nhân (GET/POST)</li>
        <li><code>PUT / DELETE</code> <code>${baseUrl}/api/notes/:topic/:id</code> - Cập nhật / Xóa ghi chú</li>
      </ul>

      <h3>Ghi chú riêng tư (Sprint 3)</h3>
      <ul>
        <li><a href="${baseUrl}/api/private/notes">${baseUrl}/api/private/notes</a> - Danh sách ghi chú riêng tư</li>
        <li><a href="${baseUrl}/api/private/auth">${baseUrl}/api/private/auth</a> - Đường dẫn xác thực mật khẩu</li>
      </ul>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` [BACKEND - SPRINT 2] Máy chủ chạy tại: http://localhost:${PORT}`);
  console.log(` Dữ liệu JSON lưu tại: ${dataDir}`);
  console.log(`=======================================================`);
});