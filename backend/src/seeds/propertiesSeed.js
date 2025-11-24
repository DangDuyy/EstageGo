import axios from "axios"
import fs from "fs"
import "dotenv/config"

const GOOGLE_KEY = process.env.GOOGLE_MAP_API_KEY
const OUTPUT_FILE = "propertiesSeed.geocoded.json"

// 5 ownerId bạn cung cấp
const OWNER_IDS = [
  "69136c08705dc81a44a525ff",
  "68bd181fc9119fda03f989fe",
  "69136c1e705dc81a44a52604",
  "69136d14e0ab0808ffc7eb7b",
  "69213fec9568ff85ba8bf4e8"
]

if (!GOOGLE_KEY) {
  console.error("❌ Thiếu GOOGLE_MAP_API_KEY trong .env")
  process.exit(1)
}

// =========================
// DATA GỐC TỪ BDS (5 HTML)
// =========================
// Đã parse sẵn từ 5 file 1.html – 5.html bạn gửi
// (title, fullAddress, description, images, postId)

const BDS_BASE = [
  {
    title: "Giỏ hàng Sunrise City 1PN 4tỷ5 56m2 - 2PN 5t,1tỷ 76m2 - 3PN 6tỷ 109m2, sẵn khóa xem nhà mọi lúc",
    fullAddress: "Dự án Sunrise City, Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, Hồ Chí Minh",
    description:
      "Giỏ hàng Sunrise City, nhiều căn 1PN, 2PN, 3PN giá tốt. Liên hệ để xem nhà thực tế, hỗ trợ vay ngân hàng lên đến 70% giá trị căn hộ.",
    images: [
      "https://file4.batdongsan.com.vn/resize/200x200/2025/05/16/20250516200913-96db_wm.jpg",
      "https://file4.batdongsan.com.vn/resize/200x200/2025/05/16/20250516200835-7ba1_wm.jpg",
      "https://file4.batdongsan.com.vn/resize/200x200/2025/05/16/20250516200835-8d8c_wm.jpg"
    ],
    postId: "38248917"
  },
  {
    title: "1 căn thông duy nhất Sunrise City, South - 5PN, 4WC - 266m2 - Giá 23 tỷ còn TL",
    fullAddress: "Sunrise City, Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, Hồ Chí Minh",
    description:
      "Căn thông duy nhất tại Sunrise City South, diện tích 266m2, 5 phòng ngủ, 4WC, phù hợp gia đình lớn hoặc kết hợp làm văn phòng.",
    images: [
      "https://file4.batdongsan.com.vn/resize/1275x717/2025/11/24/20251124095850-05c9_wm.jpg",
      "https://file4.batdongsan.com.vn/resize/1275x717/2025/11/24/20251124095829-8cfb_wm.jpg",
      "https://file4.batdongsan.com.vn/resize/1275x717/2025/11/24/20251124095752-e19b_wm.jpg"
    ],
    postId: "44621955"
  },
  {
    title: "Căn hộ cao cấp Sunrise City View 2PN, 2WC, full nội thất, view đẹp Quận 7",
    fullAddress: "Sunrise City View, Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, Hồ Chí Minh",
    description:
      "Căn hộ Sunrise City View, 2 phòng ngủ, 2WC, full nội thất, chỉ cần xách vali vào ở. View thoáng, tiện ích nội khu đầy đủ.",
    images: [
      "https://file4.batdongsan.com.vn/resize/200x200/2017/03/02/20170302131815-dd51.jpg",
      "https://file4.batdongsan.com.vn/resize/200x200/2017/03/02/20170302131824-bfff.jpg",
      "https://file4.batdongsan.com.vn/resize/200x200/2017/03/02/20170302131833-948b.jpg"
    ],
    postId: "40146375"
  },
  {
    title: "Căn góc Sunrise City North 3PN, 2WC, 126m2, view hồ bơi nội khu, giá tốt",
    fullAddress: "Sunrise City North, Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, Hồ Chí Minh",
    description:
      "Căn góc 3 phòng ngủ tại khu North, diện tích rộng 126m2, ban công thoáng, view hồ bơi. Phù hợp gia đình cần không gian rộng.",
    images: [
      "https://file4.batdongsan.com.vn/resize/1275x717/2016/09/26/lGk9zKqg/20160926155300-9f46.jpg",
      "https://file4.batdongsan.com.vn/resize/1275x717/2016/09/26/lGk9zKqg/20160926155444-1aaa.jpg",
      "https://file4.batdongsan.com.vn/resize/1275x717/2016/09/26/lGk9zKqg/20160926155628-b264.jpg"
    ],
    postId: "44406654"
  },
  {
    title: "Bán nhanh căn hộ 2PN, 2WC, 95m2 giá tốt 8,25 tỷ, Sunrise City South",
    fullAddress: "Dự án Sunrise City, Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, Hồ Chí Minh",
    description:
      "Căn hộ 2 phòng ngủ, 2WC, diện tích 95m2, giá 8,25 tỷ tại khu South Sunrise City. Thích hợp an cư lâu dài, khu dân cư văn minh.",
    images: [
      "https://file4.batdongsan.com.vn/resize/1275x717/2025/10/22/20251022114947-6021_wm.jpg",
      "https://file4.batdongsan.com.vn/resize/1275x717/2025/10/22/20251022115000-ad5b_wm.jpg",
      "https://file4.batdongsan.com.vn/resize/1275x717/2025/10/22/20251022115029-0456_wm.jpg"
    ],
    postId: "44343627"
  }
]

