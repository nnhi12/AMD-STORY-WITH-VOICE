from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Thông tin kết nối MongoDB
username = "reading_story_db"
password = "reading_story_db"
database = "READING_STORY"
collection_name = "stories"
cluster_url = "readingstory.yg6b6.mongodb.net"
connection_string = f"mongodb+srv://{username}:{password}@{cluster_url}/{database}?retryWrites=true&w=majority"

# Kết nối MongoDB
client = MongoClient(connection_string)
db = client[database]
collection = db[collection_name]

try:
    # Lấy dữ liệu từ MongoDB
    current_date = datetime.now()
    data = list(collection.find({"date_closed": {"$gt": current_date}}))
    if not data:
        raise ValueError("Không có dữ liệu từ MongoDB.")

    df_story = pd.DataFrame(data)

    # Bỏ kiểm tra và lọc date_closed, sử dụng toàn bộ dữ liệu
    df_filtered = df_story.copy()  # Không lọc theo date_closed nữa

    if df_filtered.empty:
        raise ValueError("Dữ liệu rỗng sau khi xử lý.")

    # Kết hợp các đặc trưng
    def combine_features(row):
        return f"{row.get('description', '')} {row.get('name', '')} {row.get('categories', '')} {row.get('status', '')}"

    df_filtered['combinedFeatures'] = df_filtered.apply(combine_features, axis=1)

    # Tạo ma trận TF-IDF
    tf = TfidfVectorizer()
    tfMatrix = tf.fit_transform(df_filtered['combinedFeatures'])

    # Tính độ tương đồng cosine
    similar = cosine_similarity(tfMatrix)

except Exception as e:
    print(f"Lỗi khởi tạo dữ liệu: {e}")
    df_filtered = pd.DataFrame()  # Tránh lỗi khi truy cập df_filtered rỗng
    similar = None  # Không tính toán độ tương đồng nếu không có dữ liệu

# API gợi ý truyện
@app.route('/api', methods=['GET'])
def get_data():
    if df_filtered.empty or similar is None:
        return jsonify({"error": "Không có dữ liệu để gợi ý."}), 500

    story_id = request.args.get("story_id")

    if not story_id:
        return jsonify({"error": "story_id is required"}), 400

    if not ObjectId.is_valid(story_id):
        return jsonify({"error": "Invalid story_id format"}), 400

    story_id = ObjectId(story_id)

    # Chuyển đổi _id về kiểu str để so sánh
    df_filtered["_id_str"] = df_filtered["_id"].astype(str)

    if str(story_id) not in df_filtered["_id_str"].values:
        return jsonify({"error": "Story not found in active stories"}), 404

    # Tìm index của truyện trong df_filtered
    index_story = df_filtered[df_filtered["_id_str"] == str(story_id)].index[0]
    similar_story = list(enumerate(similar[index_story]))

    # Sắp xếp theo độ tương đồng (bỏ chính nó)
    sorted_similar_story = sorted(similar_story, key=lambda x: x[1], reverse=True)[1:6]

    # Trả về kết quả
    results = [
        {
            "id": str(df_filtered.iloc[item[0]]["_id"]),
            "name": df_filtered.iloc[item[0]]["name"]
        }
        for item in sorted_similar_story
    ]

    return jsonify({"recommended_stories": results})

if __name__ == '__main__':
    app.run(port=5005, debug=True)
