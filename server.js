require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo Twilio
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// API kiểm tra server còn sống không
app.get('/', (req, res) => {
  res.json({ status: 'Are you ok? Backend đang chạy! 💚' });
});

// API gửi SMS cảnh báo
app.post('/api/alert', async (req, res) => {
  const { contacts, username } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!contacts || contacts.length === 0) {
    return res.status(400).json({ error: 'Không có liên hệ nào' });
  }

  const results = [];

  for (const contact of contacts) {
    try {
      const message = await client.messages.create({
        body: `⚠️ CẢNH BÁO: ${username || 'Người dùng'} chưa phản hồi "Are you ok?" trong nhiều giờ. Hãy liên hệ kiểm tra họ ngay!`,
        from: process.env.TWILIO_PHONE,
        to: contact.phone,
      });

      results.push({
        phone: contact.phone,
        name: contact.name,
        status: 'sent',
        sid: message.sid,
      });

      console.log(`✅ Đã gửi SMS cho ${contact.name} - ${contact.phone}`);
    } catch (error) {
      results.push({
        phone: contact.phone,
        name: contact.name,
        status: 'failed',
        error: error.message,
      });
      console.error(`❌ Lỗi gửi SMS cho ${contact.name}:`, error.message);
    }
  }

  res.json({ success: true, results });
});

// API gửi SMS test
app.post('/api/test-sms', async (req, res) => {
  const { phone } = req.body;
  try {
    await client.messages.create({
      body: '💚 Test thành công từ Are you ok? App!',
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    res.json({ success: true, message: 'SMS test đã gửi!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});