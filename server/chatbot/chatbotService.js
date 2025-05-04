const express = require('express');
const tf = require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const router = express.Router();

// Danh sách mẫu lệnh với ý định tương ứng
const commandTemplates = [
  { text: 'mở trang chủ', intent: 'navigate_home' },
  { text: 'đi đến thư viện', intent: 'navigate_library' },
  { text: 'truyện hot nhất', intent: 'navigate_tophot' },
  { text: 'danh sách truyện theo dõi', intent: 'navigate_favpage' },
  { text: 'tìm', intent: 'search_story' },
  { text: 'gợi ý truyện', intent: 'navigate_recommend' },
  { text: 'truyện theo độ tuổi', intent: 'navigate_by_age' },
  { text: 'truyện cho trẻ em', intent: 'navigate_for_kids' },
  { text: 'nhập độ tuổi', intent: 'navigate_by_age_input' },
  { text: 'truyện theo giới tính', intent: 'navigate_by_gender' },
  { text: 'thể loại truyện', intent: 'navigate_genre' },
  { text: 'thêm vào danh sách đọc', intent: 'add_to_reading_list' },
  { text: 'theo dõi truyện', intent: 'follow_story' },
  { text: 'đọc thông tin trang', intent: 'read_page_info' },
  { text: 'đọc danh sách truyện', intent: 'read_story_list' },
  { text: 'xóa truyện', intent: 'remove_from_library' },
  { text: 'đăng xuất', intent: 'logout' },
  { text: 'đọc từ đầu', intent: 'read_from_start' },
  { text: 'chương mới nhất', intent: 'read_latest' },
  { text: 'đọc tiếp', intent: 'continue_reading' },
  { text: 'chương trước', intent: 'previous_chapter' },
  { text: 'chương tiếp', intent: 'next_chapter' },
  { text: 'danh sách chương', intent: 'chapter_list' },
  { text: 'nghe truyện', intent: 'read_chapter' },
  { text: 'dừng nghe', intent: 'stop_reading' },
  { text: 'tiếp tục nghe', intent: 'continue_reading_chapter' },
  { text: 'bình luận truyện', intent: 'comment' },
  { text: 'đăng bình luận', intent: 'submit_comment' },
  { text: 'nhập bình luận', intent: 'input_comment' },
  { text: 'đánh giá sao', intent: 'rate_story' },
  { text: 'mở trang thanh toán', intent: 'navigate_payment' }, // New command
  { text: 'mở thông tin người dùng', intent: 'navigate_userinfo' }, // New command
  //userinfo
  { text: 'chỉnh sửa thông tin', intent: 'edit_userinfo' },
  { text: 'nhập họ tên', intent: 'input_fullname' },
  { text: 'nhập email', intent: 'input_email' },
  { text: 'nhập tuổi', intent: 'input_age' },
  { text: 'chọn giới tính', intent: 'select_gender' },
  { text: 'chọn thể loại yêu thích', intent: 'select_preferred_categories' },
  { text: 'lưu thông tin', intent: 'save_userinfo' },
  // Thêm mẫu câu hỏi mở
  { text: 'tác giả viết truyện mới', intent: 'story_related_unknown' },
  { text: 'truyện có phần tiếp theo', intent: 'story_related_unknown' },
  { text: 'tác giả là ai', intent: 'story_related_unknown' },
  { text: 'truyện này thế nào', intent: 'story_related_unknown' },
];

// Danh sách từ khóa liên quan đến truyện
const storyRelatedKeywords = [
  'truyện', 'chương', 'thể loại', 'đọc', 'bình luận', 'đánh giá', 'tìm',
  'gợi ý', 'theo dõi', 'thư viện', 'trang chủ', 'hot', 'tuổi', 'giới tính',
  'nghe', 'dừng', 'tiếp tục', 'xóa', 'đăng xuất', 'đăng nhập', 'tác giả', 
  'chuyện', 'thanh toán', 'thông tin người dùng' // Added new keywords
];

// Tải mô hình Universal Sentence Encoder
let model;
(async () => {
  model = await use.load();
  console.log('Đã tải Universal Sentence Encoder');
})();

// Hàm tính độ tương đồng cosine
function cosineSimilarity(embeddings1, embeddings2) {
  const dotProduct = tf.sum(tf.mul(embeddings1, embeddings2));
  const norm1 = tf.norm(embeddings1);
  const norm2 = tf.norm(embeddings2);
  return dotProduct.div(norm1.mul(norm2)).dataSync()[0];
}

// Hàm kiểm tra xem câu có phải là câu hỏi
function isQuestion(transcriptLower) {
  const questionIndicators = [
    'chứ', 'không', 'à', 'sẽ', 'là ai', 'thế nào', 'khi nào', 'ở đâu', 'tại sao'
  ];
  return questionIndicators.some(indicator => transcriptLower.includes(indicator));
}