// Gom tất cả ảnh BDS để dùng thêm cho các tin random
const ALL_BDS_IMAGES = Array.from(
  new Set(BDS_BASE.flatMap(b => b.images))
)

// =========================
// DATA ĐỊA CHỈ ĐA TỈNH
// =========================

const ADDRESSES = [
  // ==== TP.HCM ====
  {
    fullAddress: "720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Bình Thạnh",
    ward: "Phường 22",
    street: "Điện Biên Phủ"
  },
  {
    fullAddress: "2 Hải Triều, Bến Nghé, Quận 1, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    ward: "Bến Nghé",
    street: "Hải Triều"
  },
  {
    fullAddress: "101 Tôn Dật Tiên, Tân Phú, Quận 7, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Quận 7",
    ward: "Tân Phú",
    street: "Tôn Dật Tiên"
  },
  {
    fullAddress: "512 Nguyễn Xiển, Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Thành phố Thủ Đức",
    ward: "Long Thạnh Mỹ",
    street: "Nguyễn Xiển"
  },
  {
    fullAddress: "12 Nguyễn Hữu Thọ, Phước Kiển, Nhà Bè, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Nhà Bè",
    ward: "Phước Kiển",
    street: "Nguyễn Hữu Thọ"
  },
  {
    fullAddress: "35 Lê Văn Việt, Hiệp Phú, TP. Thủ Đức, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Thành phố Thủ Đức",
    ward: "Hiệp Phú",
    street: "Lê Văn Việt"
  },
  {
    fullAddress: "45 Lê Văn Lương, Tân Phong, Quận 7, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Quận 7",
    ward: "Tân Phong",
    street: "Lê Văn Lương"
  },
  {
    fullAddress: "15 Phạm Văn Đồng, Linh Tây, TP. Thủ Đức, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Thành phố Thủ Đức",
    ward: "Linh Tây",
    street: "Phạm Văn Đồng"
  },
  {
    fullAddress: "20 Trường Sơn, Phường 2, Tân Bình, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Tân Bình",
    ward: "Phường 2",
    street: "Trường Sơn"
  },
  {
    fullAddress: "25 Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, TP.HCM",
    country: "Vietnam",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    ward: "Bến Nghé",
    street: "Nguyễn Thị Minh Khai"
  },

  // ==== HÀ NỘI ====
  {
    fullAddress: "302 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội",
    country: "Vietnam",
    province: "Hà Nội",
    district: "Cầu Giấy",
    ward: "Dịch Vọng",
    street: "Cầu Giấy"
  },
  {
    fullAddress: "125 Hoàng Quốc Việt, Nghĩa Tân, Cầu Giấy, Hà Nội",
    country: "Vietnam",
    province: "Hà Nội",
    district: "Cầu Giấy",
    ward: "Nghĩa Tân",
    street: "Hoàng Quốc Việt"
  },
  {
    fullAddress: "25 Lê Văn Lương, Nhân Chính, Thanh Xuân, Hà Nội",
    country: "Vietnam",
    province: "Hà Nội",
    district: "Thanh Xuân",
    ward: "Nhân Chính",
    street: "Lê Văn Lương"
  },
  {
    fullAddress: "1 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội",
    country: "Vietnam",
    province: "Hà Nội",
    district: "Nam Từ Liêm",
    ward: "Mỹ Đình 2",
    street: "Phạm Hùng"
  },
  {
    fullAddress: "8 Tràng Thi, Hàng Trống, Hoàn Kiếm, Hà Nội",
    country: "Vietnam",
    province: "Hà Nội",
    district: "Hoàn Kiếm",
    ward: "Hàng Trống",
    street: "Tràng Thi"
  },

  // ==== ĐÀ NẴNG ====
  {
    fullAddress: "18 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng",
    country: "Vietnam",
    province: "Đà Nẵng",
    district: "Sơn Trà",
    ward: "Phước Mỹ",
    street: "Võ Nguyên Giáp"
  },
  {
    fullAddress: "2 Nguyễn Văn Linh, Bình Hiên, Hải Châu, Đà Nẵng",
    country: "Vietnam",
    province: "Đà Nẵng",
    district: "Hải Châu",
    ward: "Bình Hiên",
    street: "Nguyễn Văn Linh"
  },

  // ==== NHA TRANG (KHÁNH HÒA) ====
  {
    fullAddress: "76 Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa",
    country: "Vietnam",
    province: "Khánh Hòa",
    district: "Nha Trang",
    ward: "Lộc Thọ",
    street: "Trần Phú"
  },

  // ==== ĐÀ LẠT (LÂM ĐỒNG) ====
  {
    fullAddress: "1 Bùi Thị Xuân, Phường 2, Đà Lạt, Lâm Đồng",
    country: "Vietnam",
    province: "Lâm Đồng",
    district: "Đà Lạt",
    ward: "Phường 2",
    street: "Bùi Thị Xuân"
  },

  // ==== CẦN THƠ ====
  {
    fullAddress: "20 Đường 30/4, Xuân Khánh, Ninh Kiều, Cần Thơ",
    country: "Vietnam",
    province: "Cần Thơ",
    district: "Ninh Kiều",
    ward: "Xuân Khánh",
    street: "30/4"
  },

  // ==== HẢI PHÒNG ====
  {
    fullAddress: "5 Điện Biên Phủ, Hoàng Văn Thụ, Hồng Bàng, Hải Phòng",
    country: "Vietnam",
    province: "Hải Phòng",
    district: "Hồng Bàng",
    ward: "Hoàng Văn Thụ",
    street: "Điện Biên Phủ"
  },

  // ==== BÌNH DƯƠNG ====
  {
    fullAddress: "22 Đại lộ Bình Dương, Thuận Giao, Thuận An, Bình Dương",
    country: "Vietnam",
    province: "Bình Dương",
    district: "Thuận An",
    ward: "Thuận Giao",
    street: "Đại lộ Bình Dương"
  },

  // ==== ĐỒNG NAI ====
  {
    fullAddress: "1 Phạm Văn Thuận, Tân Tiến, Biên Hòa, Đồng Nai",
    country: "Vietnam",
    province: "Đồng Nai",
    district: "Biên Hòa",
    ward: "Tân Tiến",
    street: "Phạm Văn Thuận"
  },

  // ==== HẢI DƯƠNG ====
  {
    fullAddress: "10 Thanh Niên, Quang Trung, Thành phố Hải Dương, Hải Dương",
    country: "Vietnam",
    province: "Hải Dương",
    district: "Thành phố Hải Dương",
    ward: "Quang Trung",
    street: "Thanh Niên"
  }
]

