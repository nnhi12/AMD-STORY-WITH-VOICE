const mongoose = require('mongoose');
const Story = require('../models/Story');
const User = require('../models/User');
const natural = require('natural');
const { getCachedRecommendations, saveRecommendationsToCache } = require('./cache');

const TfIdf = natural.TfIdf;

// Hàm gợi ý truyện dựa trên nội dung
async function contentBasedRecommend(userId, topN = 5, trainStories = null) {
    // Kiểm tra cache trước
    const cached = await getCachedRecommendations(userId, 'content-based');
    if (cached) return cached;

    try {
        console.log('Bắt đầu gợi ý dựa trên nội dung cho user:', userId);

        // Kiểm tra userId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('userId không hợp lệ');
        }

        // Lấy thông tin người dùng và truyện đã đọc/danh mục ưa thích
        const user = await User.findById(userId).populate('story_reading preferred_categories');
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        // Lấy danh sách truyện, chỉ lấy các trường cần thiết
        const stories = await Story.find({}, 'description categories view createdAt')
            .populate('categories');
        if (!stories.length) {
            return [];
        }

        // Xử lý cold-start: Người dùng chưa đọc truyện nhưng có danh mục ưa thích
        if (!user.story_reading.length && user.preferred_categories.length) {
            const filteredStories = stories
                .filter(story => story.categories.some(cat => 
                    user.preferred_categories.some(pc => pc._id.equals(cat._id))))
                .sort((a, b) => (b.view || 0) - (a.view || 0) || b.createdAt - a.createdAt); // Sắp xếp theo view, nếu không có thì theo ngày tạo
            const results = filteredStories.slice(0, topN);
            await saveRecommendationsToCache(userId, 'content-based', results);
            return results;
        }

        // Sử dụng tập train nếu có, nếu không thì dùng story_reading
        const storiesToUse = trainStories || user.story_reading;

        // Tạo TF-IDF, sử dụng cache nếu có
        let tfidf = global.tfidfCache || new TfIdf();
        if (!global.tfidfCache) {
            stories.forEach(story => {
                // Chỉ sử dụng description và categories (bỏ tags)
                const text = `${story.description || ''} ${story.categories.map(c => c.name || '').join(' ')}`;
                tfidf.addDocument(text || '');
            });
            global.tfidfCache = tfidf; // Lưu ý: Cần cơ chế làm mới cache khi dữ liệu truyện thay đổi
        }

        // Tạo vector hồ sơ người dùng từ các truyện đã đọc
        const userDocs = storiesToUse.map(story => {
            const index = stories.findIndex(s => s._id.equals(story._id));
            return tfidf.documents[index] || {};
        });
        const userVector = userDocs.reduce((acc, doc) => {
            Object.keys(doc).forEach(key => {
                acc[key] = (acc[key] || 0) + (doc[key] || 0);
            });
            return acc;
        }, {});

        // Tính điểm tương đồng cho từng truyện
        const similarities = stories.map((story, index) => {
            let score = 0;
            Object.keys(userVector).forEach(term => {
                score += (userVector[term] || 0) * (tfidf.tfidf(term, index) || 0);
            });
            // Tăng điểm nếu truyện thuộc danh mục ưa thích
            if (user.preferred_categories.length) {
                const matches = story.categories.filter(cat => 
                    user.preferred_categories.some(pc => pc._id.equals(cat._id))).length;
                score += matches * 0.2; // Trọng số có thể tùy chỉnh
            }
            return { id: story._id, score };
        });

        // Lọc truyện chưa đọc
        const unreadStories = stories.filter(story => 
            !storiesToUse.some(s => s._id.equals(story._id)));
        
        // Sắp xếp và lấy top N truyện
        const topStories = unreadStories
            .map(story => ({
                id: story._id,
                score: similarities.find(s => s.id.equals(story._id)).score,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
            .map(s => s.id);

        // Lấy thông tin chi tiết của các truyện được gợi ý
        const results = await Story.find({ _id: { $in: topStories } })
            .populate('categories');
        
        // Lưu vào cache
        await saveRecommendationsToCache(userId, 'content-based', results);
        return results;
    } catch (error) {
        console.error('Lỗi trong contentBasedRecommend:', error.message);
        throw new Error(`Không thể tạo gợi ý: ${error.message}`);
    }
}

module.exports = { contentBasedRecommend };