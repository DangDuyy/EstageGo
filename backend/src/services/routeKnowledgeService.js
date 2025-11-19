/**
 * Route Knowledge Service
 * Provides comprehensive understanding of all application routes for AI assistant
 */

/**
 * Complete route map with descriptions and parameters
 */
export const getRouteKnowledge = () => {
  return {
    properties: {
      base: '/api/v1/properties',
      description: 'Quản lý và tìm kiếm bất động sản',
      routes: [
        {
          path: '/api/v1/properties',
          method: 'GET',
          name: 'Danh sách properties',
          description: 'Lấy danh sách tất cả bất động sản với filter, pagination, sort',
          params: {
            page: 'Số trang (default: 1)',
            limit: 'Số lượng mỗi trang (default: 10)',
            sort: 'Sắp xếp (price_asc, price_desc, area_asc, area_desc, newest, oldest)',
            province: 'Lọc theo tỉnh/thành phố',
            district: 'Lọc theo quận/huyện',
            type: 'Loại BĐS (apartment, house, condo, land, commercial, office, villa, townhouse)',
            purpose: 'Mục đích (sale, rent)',
            minPrice: 'Giá tối thiểu',
            maxPrice: 'Giá tối đa',
            minArea: 'Diện tích tối thiểu (m²)',
            maxArea: 'Diện tích tối đa (m²)',
            bedrooms: 'Số phòng ngủ',
            bathrooms: 'Số phòng tắm'
          },
          frontend: {
            route: '/properties',
            component: 'PropertyPage',
            description: 'Trang danh sách BĐS với filter sidebar'
          }
        },
        {
          path: '/api/v1/properties/map',
          method: 'GET',
          name: 'Properties trên bản đồ',
          description: 'Lấy properties để hiển thị trên map với coordinates',
          params: {
            bounds: 'Vùng hiển thị map (north, south, east, west)',
            zoom: 'Mức zoom của map',
            ...'{các params filter giống GET /properties}'
          },
          frontend: {
            route: '/map',
            component: 'MapPage',
            description: 'Trang tìm kiếm BĐS trên bản đồ'
          }
        },
        {
          path: '/api/v1/properties/nl-search',
          method: 'POST',
          name: 'Tìm kiếm ngôn ngữ tự nhiên',
          description: 'Tìm kiếm BĐS bằng câu nói tự nhiên (AI-powered search)',
          body: {
            query: 'Câu hỏi/yêu cầu bằng tiếng Việt hoặc tiếng Anh'
          },
          example: 'Tìm căn hộ 2 phòng ngủ ở quận 1 giá dưới 5 tỷ',
          frontend: {
            route: '/ai-search',
            component: 'AISearchPage',
            description: 'Trang tìm kiếm thông minh bằng ngôn ngữ tự nhiên'
          }
        },
        {
          path: '/api/v1/properties/in',
          method: 'POST',
          name: 'Tìm kiếm trong vùng polygon',
          description: 'Tìm BĐS trong vùng được vẽ trên map',
          body: {
            coordinates: 'Mảng tọa độ [lat, lng] của polygon'
          },
          frontend: {
            route: '/map',
            feature: 'Draw polygon on map',
            description: 'Vẽ vùng tìm kiếm trên bản đồ'
          }
        },
        {
          path: '/api/v1/properties/:id',
          method: 'GET',
          name: 'Chi tiết property',
          description: 'Xem thông tin chi tiết một BĐS',
          params: {
            id: 'Property ID (MongoDB ObjectId)'
          },
          frontend: {
            route: '/property/:id',
            component: 'PropertyDetailPage',
            description: 'Trang chi tiết BĐS với gallery, map, thông tin chi tiết'
          }
        },
        {
          path: '/api/v1/properties/search-by-tag',
          method: 'GET',
          name: 'Tìm kiếm theo tag hình ảnh',
          description: 'Tìm BĐS theo tag trong hình ảnh (AI image tagging)',
          params: {
            tags: 'Array of tags (modern_kitchen, pool, garden, etc.)'
          },
          frontend: {
            route: '/ai/image-search',
            component: 'ImageTaggingPage',
            description: 'Tìm kiếm BĐS qua AI phân tích hình ảnh'
          }
        }
      ]
    },
    
    users: {
      base: '/api/v1/users',
      description: 'Quản lý user và authentication',
      routes: [
        {
          path: '/api/v1/users/register',
          method: 'POST',
          name: 'Đăng ký tài khoản',
          description: 'Tạo tài khoản mới',
          requiresAuth: false,
          frontend: {
            modal: 'SignUpModal',
            description: 'Modal đăng ký trong navbar'
          }
        },
        {
          path: '/api/v1/users/login',
          method: 'POST',
          name: 'Đăng nhập',
          description: 'Đăng nhập vào hệ thống',
          requiresAuth: false,
          frontend: {
            modal: 'LoginModal',
            description: 'Modal đăng nhập trong navbar'
          }
        },
        {
          path: '/api/v1/users/me',
          method: 'GET',
          name: 'Thông tin user hiện tại',
          description: 'Lấy thông tin user đang đăng nhập',
          requiresAuth: true,
          frontend: {
            component: 'UserNav',
            description: 'Hiển thị trong navbar dropdown'
          }
        },
        {
          path: '/api/v1/users/profile',
          method: 'PUT',
          name: 'Cập nhật profile',
          description: 'Cập nhật thông tin cá nhân',
          requiresAuth: true,
          frontend: {
            route: '/dashboard/profile',
            component: 'ProfilePage',
            description: 'Trang profile trong dashboard'
          }
        },
        {
          path: '/api/v1/users/agents',
          method: 'GET',
          name: 'Danh sách agents',
          description: 'Xem tất cả môi giới BĐS',
          requiresAuth: false,
          frontend: {
            route: '/agents',
            component: 'AgentPage',
            description: 'Trang danh sách môi giới'
          }
        },
        {
          path: '/api/v1/users/agents/:agentId',
          method: 'GET',
          name: 'Chi tiết agent',
          description: 'Xem profile của một môi giới',
          requiresAuth: false,
          frontend: {
            route: '/agent/:agentId',
            component: 'AgentProfile',
            description: 'Trang profile agent với properties của họ'
          }
        }
      ]
    },
    
    wishlist: {
      base: '/api/v1/wishlist',
      description: 'Quản lý danh sách yêu thích',
      routes: [
        {
          path: '/api/v1/wishlist',
          method: 'GET',
          name: 'Danh sách yêu thích',
          description: 'Lấy tất cả properties đã lưu',
          requiresAuth: true,
          frontend: {
            route: '/dashboard/wishlist',
            component: 'WishlistPage',
            sidebar: 'WishlistSidebar',
            description: 'Trang wishlist trong dashboard và sidebar luôn hiển thị'
          }
        },
        {
          path: '/api/v1/wishlist/toggle',
          method: 'POST',
          name: 'Toggle wishlist',
          description: 'Thêm/xóa property khỏi wishlist',
          requiresAuth: true,
          frontend: {
            button: 'Heart icon trên PropertyCard',
            description: 'Click icon trái tim để save/unsave'
          }
        }
      ]
    },
    
    recommendations: {
      base: '/api/v1/recommendations',
      description: 'Hệ thống gợi ý thông minh',
      routes: [
        {
          path: '/api/v1/recommendations/personalized',
          method: 'GET',
          name: 'Gợi ý cá nhân hóa',
          description: 'Properties phù hợp dựa trên lịch sử xem',
          requiresAuth: true,
          frontend: {
            route: '/ai/recommendations',
            component: 'SemanticRecommendPage',
            description: 'Trang gợi ý BĐS cá nhân hóa'
          }
        },
        {
          path: '/api/v1/recommendations/similar/:propertyId',
          method: 'GET',
          name: 'Properties tương tự',
          description: 'Tìm BĐS tương tự property đang xem',
          requiresAuth: false,
          frontend: {
            section: 'Similar Properties',
            description: 'Section trong PropertyDetailPage'
          }
        }
      ]
    },
    
    conversations: {
      base: '/api/v1/conversations',
      description: 'Chat/nhắn tin với agents',
      routes: [
        {
          path: '/api/v1/conversations',
          method: 'GET',
          name: 'Danh sách conversations',
          description: 'Lấy tất cả cuộc trò chuyện',
          requiresAuth: true,
          frontend: {
            route: '/dashboard/messages',
            component: 'MessagePage',
            description: 'Trang tin nhắn trong dashboard'
          }
        },
        {
          path: '/api/v1/conversations',
          method: 'POST',
          name: 'Tạo conversation',
          description: 'Bắt đầu chat với agent',
          requiresAuth: true,
          frontend: {
            button: 'Contact Agent button',
            description: 'Trong PropertyDetailPage hoặc AgentProfile'
          }
        }
      ]
    },
    
    aiFeatures: {
      base: '/api/v1',
      description: 'Các tính năng AI',
      routes: [
        {
          path: '/api/v1/ollama-chat',
          method: 'POST',
          name: 'ChatBot AI',
          description: 'Trò chuyện với AI assistant về bất động sản',
          requiresAuth: false,
          frontend: {
            route: '/chatbot',
            component: 'ChatBot',
            description: 'Trang chat với AI về tư vấn BĐS'
          }
        }
      ]
    },
    
    dashboard: {
      base: '/dashboard',
      description: 'User dashboard',
      routes: [
        {
          route: '/dashboard',
          name: 'Dashboard Home',
          description: 'Trang tổng quan dashboard',
          requiresAuth: true
        },
        {
          route: '/dashboard/profile',
          name: 'Profile',
          description: 'Quản lý thông tin cá nhân',
          requiresAuth: true
        },
        {
          route: '/dashboard/properties',
          name: 'Quản lý properties',
          description: 'Quản lý BĐS đã đăng (for agents/owners)',
          requiresAuth: true
        },
        {
          route: '/dashboard/post',
          name: 'Đăng tin',
          description: 'Đăng BĐS mới',
          requiresAuth: true,
          requiredRole: 'agent'
        },
        {
          route: '/dashboard/wishlist',
          name: 'Yêu thích',
          description: 'Danh sách BĐS đã lưu',
          requiresAuth: true
        },
        {
          route: '/dashboard/messages',
          name: 'Tin nhắn',
          description: 'Chat với agents/users',
          requiresAuth: true
        },
        {
          route: '/dashboard/pricing',
          name: 'Gói dịch vụ',
          description: 'Các gói membership cho agents',
          requiresAuth: true
        }
      ]
    },
    
    admin: {
      base: '/admin',
      description: 'Admin panel',
      routes: [
        {
          route: '/admin/dashboard',
          name: 'Admin Dashboard',
          description: 'Thống kê tổng quan admin',
          requiresAuth: true,
          requiredRole: 'admin'
        },
        {
          route: '/admin/users',
          name: 'Quản lý users',
          description: 'Quản lý tất cả users',
          requiresAuth: true,
          requiredRole: 'admin'
        },
        {
          route: '/admin/properties',
          name: 'Quản lý properties',
          description: 'Duyệt và quản lý tất cả BĐS',
          requiresAuth: true,
          requiredRole: 'admin'
        },
        {
          route: '/admin/agent-requests',
          name: 'Duyệt agent requests',
          description: 'Duyệt yêu cầu trở thành agent',
          requiresAuth: true,
          requiredRole: 'admin'
        }
      ]
    }
  }
}