// =========================
// CONSTANTS & HELPERS
// =========================

const TYPES = ["apartment", "house", "condo", "land", "commercial", "office", "villa", "townhouse"]
const PURPOSES = ["sale", "rent"]

const TITLE_TEMPLATES = [
  "Căn hộ {rooms}PN cao cấp tại {district}",
  "Nhà phố {floors} tầng trung tâm {district}",
  "Chung cư đầy đủ tiện ích khu vực {district}",
  "Biệt thự sân vườn cao cấp {district}",
  "Đất nền tiềm năng tại {district}",
  "Văn phòng hạng B tại {district}",
  "Shophouse kinh doanh sầm uất {district}",
  "Studio view đẹp tại {district}"
]

const AMENITIES = [
  "gym",
  "swimming pool",
  "parking",
  "24/7 security",
  "playground",
  "bbq area",
  "shopping mall",
  "school nearby",
  "park",
  "elevator"
]

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

// cố gắng parse ward/district/province từ fullAddress dạng "..., Phường X, Quận Y, Tỉnh Z"
function parseFullAddress(fullAddress) {
  const parts = fullAddress.split(",").map(s => s.trim()).filter(Boolean)
  const province = parts[parts.length - 1] || ""
  const district = parts[parts.length - 2] || ""
  const ward = parts[parts.length - 3] || ""
  let street = ""

  for (const p of parts) {
    if (p.startsWith("Đường ") || p.startsWith("Phố ") || p.startsWith("Đại lộ ") || p.startsWith("QL") || p.startsWith("TL")) {
      street = p
      break
    }
  }

  return {
    fullAddress,
    country: "Vietnam",
    province,
    district,
    ward,
    street
  }
}

