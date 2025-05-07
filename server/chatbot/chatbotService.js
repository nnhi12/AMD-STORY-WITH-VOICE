const express = require('express');
const tf = require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const router = express.Router();

// Danh sách mẫu lệnh với ý định tương ứng
const commandTemplates = [
  { text: 'mở trang chủ', intent: 'navigate_home' },
  { text: 'vào trang chủ', intent: 'navigate_home' },
  { text: 'đi đến thư viện', intent: 'navigate_library' },
  { text: 'mở thư viện truyện', intent: 'navigate_library' },
  { text: 'mở thư viện chuyện', intent: 'navigate_library' },
  { text: 'truyện hot nhất', intent: 'navigate_tophot' },
  { text: 'chuyện hot nhất', intent: 'navigate_tophot' },
  { text: 'xem truyện nổi bật', intent: 'navigate_tophot' },
  { text: 'danh sách truyện theo dõi', intent: 'navigate_favpage' },
  { text: 'danh sách chuyện theo dõi', intent: 'navigate_favpage' },
  { text: 'truyện đang theo dõi', intent: 'navigate_favpage' },
  { text: 'tìm truyện', intent: 'search_story' },
  { text: 'tìm chuyện', intent: 'search_story' },
  { text: 'tìm kiếm truyện', intent: 'search_story' },
  { text: 'tìm kiếm chuyện', intent: 'search_story' },
  { text: 'gợi ý truyện', intent: 'navigate_recommend' },
  { text: 'gợi ý chuyện', intent: 'navigate_recommend' },
  { text: 'đề xuất truyện', intent: 'navigate_recommend' },
  { text: 'truyện theo độ tuổi', intent: 'navigate_by_age' },
  { text: 'chuyện theo độ tuổi', intent: 'navigate_by_age' },
  { text: 'truyện theo tuổi', intent: 'navigate_by_age' },
  { text: 'truyện cho trẻ em', intent: 'navigate_for_kids' },
  { text: 'chuyện cho trẻ em', intent: 'navigate_for_kids' },
  { text: 'có truyện cho trẻ em không', intent: 'navigate_for_kids' },
  { text: 'bạn có truyện cho trẻ em không', intent: 'navigate_for_kids' },
  { text: 'có chuyện cho trẻ em không', intent: 'navigate_for_kids' },
  { text: 'bạn có chuyện cho trẻ em không', intent: 'navigate_for_kids' },
  { text: 'truyện thiếu nhi', intent: 'navigate_for_kids' },
  { text: 'chuyện thiếu nhi', intent: 'navigate_for_kids' },
  { text: 'nhập độ tuổi', intent: 'navigate_by_age_input' },
  { text: 'chọn độ tuổi', intent: 'navigate_by_age_input' },
  { text: 'truyện theo giới tính', intent: 'navigate_by_gender' },
  { text: 'chuyện theo giới tính', intent: 'navigate_by_gender' },
  { text: 'truyện cho nam', intent: 'navigate_by_gender' },
  { text: 'truyện cho nữ', intent: 'navigate_by_gender' },
  { text: 'thể loại truyện', intent: 'navigate_genre' },
  { text: 'thể loại chuyện', intent: 'navigate_genre' },
  { text: 'mở thể loại', intent: 'navigate_genre' },
  { text: 'thêm vào danh sách đọc', intent: 'add_to_reading_list' },
  { text: 'thêm truyện vào danh sách', intent: 'add_to_reading_list' },
  { text: 'thêm chuyện vào danh sách', intent: 'add_to_reading_list' },
  { text: 'theo dõi truyện', intent: 'follow_story' },
  { text: 'theo dõi chuyện', intent: 'follow_story' },
  { text: 'đọc thông tin trang', intent: 'read_page_info' },
  { text: 'xem thông tin trang', intent: 'read_page_info' },
  { text: 'đọc danh sách truyện', intent: 'read_story_list' },
  { text: 'đọc danh sách chuyện', intent: 'read_story_list' },
  { text: 'xem danh sách truyện', intent: 'read_story_list' },
  { text: 'xóa truyện', intent: 'remove_from_library' },
  { text: 'xóa chuyện', intent: 'remove_from_library' },
  { text: 'xóa truyện khỏi thư viện', intent: 'remove_from_library' },
  { text: 'đăng xuất', intent: 'logout' },
  { text: 'thoát tài khoản', intent: 'logout' },
  { text: 'đọc từ đầu', intent: 'read_from_start' },
  { text: 'bắt đầu đọc', intent: 'read_from_start' },
  { text: 'chương mới nhất', intent: 'read_latest' },
  { text: 'mở chương mới', intent: 'read_latest' },
  { text: 'đọc tiếp', intent: 'continue_reading' },
  { text: 'tiếp tục đọc', intent: 'continue_reading' },
  { text: 'chương trước', intent: 'previous_chapter' },
  { text: 'quay lại chương', intent: 'previous_chapter' },
  { text: 'chương tiếp', intent: 'next_chapter' },
  { text: 'chương kế tiếp', intent: 'next_chapter' },
  { text: 'danh sách chương', intent: 'chapter_list' },
  { text: 'xem danh sách chương', intent: 'chapter_list' },
  { text: 'nghe truyện', intent: 'read_chapter' },
  { text: 'nghe chuyện', intent: 'read_chapter' },
  { text: 'phát truyện', intent: 'read_chapter' },
  { text: 'dừng nghe', intent: 'stop_reading' },
  { text: 'tạm dừng truyện', intent: 'stop_reading' },
  { text: 'tiếp tục nghe', intent: 'continue_reading_chapter' },
  { text: 'bình luận truyện', intent: 'comment' },
  { text: 'bình luận chuyện', intent: 'comment' },
  { text: 'viết bình luận', intent: 'comment' },
  { text: 'đăng bình luận', intent: 'submit_comment' },
  { text: 'gửi bình luận', intent: 'submit_comment' },
  { text: 'nhập bình luận', intent: 'input_comment' },
  { text: 'đánh giá sao', intent: 'rate_story' },
  { text: 'chấm điểm truyện', intent: 'rate_story' },
  { text: 'mở trang thanh toán', intent: 'navigate_payment' },
  { text: 'xem thanh toán', intent: 'navigate_payment' },
  { text: 'mở thông tin người dùng', intent: 'navigate_userinfo' },
  { text: 'xem thông tin cá nhân', intent: 'navigate_userinfo' },
  { text: 'chỉnh sửa thông tin', intent: 'edit_userinfo' },
  { text: 'cập nhật thông tin', intent: 'edit_userinfo' },
  { text: 'nhập họ tên', intent: 'input_fullname' },
  { text: 'điền họ tên', intent: 'input_fullname' },
  { text: 'nhạc họ tên', intent: 'input_fullname' },
  { text: 'nạp họ tên', intent: 'input_fullname' },
  { text: 'nhập email', intent: 'input_email' },
  { text: 'điền email', intent: 'input_email' },
  { text: 'nhập tuổi', intent: 'input_age' },
  { text: 'điền tuổi', intent: 'input_age' },
  { text: 'chọn giới tính', intent: 'select_gender' },
  { text: 'điền giới tính', intent: 'select_gender' },
  { text: 'chọn thể loại yêu thích', intent: 'select_preferred_categories' },
  { text: 'lưu thông tin', intent: 'save_userinfo' },
  { text: 'cập nhật thông tin cá nhân', intent: 'save_userinfo' },
  // Mẫu câu hỏi mở
  { text: 'tác giả viết truyện mới', intent: 'story_related_unknown' },
  { text: 'tác giả viết chuyện mới', intent: 'story_related_unknown' },
  { text: 'truyện có phần tiếp theo', intent: 'story_related_unknown' },
  { text: 'chuyện có phần tiếp theo', intent: 'story_related_unknown' },
  { text: 'tác giả là ai', intent: 'story_related_unknown' },
  { text: 'truyện này thế nào', intent: 'story_related_unknown' },
  { text: 'chuyện này thế nào', intent: 'story_related_unknown' },
  { text: 'truyện này có hay không', intent: 'story_related_unknown' },
  { text: 'nội dung truyện là gì', intent: 'story_related_unknown' },
  { text: 'nội dung chuyện là gì', intent: 'story_related_unknown' },
];