/**
 * Format route knowledge for AI prompt
 */
export const formatRouteKnowledgeForPrompt = () => {
  const knowledge = getRouteKnowledge()
  
  return `
═══════════════════════════════════════════════════════════════
THÔNG TIN VỀ ROUTES VÀ NAVIGATION CỦA WEBSITE
(AI hãy sử dụng để hiểu cấu trúc web và đưa ra route phù hợp khi user hỏi)
═══════════════════════════════════════════════════════════════

📍 1. TÌM KIẾM VÀ XEM BẤT ĐỘNG SẢN
────────────────────────────────────────────────────────────────

🏘️ Danh sách BĐS (Tìm kiếm cơ bản):
   Frontend: /properties
   - Xem tất cả BĐS với filter sidebar
   - Filter theo: giá, diện tích, vị trí, loại nhà, số phòng
   - Sort: giá, diện tích, ngày đăng
   Khi nào dùng: User muốn "xem danh sách", "tìm nhà", "lọc theo giá"

🗺️ Tìm kiếm trên bản đồ:
   Frontend: /map
   - Hiển thị BĐS trên Google Maps
   - Có thể vẽ vùng tìm kiếm (polygon)
   - Zoom in/out để xem clusters
   Khi nào dùng: User hỏi "tìm trên bản đồ", "xem map", "vùng nào có nhiều nhà"

🤖 Tìm kiếm thông minh (AI):
   Frontend: /ai-search
   API: POST /api/v1/properties/nl-search
   - Tìm bằng câu nói tự nhiên tiếng Việt
   - AI hiểu yêu cầu phức tạp
   Ví dụ câu hỏi:
   - "Tìm căn hộ 2 phòng ngủ ở quận 1 giá dưới 5 tỷ"
   - "Nhà gần trường học có hồ bơi"
   - "Chung cư Vinhomes có view sông"
   Khi nào dùng: User đưa ra yêu cầu phức tạp, cần AI xử lý

🖼️ Tìm theo hình ảnh:
   Frontend: /ai/image-search
   - Tìm BĐS có tiện ích trong hình (pool, garden, modern kitchen...)
   - AI tự động tag hình ảnh
   Khi nào dùng: User muốn "tìm nhà có bể bơi", "nhà có khu vườn"

🏡 Chi tiết BĐS:
   Frontend: /property/:id
   - Xem đầy đủ thông tin
   - Gallery hình ảnh, video tour
   - Thông tin chi tiết, map vị trí
   - Similar properties
   - Contact agent button
   Khi nào dùng: User muốn "xem chi tiết", "thông tin property ID xxx"

────────────────────────────────────────────────────────────────

📍 2. GỢI Ý THÔNG MINH (AI RECOMMENDATIONS)
────────────────────────────────────────────────────────────────

💡 Gợi ý cá nhân hóa:
   Frontend: /ai/recommendations
   API: GET /api/v1/recommendations/personalized
   - Dựa trên lịch sử xem của user
   - AI phân tích sở thích
   - Cần đăng nhập
   Khi nào dùng: User hỏi "gợi ý cho tôi", "nhà phù hợp với tôi"

🎯 Properties tương tự:
   API: GET /api/v1/recommendations/similar/:propertyId
   - Hiển thị trong PropertyDetailPage
   - Tìm BĐS giống với property đang xem
   Khi nào dùng: User hỏi "tìm nhà tương tự", "giống cái này"

────────────────────────────────────────────────────────────────

📍 3. USER ACCOUNT & AUTHENTICATION
────────────────────────────────────────────────────────────────

🔐 Đăng nhập/Đăng ký:
   Modal trong navbar (không có route riêng)
   - Click "Đăng nhập" hoặc "Đăng ký" trên navbar
   - API: POST /api/v1/users/login và /register

👤 Profile:
   Frontend: /dashboard/profile
   - Cập nhật thông tin cá nhân
   - Avatar, phone, address, DOB

────────────────────────────────────────────────────────────────

📍 4. USER DASHBOARD
────────────────────────────────────────────────────────────────

🏠 Dashboard Home:
   Frontend: /dashboard
   - Trang tổng quan
   - Thống kê hoạt động

❤️ Yêu thích (Wishlist):
   Frontend: /dashboard/wishlist
   - Danh sách BĐS đã lưu
   - Click icon trái tim ở PropertyCard để save/unsave
   - Có WishlistSidebar luôn hiển thị bên phải

💬 Tin nhắn:
   Frontend: /dashboard/messages
   - Chat với agents/users
   - Real-time messaging

📝 Đăng tin (For Agents):
   Frontend: /dashboard/post
   - Đăng BĐS mới
   - Chỉ agents mới được dùng

📊 Quản lý properties (For Agents):
   Frontend: /dashboard/properties
   - Xem và quản lý BĐS đã đăng

💳 Gói dịch vụ:
   Frontend: /dashboard/pricing
   - Xem các gói membership cho agents

────────────────────────────────────────────────────────────────

📍 5. AGENTS (MÔI GIỚI)
────────────────────────────────────────────────────────────────

👥 Danh sách agents:
   Frontend: /agents
   - Xem tất cả môi giới
   - Filter theo chuyên môn, khu vực

👤 Profile agent:
   Frontend: /agent/:agentId
   - Thông tin chi tiết agent
   - Properties của agent đó
   - Contact button

────────────────────────────────────────────────────────────────

📍 6. AI FEATURES (CHATBOT)
────────────────────────────────────────────────────────────────

🤖 ChatBot AI:
   Frontend: /chatbot
   API: POST /api/v1/ollama-chat
   - Trò chuyện với AI assistant
   - Tư vấn về BĐS
   - Hiểu về database và routes
   - Có thể search, recommend
   Khi nào dùng: User muốn "hỏi bot", "tư vấn"

────────────────────────────────────────────────────────────────

📍 7. ADMIN PANEL (CHỈ ADMIN)
────────────────────────────────────────────────────────────────

🔧 Admin Dashboard:
   Frontend: /admin/dashboard
   - Thống kê hệ thống

👥 Quản lý users:
   Frontend: /admin/users
   - Quản lý tất cả users

🏘️ Quản lý properties:
   Frontend: /admin/properties
   - Duyệt và xóa properties

✅ Duyệt agent requests:
   Frontend: /admin/agent-requests
   - Duyệt yêu cầu trở thành agent

────────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
HƯỚNG DẪN KHI USER HỎI VỀ NAVIGATION
═══════════════════════════════════════════════════════════════

📌 Các từ khóa mapping:
─────────────────────────
"tìm nhà", "xem danh sách" 
   → /properties (danh sách với filter)

"tìm trên bản đồ", "xem map", "searchProperties with map"
   → /map (trang map)

"tìm bằng câu nói", "tìm thông minh", "AI search"
   → /ai-search (natural language search)

"gợi ý cho tôi", "nhà phù hợp"
   → /ai/recommendations (personalized recommendations)

"yêu thích", "đã lưu", "wishlist"
   → /dashboard/wishlist

"nhắn tin", "chat với agent", "tin nhắn"
   → /dashboard/messages

"đăng tin", "post property"
   → /dashboard/post (cần agent role)

"danh sách môi giới", "tìm agent"
   → /agents

"trang cá nhân", "profile"
   → /dashboard/profile

"chi tiết property", "xem property ID xxx"
   → /property/:id

────────────────────────────────────────────────────────────────

🎯 LƯU Ý QUAN TRỌNG:
- Luôn đưa ra FRONTEND ROUTE (VD: /map, /properties)
- Giải thích ngắn gọn route đó làm gì
- Nếu cần auth, nói rõ "cần đăng nhập"
- Nếu cần role, nói rõ "chỉ dành cho agent/admin"

═══════════════════════════════════════════════════════════════
`
}

