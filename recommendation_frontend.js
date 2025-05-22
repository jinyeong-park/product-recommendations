// 프론트엔드에서 추천 시스템을 호출하는 JavaScript 코드

class RecommendationService {
  constructor(functionUrl) {
    this.functionUrl = functionUrl; // Cloud Function URL
  }

  async getRecommendations(type, options = {}) {
    try {
      const params = new URLSearchParams({
        type: type,
        limit: options.limit || 5,
        ...(options.productId && { productId: options.productId }),
        ...(options.userHistory && { userHistory: JSON.stringify(options.userHistory) })
      });

      const response = await fetch(`${this.functionUrl}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return data.recommendations;
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      return [];
    }
  }

  // 인기 상품 추천
  async getPopularProducts(limit = 5) {
    return this.getRecommendations('popular', { limit });
  }

  // 유사한 상품 추천 (같은 카테고리)
  async getSimilarProducts(productId, limit = 3) {
    return this.getRecommendations('similar', { productId, limit });
  }

  // 관련 상품 추천 (태그 기반)
  async getRelatedProducts(productId, limit = 3) {
    return this.getRecommendations('related', { productId, limit });
  }

  // 가격대별 추천
  async getPriceRangeProducts(productId, limit = 3) {
    return this.getRecommendations('price-range', { productId, limit });
  }

  // 개인화 추천
  async getPersonalizedRecommendations(userHistory, limit = 5) {
    return this.getRecommendations('personalized', { userHistory, limit });
  }
}

// 사용 예시
const recommendationService = new RecommendationService('YOUR_CLOUD_FUNCTION_URL');

// HTML에 추천 상품을 표시하는 함수
async function displayRecommendations(containerId, recommendations, title) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = `<h3>${title}</h3><div class="recommendations-grid">`;
  
  recommendations.forEach(product => {
    html += `
      <div class="recommendation-item" onclick="viewProduct(${product.id})">
        <div class="product-info">
          <h4>${product.name}</h4>
          <p class="category">${product.category}</p>
          <p class="price">$${product.price}</p>
          <div class="tags">
            ${product.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// 페이지 로드시 인기 상품 표시
document.addEventListener('DOMContentLoaded', async () => {
  const popularProducts = await recommendationService.getPopularProducts(4);
  displayRecommendations('popular-products', popularProducts, 'Popular Products');
});

// 상품 상세 페이지에서 관련 상품 표시
async function showProductRecommendations(productId) {
  const [similar, related] = await Promise.all([
    recommendationService.getSimilarProducts(productId, 3),
    recommendationService.getRelatedProducts(productId, 3)
  ]);

  displayRecommendations('similar-products', similar, 'Similar Products');
  displayRecommendations('related-products', related, 'You Might Also Like');
}

// 사용자 개인화 추천 (로그인 사용자용)
async function showPersonalizedRecommendations() {
  // 로컬 스토리지에서 사용자 히스토리 가져오기
  const userHistory = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
  
  if (userHistory.length > 0) {
    const personalized = await recommendationService.getPersonalizedRecommendations(userHistory, 5);
    displayRecommendations('personalized-products', personalized, 'Recommended for You');
  }
}

// 상품 조회시 히스토리에 저장
function trackProductView(productId) {
  const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
  
  // 중복 제거하고 최신 상품을 앞에 추가
  const updatedHistory = [productId, ...viewedProducts.filter(id => id !== productId)].slice(0, 10);
  
  localStorage.setItem('viewedProducts', JSON.stringify(updatedHistory));
}

// 상품 클릭 핸들러
function viewProduct(productId) {
  trackProductView(productId);
  // 상품 상세 페이지로 이동
  window.location.href = `/product/${productId}`;
}

// CSS 스타일 (추천 섹션용)
const recommendationStyles = `
<style>
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.recommendation-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recommendation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.product-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.category {
  color: #666;
  font-size: 0.9em;
  margin: 0.25rem 0;
}

.price {
  font-weight: bold;
  color: #007bff;
  font-size: 1.1em;
  margin: 0.5rem 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.tag {
  background-color: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8em;
  color: #555;
}
</style>
`;

// 스타일을 페이지에 추가
document.head.insertAdjacentHTML('beforeend', recommendationStyles);