// Danh sách từ khóa liên quan đến truyện
const storyRelatedKeywords = [
  'truyện', 'chuyện', 'chương', 'thể loại', 'đọc', 'bình luận', 'đánh giá', 'tìm',
  'gợi ý', 'theo dõi', 'thư viện', 'trang chủ', 'hot', 'tuổi', 'giới tính',
  'nghe', 'dừng', 'tiếp tục', 'xóa', 'đăng xuất', 'đăng nhập', 'tác giả',
  'thanh toán', 'thông tin người dùng', 'truyện tranh', 'tiểu thuyết',
  'sách', 'nội dung', 'cốt truyện', 'nhân vật', 'mới nhất', 'phổ biến', 'hay',
  'miễn phí', 'trả phí', 'hài hước', 'kinh dị', 'lãng mạn', 'phiêu lưu', 'khoa học',
  'viễn tưởng', 'trẻ em', 'thiếu nhi', 'người lớn', 'email', 'họ tên', 'tuổi', 'giới tính'
];

// Lưu trữ ngữ cảnh đơn giản (dựa trên session ID)
const sessionContext = new Map();

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

// Hàm tính khoảng cách Levenshtein
function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

// Hàm chuẩn hóa đầu vào
function normalizeInput(transcriptLower) {
  if (transcriptLower.includes('tìm ') || 
      transcriptLower.includes('mở ') || 
      transcriptLower.includes('đọc ') || 
      transcriptLower.includes('nghe ') || 
      transcriptLower.includes('theo dõi ') ||
      transcriptLower.includes('thư viện') ||
      transcriptLower.includes('trẻ em') ||
      transcriptLower.includes('thiếu nhi')) {
    return transcriptLower.replace(/\bchuyện\b/g, 'truyện');
  }
  return transcriptLower;
}

