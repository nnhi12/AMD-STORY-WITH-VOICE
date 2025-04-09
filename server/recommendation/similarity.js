function cosineSimilarity(user1, user2, matrix) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
  
    for (let story in matrix[user1]) {
      dotProduct += matrix[user1][story] * matrix[user2][story];
      norm1 += matrix[user1][story] ** 2;
      norm2 += matrix[user2][story] ** 2;
    }
  
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
  }
  
  function computeSimilarityMatrix(matrix) {
    const similarityMatrix = {};
    const users = Object.keys(matrix);
    for (let i = 0; i < users.length; i++) {
      similarityMatrix[users[i]] = {};
      for (let j = 0; j < users.length; j++) {
        if (i !== j) {
          similarityMatrix[users[i]][users[j]] = cosineSimilarity(users[i], users[j], matrix);
        }
      }
    }
    return similarityMatrix;
  }
  
  module.exports = { computeSimilarityMatrix };