/**
 * Get quick navigation map (cho VAPI function calling)
 */
export const getNavigationMap = () => {
  return {
    // Tìm kiếm BĐS
    searchProperties: '/properties',
    searchOnMap: '/map',
    aiSearch: '/ai-search',
    imageSearch: '/ai/image-search',
    
    // Gợi ý
    recommendations: '/ai/recommendations',
    
    // User features
    wishlist: '/dashboard/wishlist',
    messages: '/dashboard/messages',
    profile: '/dashboard/profile',
    
    // Agent features
    postProperty: '/dashboard/post',
    manageProperties: '/dashboard/properties',
    
    // Agents
    agentList: '/agents',
    
    // AI
    chatbot: '/chatbot',
    
    // Homepage
    home: '/'
  }
}

/**
 * Find route based on user intent
 */
export const findRouteByIntent = (userQuery) => {
  const query = userQuery.toLowerCase()
  const navMap = getNavigationMap()
  
  // Map keywords to routes
  const intentMap = {
    // Search-related
    'map': navMap.searchOnMap,
    'bản đồ': navMap.searchOnMap,
    'ban do': navMap.searchOnMap,
    'tìm trên map': navMap.searchOnMap,
    'xem map': navMap.searchOnMap,
    
    'tìm kiếm': navMap.searchProperties,
    'tim kiem': navMap.searchProperties,
    'danh sách': navMap.searchProperties,
    'danh sach': navMap.searchProperties,
    'xem nhà': navMap.searchProperties,
    
    'ai search': navMap.aiSearch,
    'tìm thông minh': navMap.aiSearch,
    'tim thong minh': navMap.aiSearch,
    
    // Recommendations
    'gợi ý': navMap.recommendations,
    'goi y': navMap.recommendations,
    'recommend': navMap.recommendations,
    'phù hợp': navMap.recommendations,
    
    // User features
    'yêu thích': navMap.wishlist,
    'yeu thich': navMap.wishlist,
    'wishlist': navMap.wishlist,
    'đã lưu': navMap.wishlist,
    
    'tin nhắn': navMap.messages,
    'tin nhan': navMap.messages,
    'message': navMap.messages,
    'nhắn tin': navMap.messages,
    'chat': navMap.messages,
    
    'profile': navMap.profile,
    'thông tin': navMap.profile,
    'trang cá nhân': navMap.profile,
    
    // Agent
    'đăng tin': navMap.postProperty,
    'dang tin': navMap.postProperty,
    'post': navMap.postProperty,
    
    'môi giới': navMap.agentList,
    'moi gioi': navMap.agentList,
    'agent': navMap.agentList,
    
    // Home
    'trang chủ': navMap.home,
    'trang chu': navMap.home,
    'home': navMap.home
  }
  
  for (const [keyword, route] of Object.entries(intentMap)) {
    if (query.includes(keyword)) {
      return {
        route,
        keyword,
        confidence: 'high'
      }
    }
  }
  
  return null
}

export const routeKnowledgeService = {
  getRouteKnowledge,
  formatRouteKnowledgeForPrompt,
  getNavigationMap,
  findRouteByIntent
}