// Hàm kiểm tra xem câu có phải là câu hỏi mở
function isQuestion(transcriptLower, templateEmbeddings, transcriptEmbedding) {
  const questionIndicators = [
    'chứ', 'không', 'à', 'sẽ', 'là ai', 'thế nào', 'khi nào', 'ở đâu', 'tại sao',
    'bao giờ', 'cái gì', 'ai', 'nào', 'làm sao', 'hả', 'gì', 'bao nhiêu', 'như thế nào'
  ];
  const isPotentialQuestion = questionIndicators.some(indicator => transcriptLower.includes(indicator)) ||
                             transcriptLower.startsWith('ai ') ||
                             transcriptLower.startsWith('cái gì ') ||
                             transcriptLower.startsWith('ở đâu ') ||
                             transcriptLower.endsWith('?');

  if (!isPotentialQuestion) {
    return false;
  }

  // Kiểm tra xem có khớp với mẫu điều hướng không
  let maxSimilarity = -1;
  let isNavigationIntent = false;

  for (let i = 0; i < commandTemplates.length; i++) {
    if (['navigate_for_kids', 'navigate_by_age', 'navigate_by_gender', 'navigate_genre', 'navigate_library'].includes(commandTemplates[i].intent)) {
      const similarity = cosineSimilarity(
        transcriptEmbedding.slice([0, 0], [1, -1]),
        templateEmbeddings.slice([i, 0], [1, -1])
      );
      console.log(`Checking navigation intent: ${commandTemplates[i].text}, Similarity: ${similarity}`);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
      if (similarity > 0.8) { // Giảm ngưỡng cho điều hướng
        isNavigationIntent = true;
        break;
      }
    }
  }

  console.log(`Is potential question: ${isPotentialQuestion}, Is navigation intent: ${isNavigationIntent}, Max similarity: ${maxSimilarity}`);
  return isPotentialQuestion && !isNavigationIntent;
}

// Hàm kiểm tra khớp từ khóa dự phòng
function keywordMatch(transcriptLower, commandText) {
  const commandWords = commandText.toLowerCase().split(' ').filter(word => word.length > 2);
  const mainKeywords = commandWords.filter(word => !['truyện', 'chuyện'].includes(word));
  const secondaryKeywords = commandWords.filter(word => ['truyện', 'chuyện'].includes(word));
  const matchedMain = mainKeywords.filter(word => 
    transcriptLower.includes(word) || 
    mainKeywords.some(cmdWord => levenshteinDistance(word, cmdWord) <= 2)
  );
  const matchedSecondary = secondaryKeywords.filter(word => 
    transcriptLower.includes(word) || 
    transcriptLower.includes('truyện') || 
    transcriptLower.includes('chuyện') || 
    secondaryKeywords.some(cmdWord => levenshteinDistance(word, cmdWord) <= 2)
  );
  return matchedMain.length === mainKeywords.length && 
         (secondaryKeywords.length === 0 || matchedSecondary.length / secondaryKeywords.length >= 0.5);
}