function buildMediaFromUrls(imgUrls, seedIndex) {
  const list = imgUrls.slice(0, 3) // tối đa 3 ảnh
  return list.map((url, idx) => ({
    url,
    type: "image",
    metadata: {
      filename: `p-${seedIndex + 1}-${idx + 1}.jpg`,
      size: 200000 + idx * 10000,
      mimetype: "image/jpeg",
      uploadedAt: new Date()
    },
    tags: [],
    detectedObjects: [],
    analyzed: false,
    analyzedAt: null
  }))
}

const geocodeCache = {}

async function geocode(fullAddress) {
  if (geocodeCache[fullAddress]) return geocodeCache[fullAddress]

  console.log("📍 Geocoding:", fullAddress)
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(fullAddress) +
    "&key=" +
    GOOGLE_KEY

  const res = await axios.get(url)
  const data = res.data

  if (data.status !== "OK" || !data.results.length) {
    console.log("⚠️ Không tìm được tọa độ:", fullAddress, "status:", data.status)
    geocodeCache[fullAddress] = [0, 0]
    return [0, 0]
  }

  const loc = data.results[0].geometry.location
  const coords = [loc.lng, loc.lat] // GeoJSON: [lng, lat]
  geocodeCache[fullAddress] = coords
  // delay nhẹ để tránh rate limit
  await new Promise(r => setTimeout(r, 200))
  return coords
}

function makeSlug(title, postId = "", index = 0) {
  const base = toSlug(title)
  const randSuffix = Math.random().toString(36).slice(2, 6)
  if (postId) return `${base}-${postId}-${randSuffix}`
  return `${base}-${index + 1}-${randSuffix}`
}

// =========================
// MAIN
// =========================