// API xử lý lệnh thoại
router.post('/process-voice', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Yêu cầu phải có nội dung lệnh' });
  }

  try {
    const transcriptLower = transcript.toLowerCase();

    // Kiểm tra xem câu hỏi có liên quan đến truyện không
    const isStoryRelated = storyRelatedKeywords.some(keyword => transcriptLower.includes(keyword));

    if (!isStoryRelated) {
      return res.json({
        intent: 'unrelated',
        parameters: {},
        confidence: 1.0,
        message: 'Ôi, cái này mình không rành lắm đâu! Bạn muốn hỏi gì về truyện không?'
      });
    }

    // Kiểm tra xem có phải câu hỏi
    if (isQuestion(transcriptLower)) {
      console.log('Detected as question:', transcriptLower);
      return res.json({
        intent: 'story_related_unknown',
        parameters: {},
        confidence: 1.0,
        message: 'Câu hỏi này thú vị đấy! Mình sẽ hỏi người quản trị và gửi câu trả lời qua email của bạn nhé'
      });
    }

    // Nhúng lệnh người dùng
    const transcriptEmbedding = await model.embed([transcriptLower]);

    // Nhúng tất cả mẫu lệnh
    const templateTexts = commandTemplates.map(cmd => cmd.text.toLowerCase());
    const templateEmbeddings = await model.embed(templateTexts);

    // Tính độ tương đồng
    let maxSimilarity = -1;
    let bestMatchIndex = -1;

    for (let i = 0; i < commandTemplates.length; i++) {
      const similarity = cosineSimilarity(
        transcriptEmbedding.slice([0, 0], [1, -1]),
        templateEmbeddings.slice([i, 0], [1, -1])
      );
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatchIndex = i;
      }
    }

    // Ngưỡng để coi là khớp
    if (maxSimilarity > 0.9) {
      const matchedCommand = commandTemplates[bestMatchIndex];
      const parameters = extractParameters(transcript, matchedCommand.text);
      console.log('Transcript:', transcript, 'Best match:', matchedCommand.text, 'Similarity:', maxSimilarity);
      res.json({
        intent: matchedCommand.intent,
        parameters,
        confidence: maxSimilarity
      });
    } else {
      console.log('Story-related but no command match for:', transcript, 'Best similarity:', maxSimilarity);
      res.json({
        intent: 'story_related_unknown',
        parameters: {},
        confidence: maxSimilarity,
        message: 'Câu hỏi này thú vị đấy! Mình sẽ hỏi người quản trị và gửi câu trả lời qua email của bạn nhé'
      });
    }
  } catch (error) {
    console.error('Lỗi xử lý lệnh thoại:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Hàm trích xuất tham số
function extractParameters(transcript, commandText) {
  const params = {};
  const transcriptLower = transcript.toLowerCase();

  // Trích xuất tên truyện khi tìm kiếm
  if (commandText.includes('tìm') && transcriptLower.startsWith('tìm ')) {
    params.storyName = transcript.slice(4).trim();
  }
  // Trích xuất thể loại
  if (commandText.includes('thể loại truyện') && (transcriptLower.startsWith('thể loại ') || transcriptLower.startsWith('mở thể loại '))) {
    params.genre = transcriptLower.replace('thể loại ', '').replace('mở thể loại ', '').trim();
  }
  // Trích xuất độ tuổi
  if (commandText.includes('nhập độ tuổi') && transcriptLower.startsWith('nhập tuổi ')) {
    params.age = transcriptLower.replace('nhập tuổi ', '').trim();
  }
  // Trích xuất nội dung bình luận
  if (commandText.includes('nhập bình luận') && transcriptLower.startsWith('nhập ')) {
    params.comment = transcriptLower.replace('nhập ', '').trim();
  }
  // Trích xuất đánh giá
  const ratingMatch = transcriptLower.match(/đánh giá (\d+)\s*sao/);
  if (ratingMatch) {
    params.rating = parseInt(ratingMatch[1], 10);
  }
  // Trích xuất tên chương (chỉ khi không phải lệnh đánh giá)
  if (transcriptLower.includes('chương') && !transcriptLower.includes('đánh giá')) {
    const parts = transcriptLower.split(' ').filter(part => part);
    const chapterIndex = parts.findIndex(part => part === 'chương');
    if (chapterIndex !== -1) {
      params.chapterName = `Chương ${parts.slice(chapterIndex + 1).join(' ')}`;
    }
  }
  // Trích xuất tên truyện để xóa
  if (commandText.includes('xóa truyện') && transcriptLower.startsWith('xóa truyện ')) {
    params.storyName = transcriptLower.replace('xóa truyện ', '').trim();
  }

  // Trích xuất họ tên
  if (commandText.includes('nhập họ tên') && transcriptLower.startsWith('nhập họ tên ')) {
    params.fullname = transcript.slice(12).trim();
  }
  // Trích xuất email
  if (commandText.includes('nhập email') && transcriptLower.startsWith('nhập email ')) {
    params.email = transcript.slice(11).trim();
  }
  // Trích xuất tuổi
  if (commandText.includes('nhập tuổi') && transcriptLower.startsWith('nhập tuổi ')) {
    params.age = transcriptLower.replace('nhập tuổi ', '').trim();
  }
  // Trích xuất giới tính
  if (commandText.includes('chọn giới tính') && transcriptLower.startsWith('chọn giới tính ')) {
    params.gender = transcriptLower.replace('chọn giới tính ', '').trim();
  }
  // Trích xuất thể loại yêu thích
  if (commandText.includes('chọn thể loại yêu thích') && transcriptLower.startsWith('chọn thể loại yêu thích ')) {
    params.preferred_categories = transcriptLower.replace('chọn thể loại yêu thích ', '').trim();
  }

  return params;
}

module.exports = router;