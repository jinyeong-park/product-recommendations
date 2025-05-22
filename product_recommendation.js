const functions = require('@google-cloud/functions-framework');

// 샘플 제품 데이터 (실제로는 데이터베이스에서 가져옴)
const products = [
  { id: 1, name: "Laptop", category: "electronics", price: 999, tags: ["computer", "work", "portable"] },
  { id: 2, name: "Mouse", category: "electronics", price: 25, tags: ["computer", "accessory"] },
  { id: 3, name: "Keyboard", category: "electronics", price: 75, tags: ["computer", "typing", "work"] },
  { id: 4, name: "T-Shirt", category: "clothing", price: 20, tags: ["casual", "cotton"] },
  { id: 5, name: "Jeans", category: "clothing", price: 60, tags: ["casual", "denim"] },
  { id: 6, name: "Sneakers", category: "footwear", price: 80, tags: ["casual", "sport"] },
  { id: 7, name: "Headphones", category: "electronics", price: 150, tags: ["audio", "music"] },
  { id: 8, name: "Phone Case", category: "electronics", price: 15, tags: ["accessory", "protection"] },
  { id: 9, name: "Backpack", category: "accessories", price: 45, tags: ["travel", "school", "work"] },
  { id: 10, name: "Water Bottle", category: "accessories", price: 12, tags: ["hydration", "sport"] }
];

// 추천 알고리즘 함수들
function getRecommendationsByCategory(productId, limit = 3) {
  const product = products.find(p => p.id === productId);
  if (!product) return [];

  return products
    .filter(p => p.id !== productId && p.category === product.category)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, limit);
}

function getRecommendationsByTags(productId, limit = 3) {
  const product = products.find(p => p.id === productId);
  if (!product) return [];

  return products
    .filter(p => p.id !== productId)
    .map(p => {
      const commonTags = p.tags.filter(tag => product.tags.includes(tag));
      return { ...p, similarity: commonTags.length };
    })
    .filter(p => p.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function getRecommendationsByPriceRange(productId, limit = 3) {
  const product = products.find(p => p.id === productId);
  if (!product) return [];

  const priceRange = product.price * 0.3; // 30% 가격 범위
  
  return products
    .filter(p => p.id !== productId)
    .filter(p => Math.abs(p.price - product.price) <= priceRange)
    .sort(() => Math.random() - 0.5) // 랜덤 정렬
    .slice(0, limit);
}

function getPopularProducts(limit = 5) {
  // 실제로는 구매/조회 데이터 기반으로 정렬
  // 여기서는 가격 기준으로 인기도 시뮬레이션
  return products
    .sort((a, b) => {
      // 중간 가격대 제품들이 더 인기있다고 가정
      const aScore = Math.abs(a.price - 100);
      const bScore = Math.abs(b.price - 100);
      return aScore - bScore;
    })
    .slice(0, limit);
}

function getRecommendationsForUser(userHistory, limit = 5) {
  if (!userHistory || userHistory.length === 0) {
    return getPopularProducts(limit);
  }

  // 사용자 관심 카테고리 분석
  const categoryCount = {};
  const tagCount = {};
  
  userHistory.forEach(productId => {
    const product = products.find(p => p.id === productId);
    if (product) {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      product.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });

  // 가장 관심있는 카테고리와 태그 찾기
  const topCategory = Object.keys(categoryCount).reduce((a, b) => 
    categoryCount[a] > categoryCount[b] ? a : b, '');
  const topTags = Object.keys(tagCount)
    .sort((a, b) => tagCount[b] - tagCount[a])
    .slice(0, 3);

  // 추천 점수 계산
  const recommendations = products
    .filter(p => !userHistory.includes(p.id))
    .map(p => {
      let score = 0;
      
      // 카테고리 매칭
      if (p.category === topCategory) score += 3;
      
      // 태그 매칭
      const matchingTags = p.tags.filter(tag => topTags.includes(tag));
      score += matchingTags.length * 2;
      
      // 인기도 보너스 (중간 가격대)
      if (p.price >= 20 && p.price <= 100) score += 1;
      
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

// Cloud Function 엔드포인트
functions.http('productRecommendation', (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { type, productId, userHistory, limit } = req.method === 'GET' ? req.query : req.body;
    
    let recommendations = [];
    
    switch (type) {
      case 'similar':
        if (!productId) {
          return res.status(400).json({ error: 'productId is required for similar recommendations' });
        }
        recommendations = getRecommendationsByCategory(parseInt(productId), parseInt(limit) || 3);
        break;
        
      case 'related':
        if (!productId) {
          return res.status(400).json({ error: 'productId is required for related recommendations' });
        }
        recommendations = getRecommendationsByTags(parseInt(productId), parseInt(limit) || 3);
        break;
        
      case 'price-range':
        if (!productId) {
          return res.status(400).json({ error: 'productId is required for price-range recommendations' });
        }
        recommendations = getRecommendationsByPriceRange(parseInt(productId), parseInt(limit) || 3);
        break;
        
      case 'popular':
        recommendations = getPopularProducts(parseInt(limit) || 5);
        break;
        
      case 'personalized':
        const history = userHistory ? (Array.isArray(userHistory) ? userHistory : JSON.parse(userHistory)) : [];
        recommendations = getRecommendationsForUser(history, parseInt(limit) || 5);
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Invalid type. Use: similar, related, price-range, popular, or personalized' 
        });
    }
    
    res.json({
      success: true,
      type: type,
      recommendations: recommendations,
      count: recommendations.length
    });
    
  } catch (error) {
    console.error('Error in recommendation function:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// 로컬 테스트를 위한 코드
if (require.main === module) {
  const port = process.env.PORT || 8080;
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  app.use('/recommend', (req, res) => {
    functions.getFunction('productRecommendation')(req, res);
  });
  
  app.listen(port, () => {
    console.log(`Recommendation service running on port ${port}`);
    console.log('Test endpoints:');
    console.log('- GET /recommend?type=popular&limit=3');
    console.log('- GET /recommend?type=similar&productId=1&limit=3');
    console.log('- POST /recommend with body: {"type": "personalized", "userHistory": [1, 2, 3]}');
  });
}