// API xử lý lệnh thoại
router.post('/process-voice', async (req, res) => {
  const { transcript, sessionId } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Yêu cầu phải có nội dung lệnh' });
  }

  try {
    let transcriptLower = transcript.toLowerCase();
    console.log('Original transcript:', transcriptLower);
    transcriptLower = normalizeInput(transcriptLower);
    console.log('Normalized transcript:', transcriptLower);

    // Kiểm tra xem câu hỏi có liên quan đến truyện không
    const isStoryRelated = storyRelatedKeywords.some(keyword => transcriptLower.includes(keyword));
    console.log('Is story related:', isStoryRelated);

    if (!isStoryRelated) {
      return res.json({
        intent: 'unrelated',
        parameters: {},
        confidence: 1.0,
        message: 'Ôi, cái này mình không rành lắm đâu! Bạn muốn hỏi gì về truyện không?'
      });
    }

    // Nhúng lệnh người dùng
    const transcriptEmbedding = await model.embed([transcriptLower]);

    // Nhúng tất cả mẫu lệnh
    const templateTexts = commandTemplates.map(cmd => cmd.text.toLowerCase());
    const templateEmbeddings = await model.embed(templateTexts);

    // Kiểm tra xem có phải câu hỏi mở
    if (isQuestion(transcriptLower, templateEmbeddings, transcriptEmbedding)) {
      console.log('Detected as open-ended question:', transcriptLower);
      if (sessionId) {
        sessionContext.set(sessionId, { lastQuestion: transcriptLower });
      }
      return res.json({
        intent: 'story_related_unknown',
        parameters: {},
        confidence: 1.0,
        message: 'Câu hỏi này thú vị đấy! Mình sẽ hỏi người quản trị và gửi câu trả lời qua email của bạn nhé'
      });
    }

    // Tính độ tương đồng và kiểm tra ngữ cảnh
    let maxSimilarity = -1;
    let bestMatchIndex = -1;
    let keywordMatchIndex = -1;
    let contextBoost = 0;

    for (let i = 0; i < commandTemplates.length; i++) {
      const similarity = cosineSimilarity(
        transcriptEmbedding.slice([0, 0], [1, -1]),
        templateEmbeddings.slice([i, 0], [1, -1])
      );

      // Tăng similarity nếu lệnh liên quan đến ngữ cảnh
      if (sessionId && sessionContext.has(sessionId)) {
        const context = sessionContext.get(sessionId);
        if (['navigate_library', 'navigate_tophot', 'search_story', 'read_chapter'].includes(context.lastIntent)) {
          if (['search_story', 'navigate_tophot', 'read_chapter', 'follow_story', 'navigate_for_kids'].includes(commandTemplates[i].intent)) {
            contextBoost = 0.15;
          }
        }
      }

      if (similarity + contextBoost > maxSimilarity) {
        maxSimilarity = similarity + contextBoost;
        bestMatchIndex = i;
      }

      if (keywordMatch(transcriptLower, commandTemplates[i].text)) {
        keywordMatchIndex = i;
      }
    }

    if (maxSimilarity > 0.8 || keywordMatchIndex !== -1) { // Giảm ngưỡng cho điều hướng
      const matchedIndex = keywordMatchIndex !== -1 ? keywordMatchIndex : bestMatchIndex;
      const matchedCommand = commandTemplates[matchedIndex];
      const parameters = extractParameters(transcript, matchedCommand.text);
      if (sessionId) {
        sessionContext.set(sessionId, {
          lastIntent: matchedCommand.intent,
          lastParameters: parameters
        });
      }
      console.log('Transcript:', transcript, 'Best match:', matchedCommand.text, 'Similarity:', maxSimilarity);
      res.json({
        intent: matchedCommand.intent,
        parameters,
        confidence: maxSimilarity
      });
    } else {
      console.log('Story-related but no command match for:', transcript, 'Best similarity:', maxSimilarity);
      if (sessionId) {
        sessionContext.set(sessionId, { lastQuestion: transcriptLower });
      }
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
  let transcriptLower = transcript.toLowerCase();
  transcriptLower = normalizeInput(transcriptLower);

  if (commandText.includes('tìm') && (transcriptLower.startsWith('tìm ') || transcriptLower.startsWith('tìm kiếm '))) {
    params.storyName = transcript.slice(transcriptLower.startsWith('tìm ') ? 4 : 10).trim();
  }
  if (commandText.includes('thể loại') && (transcriptLower.startsWith('thể loại ') || transcriptLower.startsWith('mở thể loại '))) {
    params.genre = transcriptLower.replace('thể loại ', '').replace('mở thể loại ', '').trim();
  }
  if (commandText.includes('nhập độ tuổi') && (transcriptLower.startsWith('nhập tuổi ') || transcriptLower.startsWith('chọn tuổi '))) {
    const ageMatch = transcriptLower.match(/\d+/);
    params.age = ageMatch ? parseInt(ageMatch[0], 10) : transcriptLower.replace('nhập tuổi ', '').replace('chọn tuổi ', '').trim();
  }
  if (commandText.includes('nhập bình luận') && (transcriptLower.startsWith('nhập ') || transcriptLower.startsWith('viết '))) {
    params.comment = transcriptLower.replace('nhập ', '').replace('viết ', '').trim();
  }
  const ratingMatch = transcriptLower.match(/(\d+)\s*sao/);
  if (ratingMatch) {
    params.rating = parseInt(ratingMatch[1], 10);
  }
  if (transcriptLower.includes('chương') && !transcriptLower.includes('đánh giá')) {
    const parts = transcriptLower.split(' ').filter(part => part);
    const chapterIndex = parts.findIndex(part => part === 'chương');
    if (chapterIndex !== -1 && chapterIndex + 1 < parts.length) {
      params.chapterName = `Chương ${parts.slice(chapterIndex + 1).join(' ')}`;
    }
  }
  if (commandText.includes('xóa truyện') && transcriptLower.startsWith('xóa truyện ')) {
    params.storyName = transcriptLower.replace('xóa truyện ', '').trim();
  }
  if (commandText.includes('họ tên') && (
      transcriptLower.startsWith('nhập họ tên ') ||
      transcriptLower.startsWith('điền họ tên ') ||
      transcriptLower.startsWith('nhạc họ tên ') ||
      transcriptLower.startsWith('nạp họ tên ')
    )) {
    const prefixLength = transcriptLower.startsWith('nhập họ tên ') ? 12 :
                         transcriptLower.startsWith('điền họ tên ') ? 13 :
                         transcriptLower.startsWith('nhạc họ tên ') ? 12 : 11;
    params.fullname = transcript.slice(prefixLength).trim();
  }
  if (commandText.includes('nhập email') && (transcriptLower.startsWith('nhập email ') || transcriptLower.startsWith('điền email '))) {
    params.email = transcript.slice(transcriptLower.startsWith('nhập email ') ? 11 : 12).trim();
  }
  if (commandText.includes('nhập tuổi') && (transcriptLower.startsWith('nhập tuổi ') || transcriptLower.startsWith('điền tuổi '))) {
    const ageMatch = transcriptLower.match(/\d+/);
    params.age = ageMatch ? parseInt(ageMatch[0], 10) : transcriptLower.replace('nhập tuổi ', '').replace('điền tuổi ', '').trim();
  }
  if (commandText.includes('chọn giới tính') && (transcriptLower.startsWith('chọn giới tính ') || transcriptLower.startsWith('điền giới tính '))) {
    params.gender = transcriptLower.replace('chọn giới tính ', '').replace('điền giới tính ', '').trim();
  }
  if (commandText.includes('chọn thể loại yêu thích') && transcriptLower.startsWith('chọn thể loại yêu thích ')) {
    params.preferred_categories = transcriptLower.replace('chọn thể loại yêu thích ', '').trim().split(',').map(cat => cat.trim());
  }
  if ((commandText.includes('theo dõi truyện') || commandText.includes('thêm vào danh sách')) && transcriptLower.includes('truyện ')) {
    const storyIndex = transcriptLower.indexOf('truyện ') + 7;
    params.storyName = transcript.slice(storyIndex).trim();
  }

  return params;
}

module.exports = router;