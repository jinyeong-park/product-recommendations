# Product Recommendation Cloud Function 배포 가이드

## 1. 프로젝트 구조
```
recommendation-function/
├── index.js          # 메인 Cloud Function 코드
├── package.json      # 의존성 및 배포 설정
└── README.md         # 이 가이드
```

## 2. 로컬 테스트

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 로컬에서 테스트 실행
npm start

# 테스트 URL: http://localhost:8080
```

### 테스트 API 호출
```bash
# 인기 상품
curl "http://localhost:8080/recommend?type=popular&limit=3"

# 유사 상품
curl "http://localhost:8080/recommend?type=similar&productId=1&limit=3"

# 개인화 추천
curl -X POST "http://localhost:8080/recommend" \
  -H "Content-Type: application/json" \
  -d '{"type": "personalized", "userHistory": [1, 2, 3], "limit": 5}'
```

## 3. Google Cloud에 배포

### 전제 조건
- Google Cloud SDK 설치 및 인증
- Google Cloud 프로젝트 생성 및 선택
- Cloud Functions API 활성화

### 배포 명령어
```bash
# Google Cloud에 로그인 (필요시)
gcloud auth login

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# Cloud Function 배포
gcloud functions deploy productRecommendation \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --source . \
  --memory 256MB \
  --timeout 60s

# 또는 npm script 사용
npm run deploy
```

### 배포 후 URL 확인
```bash
gcloud functions describe productRecommendation --format="value(httpsTrigger.url)"
```

## 4. API 사용법

### 엔드포인트
- **URL**: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/productRecommendation`
- **Methods**: GET, POST
- **Content-Type**: application/json (POST의 경우)

### API 파라미터

#### 1. 인기 상품 추천
```javascript
GET /productRecommendation?type=popular&limit=5
```

#### 2. 유사 상품 추천 (같은 카테고리)
```javascript
GET /productRecommendation?type=similar&productId=1&limit=3
```

#### 3. 관련 상품 추천 (태그 기반)
```javascript
GET /productRecommendation?type=related&productId=1&limit=3
```

#### 4. 가격대별 추천
```javascript
GET /productRecommendation?type=price-range&productId=1&limit=3
```

#### 5. 개인화 추천
```javascript
POST /productRecommendation
{
  "type": "personalized",
  "userHistory": [1, 2, 3, 4],
  "limit": 5
}
```

### 응답 형식
```json
{
  "success": true,
  "type": "similar",
  "recommendations": [
    {
      "id": 2,
      "name": "Mouse",
      "category": "electronics",
      "price": 25,
      "tags": ["computer", "accessory"]
    }
  ],
  "count": 1
}
```

## 5. 기존 웹앱과 통합

### HTML에 추천 섹션 추가
```html
<!-- 메인 페이지 -->
<div id="popular-products"></div>

<!-- 상품 상세 페이지 -->
<div id="similar-products"></div>
<div id="related-products"></div>

<!-- 개인화 추천 (로그인 사용자) -->
<div id="personalized-products"></div>
```

### JavaScript 통합
1. 프론트엔드 코드에서 Cloud Function URL 설정
2. 페이지 로드시 추천 상품 로딩
3. 사용자 행동 추적 (상품 조회 히스토리)

## 6. 추천 알고리즘 설명

### 1. 카테고리 기반 추천
- 같은 카테고리 내 상품들 중에서 가격이 비슷한 순으로 추천

### 2. 태그 기반 추천
- 공통 태그 개수를 기준으로 유사도 계산
- 태그 매칭이 많을수록 높은 점수

### 3. 가격대 추천
- 선택한 상품 가격의 ±30% 범위 내 상품들 추천
- 랜덤 정렬로 다양성 확보

### 4. 개인화 추천
- 사용자 히스토리 분석하여 선호 카테고리/태그 파악
- 선호도 점수 기반 추천 순서 결정

### 5. 인기 상품 추천
- 중간 가격대(20-100달러) 상품을 인기 상품으로 시뮬레이션
- 실제로는 구매/조회 데이터 활용 가능

## 7. 확장 가능성

### 데이터베이스 연동
현재는 하드코딩된 상품 데이터를 사용하지만, 실제로는:
- Firestore 또는 Cloud SQL에서 상품 데이터 조회
- 사용자 행동 데이터 저장 및 분석
- 실시간 재고 정보 반영

### 고급 알고리즘
- 협업 필터링 (Collaborative Filtering)
- 콘텐츠 기반 필터링 심화
- 머신러닝 모델 통합

### 성능 최적화
- 결과 캐싱 (Redis/Memcache)
- 배치 처리를 통한 추천 결과 사전 계산
- A/B 테스트를 통한 알고리즘 개선

## 8. 모니터링 및 로깅

### Cloud Functions 로그 확인
```bash
gcloud functions logs read productRecommendation --limit 50
```

### 성능 메트릭
- Google Cloud Console에서 함수 실행 시간, 에러율 모니터링
- 사용량 기반 비용 최적화

이제 이 추천 시스템을 VM, GKE, Cloud Run 환경의 웹앱에서 호출하여 사용할 수 있습니다!