async function main() {
  const result = []

  // 1) 5 tin gốc từ batdongsan
  for (let i = 0; i < BDS_BASE.length; i++) {
    const base = BDS_BASE[i]
    const addrObj = parseFullAddress(base.fullAddress)
    const coordinates = await geocode(addrObj.fullAddress)

    const title = base.title
    const slug = makeSlug(title, base.postId, i)
    const purpose = "sale"
    const type = "apartment"
    const bedrooms = rand(2, 4)
    const bathrooms = rand(1, 3)
    const livingrooms = 1
    const kitchens = 1
    const area = rand(70, 140)
    const priceValue = rand(5_000_000_000, 25_000_000_000)
    const ownerId = pick(OWNER_IDS)

    result.push({
      title,
      description: base.description,
      slug,
      status: "active",
      visibility: "public",
      postType: i % 2 === 0 ? "vip" : "normal",
      purpose,
      type,
      yearBuilt: rand(2013, 2022),
      area,
      rooms: {
        bedrooms,
        bathrooms,
        livingrooms,
        kitchens
      },
      amenities: AMENITIES.sort(() => 0.5 - Math.random()).slice(0, rand(3, 7)),
      address: {
        ...addrObj,
        location: {
          type: "Point",
          coordinates
        }
      },
      price: {
        value: priceValue,
        currency: "VND",
        period: "other"
      },
      media: buildMediaFromUrls(base.images, i),
      owner: { $oid: ownerId },
      expireAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 2) Các tin random thêm cho đủ 50 bản ghi
  const TOTAL = 50
  for (let i = BDS_BASE.length; i < TOTAL; i++) {
    const addr = ADDRESSES[i % ADDRESSES.length]
    const coordinates = await geocode(addr.fullAddress)

    const type = TYPES[i % TYPES.length]
    const purpose = PURPOSES[i % PURPOSES.length]
    const bedrooms = type === "land" ? 0 : rand(1, 4)
    const bathrooms = bedrooms === 0 ? 0 : rand(1, 3)
    const livingrooms = bedrooms === 0 ? 0 : 1
    const kitchens = bedrooms === 0 ? 0 : 1
    const floors = ["house", "townhouse", "villa"].includes(type) ? rand(2, 5) : 1

    const titleTemplate = pick(TITLE_TEMPLATES)
    const districtName = addr.district || addr.province || "khu vực trung tâm"
    const title = titleTemplate
      .replace("{rooms}", bedrooms)
      .replace("{floors}", floors)
      .replace("{district}", districtName)

    const slug = makeSlug(title, "", i)

    const area =
      type === "land"
        ? rand(60, 250)
        : ["apartment", "condo", "office"].includes(type)
        ? rand(40, 120)
        : rand(80, 300)

    const priceValue =
      purpose === "sale"
        ? rand(1_500_000_000, 30_000_000_000)
        : rand(8_000_000, 80_000_000)

    const ownerId = pick(OWNER_IDS)

    const description = [
      title,
      "Nội thất hiện đại, khu dân cư an ninh, tiện ích nội khu và ngoại khu đầy đủ.",
      "Gần trường học, bệnh viện, trung tâm thương mại, di chuyển thuận tiện.",
      "Phù hợp để ở lâu dài hoặc đầu tư cho thuê."
    ].join(" ")

    // dùng ảnh batdongsan random
    const img1 = pick(ALL_BDS_IMAGES)
    let img2 = pick(ALL_BDS_IMAGES)
    if (img2 === img1 && ALL_BDS_IMAGES.length > 1) {
      img2 = pick(ALL_BDS_IMAGES)
    }

    result.push({
      title,
      description,
      slug,
      status: "active",
      visibility: "public",
      postType: i % 8 === 0 ? "vip" : "normal",
      purpose,
      type,
      yearBuilt: rand(2010, 2024),
      area,
      rooms: {
        bedrooms,
        bathrooms,
        livingrooms,
        kitchens
      },
      amenities: AMENITIES.sort(() => 0.5 - Math.random()).slice(0, rand(3, 7)),
      address: {
        ...addr,
        location: {
          type: "Point",
          coordinates
        }
      },
      price: {
        value: priceValue,
        currency: "VND",
        period: purpose === "rent" ? "month" : "other"
      },
      media: buildMediaFromUrls([img1, img2], i),
      owner: { $oid: ownerId },
      expireAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8")
  console.log("🎉 DONE! Đã sinh file:", OUTPUT_FILE, "→", result.length, "bản ghi")
}

main().catch(err => {
  console.error("❌ Lỗi khi sinh seed:", err)
})
