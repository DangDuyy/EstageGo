# Cách Hoạt Động của Collaborative Filtering Recommendation System

## ❓ Câu hỏi thường gặp: "Xem >10s có phải là điều kiện để hiển thị recommendations?"

**Trả lời: KHÔNG!** VIEW >10s chỉ là một trong những **dữ liệu** để backend tính toán, không phải điều kiện để hiển thị recommendations.

---

## 📊 Quy Trình Hoạt Động

### 1️⃣ Thu Thập Dữ Liệu (Tracking)

Khi user tương tác với properties, frontend gửi các events sau lên backend:

| Event Type | Điều kiện | Trọng số | Ý nghĩa |
|------------|-----------|----------|---------|
| **WISHLIST_ADD** | User thêm vào wishlist | **5** | Ưu tiên cao nhất |
| **CONTACT** | User liên hệ agent/owner | **3** | Quan tâm nghiêm túc |
| **VIEW** | User xem property **> 10 giây** | **1** | Chỉ xem qua (thấp) |

**Ví dụ:**
- User A xem Property 1 trong 15 giây → `VIEW` event (weight 1) được gửi
- User A thêm Property 2 vào wishlist → `WISHLIST_ADD` event (weight 5) được gửi
- User A contact owner của Property 3 → `CONTACT` event (weight 3) được gửi

### 2️⃣ Backend Xây Dựng Ma Trận User-Property Preference

Backend lưu tất cả events vào `UserActivity` collection và xây dựng ma trận:

```
User-Property Preference Matrix (R):
                    Property1  Property2  Property3  ...
User A             1 (VIEW)   5 (WISH)   3 (CONTACT)
User B             5 (WISH)   1 (VIEW)   5 (WISH)
User C             3 (CONTACT) 5 (WISH)   1 (VIEW)
...
```

### 3️⃣ Backend Tính Similarity Giữa Các Users

Backend sử dụng **Cosine Similarity** để tìm users có sở thích tương tự:

```
Sim(User A, User B) = Cosine Similarity(vector A, vector B)
```

Ví dụ: Nếu User A và User B đều thích Property 2 và Property 3 → similarity cao

### 4️⃣ Backend Dự Đoán Properties User Sẽ Thích

Với User A, backend:
1. Tìm top-K users tương tự (ví dụ: User B, User C)
2. Xem các properties mà những users này đã thích (nhưng User A chưa xem)
3. Dự đoán mức độ User A sẽ thích các properties đó:

```
P(User A, Property X) = Σ(Sim(A, similar_user) * Rating(similar_user, X)) / Σ|Sim(A, similar_user)|
```

### 5️⃣ Frontend Hiển Thị Recommendations

**Khi nào hiển thị?**
- ✅ Khi user truy cập trang `/ai/semantic-recommend`
- ✅ Frontend gọi API `getPersonalizedRecommendationsAPI()`
- ✅ Backend trả về danh sách properties đã được sắp xếp theo prediction score

**Recommendations có thể hiển thị ngay cả khi:**
- ✅ User chưa có nhiều interactions
  - Backend sẽ fallback về **popular properties**
- ✅ User chưa có VIEW >10s nào
  - Nếu có CONTACT hoặc WISHLIST_ADD, vẫn có recommendations
- ✅ User mới đăng ký
  - Backend trả về popular properties cho new users

---

## 🎯 Luồng Dữ Liệu Chi Tiết

```
1. User xem property detail page
   ↓
2. Nếu xem >10s → Frontend gửi VIEW event (weight 1)
   ↓
3. User thêm vào wishlist → Frontend gửi WISHLIST_ADD event (weight 5)
   ↓
4. Backend lưu vào UserActivity collection
   ↓
5. Backend định kỳ (mỗi 6-12h) hoặc real-time:
   - Xây dựng User-Property Preference Matrix
   - Tính Cosine Similarity giữa tất cả users
   - Lưu Similarity Matrix vào cache
   ↓
6. User truy cập /ai/recommendation
   ↓
7. Frontend gọi API GET /v1/recommendations/personalized
   ↓
8. Backend:
   - Lấy Similarity Matrix từ cache
   - Tìm top-K similar users cho current user
   - Dự đoán ratings cho properties user chưa xem
   - Sắp xếp theo prediction score
   - Trả về top-12 properties
   ↓
9. Frontend hiển thị recommendations
```

---

## ✅ Tóm Tắt

1. **VIEW >10s** = Chỉ là **dữ liệu** (weight 1), không phải điều kiện
2. **Recommendations** được hiển thị khi user truy cập trang `/ai/semantic-recommend`
3. **Backend** sử dụng TẤT CẢ interactions (VIEW, CONTACT, WISHLIST_ADD) để tính toán
4. Nếu chưa có đủ data → Backend fallback về popular properties
5. Recommendations được tính dựa trên **similar users**, không phải chỉ dựa trên 1 event

