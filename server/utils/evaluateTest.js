const mongoose = require('mongoose');
const { evaluateRecommendation } = require('../recommendation/evaluate');

async function runEvaluation() {
    try {
        await mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY');
        console.log('Connected to MongoDB');

        const userId = "67096f181d1798b007a92b1b"; // Thay bằng userId thực tế
        const result = await evaluateRecommendation(userId, 5, 5);
        console.log('Evaluation Results:');
        console.log('Content-based:', result.contentBased);
        console.log('Collaborative:', result.collaborative);
        console.log('Hybrid:', result.hybrid);
    } catch (err) {
        console.error('Error during evaluation:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

runEvaluation();