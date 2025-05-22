# 🛍️ Product Recommendations

간단하고 빠르게 배포 가능한 **제품 추천 시스템**입니다. 이 시스템은 다양한 추천 로직을 제공하며, 확장성과 통합이 용이합니다.

---

## 🎯 주요 기능

- **인기 상품 추천**: 메인 페이지용 정렬
- **유사 상품 추천**: 동일 카테고리 기반
- **관련 상품 추천**: 태그 유사도 기반
- **가격대별 추천**: 비슷한 가격대의 상품 필터링
- **개인화 추천**: 사용자 히스토리 기반 맞춤 추천

---

## ⚙️ 개발 및 구현 소요 시간

| 작업 항목                | 소요 시간 |
|--------------------------|------------|
| 기본 추천 알고리즘 구현     | 30분       |
| Cloud Function 설정 및 배포 | 30분       |
| 프론트엔드 통합 코드 작성   | 30분       |

총 개발 시간: **1~2시간 내외**

---

## 🚀 배포 및 실행 방법

### 1. 로컬 테스트
```bash
npm install
npm start
```

2. Google Cloud Functions에 배포

```bash
gcloud functions deploy productRecommendation \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated
```

4. 프론트엔드 웹앱 통합
```javascript
// 상품 상세 페이지에서 추천 결과 호출 예시
const similar = await recommendationService.getSimilarProducts(productId, 3);
displayRecommendations('similar-products', similar, 'Similar Products');
```

💡 알고리즘 설명

단순하지만 효과적인 필터링 기반 접근:
카테고리, 태그, 가격 정보를 활용한 정렬 및 필터링
확장성 보장:
향후 구매 이력, 행동 로그, 사용자 리뷰 등을 통한 고도화 가능
개인화 추천:
사용자별 클릭/구매 데이터를 분석하여 맞춤 상품 제시

📌 기술 스택

Node.js 18 (Google Cloud Function)
JavaScript (프론트엔드 연동)
Google Cloud Platform (배포 및 운영)

📎 추가 확장 아이디어

협업 필터링(Collaborative Filtering) 기반 추천 추가
벡터 임베딩 기반 유사도 측정 (예: Sentence Transformers)
A/B 테스트를 통한 추천 로직 개선
