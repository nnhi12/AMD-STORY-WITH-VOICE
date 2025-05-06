const mongoose = require('mongoose');
const accountModel = require('../models/Account');
const userModel = require('../models/User');
const Subscription = require('../models/Subcription');

async function createAdditionalAccounts() {
    try {
        // Kết nối đến MongoDB
        await mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        // Danh sách ID categories hiện có
        const categoryIds = [
            "6709657175756f0c40c74377", "670966a875756f0c40c74378", "6709672675756f0c40c74379",
            "670967f075756f0c40c7437a", "6709683875756f0c40c7437b", "673e2b23384a35dbcaed98a5",
            "673e2b47384a35dbcaed98ab", "673e2b58384a35dbcaed98ad", "67403260f3e34ae3d62d05a2",
            "6740beaedc0bae493a7974e8", "6749483145e61a10d1b7e910", "6749484a45e61a10d1b7e913",
            "6749485945e61a10d1b7e916", "67fe68a99b3a7e6b6581bcbd", "67fe76b91266b869eb25f9bf"
        ];

        // Tạo 36 tài khoản mới
        for (let i = 0; i < 36; i++) {
            const username = `user${24 + i + 1}`; // Tạo username từ user25 đến user60
            const password = `password${24 + i + 1}`; // Mật khẩu ngẫu nhiên
            const email = `user${24 + i + 1}@example.com`; // Email ngẫu nhiên
            const age = Math.floor(Math.random() * 50) + 18; // Độ tuổi từ 18-67
            const gender = ['male', 'female', 'other'][Math.floor(Math.random() * 3)]; // Giới tính ngẫu nhiên

            // Số lượng preferred_categories ngẫu nhiên từ 1-5
            const numCategories = Math.floor(Math.random() * 5) + 1;
            const preferredCategories = [];
            for (let j = 0; j < numCategories; j++) {
                const randomIndex = Math.floor(Math.random() * categoryIds.length);
                preferredCategories.push(categoryIds[randomIndex]);
            }
            // Loại bỏ trùng lặp trong preferred_categories
            const uniqueCategories = [...new Set(preferredCategories)];

            // Tạo tài khoản
            const account = await accountModel.create({
                username,
                password,
                role: 'user',
                status: true, // Tài khoản hoạt động ngay
            });

            // Tạo user
            const user = await userModel.create({
                account: account._id,
                fullname: `User ${24 + i + 1}`,
                email,
                age,
                gender,
                preferred_categories: uniqueCategories,
            });

            // Tạo subscription
            await Subscription.create({
                account: account._id,
                start_date: null,
                expired_date: null,
            });

            console.log(`Created account: ${username}, user: ${user.fullname}, with ${uniqueCategories.length} categories`);
        }

        console.log('Successfully created 36 additional accounts.');
    } catch (error) {
        console.error('Error creating accounts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createAdditionalAccounts();