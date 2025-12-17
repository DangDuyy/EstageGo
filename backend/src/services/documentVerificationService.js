import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { env } from "~/config/environment"

const MODEL_NAME = "gemini-2.5-flash"

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null

const cccdResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    isDocumentClear: {
      type: SchemaType.BOOLEAN,
      description: "True nếu ảnh CCCD rõ ràng, không mờ hoặc bị che khuất"
    },
    cccdNumber: {
      type: SchemaType.STRING,
      description: "12 chữ số căn cước công dân"
    },
    extractedFullName: {
      type: SchemaType.STRING,
      description: "Họ tên ghi trên CCCD"
    },
    extractedDateOfBirth: {
      type: SchemaType.STRING,
      description: "Ngày sinh định dạng DD/MM/YYYY"
    },
    verificationResult: {
      type: SchemaType.OBJECT,
      properties: {
        isFormatValid: {
          type: SchemaType.BOOLEAN,
          description: "Định dạng CCCD hợp lệ"
        },
        isUserMatch: {
          type: SchemaType.BOOLEAN,
          description: "Trùng khớp với user đã đăng nhập"
        },
        mismatchDetails: {
          type: SchemaType.STRING,
          description: "Lý do không khớp nếu có"
        }
      }
    }
  }
}

const houseDocResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    isDocumentClear: {
      type: SchemaType.BOOLEAN,
      description: "True nếu ảnh rõ ràng và là giấy tờ pháp lý"
    },
    documentType: {
      type: SchemaType.STRING,
      description: "Loại giấy tờ đã nhận diện"
    },
    landAreaSqM: {
      type: SchemaType.NUMBER,
      description: "Diện tích đất"
    },
    houseAreaSqM: {
      type: SchemaType.NUMBER,
      description: "Diện tích xây dựng/nhà"
    },
    officialAddress: {
      type: SchemaType.STRING,
      description: "Địa chỉ chính thức trên giấy"
    },
    verificationResult: {
      type: SchemaType.OBJECT,
      properties: {
        isFormatValid: {
          type: SchemaType.BOOLEAN,
          description: "Định dạng đúng chuẩn giấy tờ"
        },
        isAddressMatch: {
          type: SchemaType.BOOLEAN,
          description: "Địa chỉ có khớp với tin đăng"
        },
        isAreaMatch: {
          type: SchemaType.BOOLEAN,
          description: "Diện tích khớp (sai số <= 10%)"
        },
        mismatchDetails: {
          type: SchemaType.STRING,
          description: "Mô tả lệch thông tin"
        }
      }
    }
  }
}

const ensureModel = (schema) => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  if (!genAI) {
    throw new Error("Gemini client is not initialized")
  }

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  })
}

const bufferToInlineData = (file) => {
  if (!file?.buffer) throw new Error("Missing file buffer for verification")

  return {
    inlineData: {
      mimeType: file.mimetype || "image/jpeg",
      data: file.buffer.toString("base64")
    }
  }
}

const normalizeDob = (dob) => {
  if (!dob) return ""
  const dateObj = new Date(dob)
  if (Number.isNaN(dateObj.getTime())) return ""
  const dd = String(dateObj.getDate()).padStart(2, "0")
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0")
  const yyyy = dateObj.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const buildCCCDPrompt = (userInfo) => `
TASK: Phân tích ảnh thẻ căn cước công dân (CCCD) Việt Nam, trích xuất thông tin và đối chiếu với dữ liệu người đăng bài.

THÔNG TIN NGƯỜI DÙNG (cần đối chiếu):
- Họ tên hệ thống: "${userInfo.fullName || ""}"
- Ngày sinh hệ thống: "${normalizeDob(userInfo.dob)}"

YÊU CẦU:
1. Trích xuất: Số CCCD (12 số), họ tên, ngày sinh từ ảnh.
2. Đánh giá chất lượng ảnh có đủ rõ để xác thực hay không.
3. Kiểm tra định dạng (12 số, ngày sinh hợp lệ).
4. So sánh họ tên và ngày sinh trên CCCD với dữ liệu người dùng. Nếu không khớp, mô tả chi tiết.
`

const formatAddress = (address = {}) => {
  const segments = [
    address.street,
    address.ward,
    address.district,
    address.province
  ].filter(Boolean)

  return segments.join(", ")
}

const buildHousePrompt = (propertyData) => `
TASK: Phân tích ảnh giấy tờ nhà đất Việt Nam (Sổ hồng / Sổ đỏ / Hợp đồng) và đối chiếu với dữ liệu tin đăng.

THÔNG TIN CẦN ĐỐI CHIẾU:
- Địa chỉ người đăng nhập: ${formatAddress(propertyData.address)}
- Diện tích người nhập: ${propertyData.area || "N/A"} m²

YÊU CẦU:
1. Nhận diện loại giấy tờ và đánh giá độ rõ ràng.
2. Trích xuất địa chỉ chính thức, diện tích đất, diện tích nhà (nếu có).
3. So sánh địa chỉ với phần tỉnh/quận/phường/đường đã nhập.
4. So sánh diện tích với dữ liệu người dùng (cho phép sai số 10%).
5. Ghi chú chi tiết khác biệt nếu không khớp.
`

const runStructuredVision = async (file, prompt, schema) => {
  const model = ensureModel(schema)
  const inlineData = bufferToInlineData(file)

  const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt.trim() },
            inlineData
          ]
        }
      ]
    })

  const text = result.response.text()

  try {
    return JSON.parse(text)
  } catch (error) {
    console.error("[DocumentVerification] Failed to parse structured response:", text)
    throw new Error("Gemini returned an invalid JSON payload")
  }
}

const verifyCCCD = async ({ file, userInfo }) => {
  return runStructuredVision(file, buildCCCDPrompt(userInfo), cccdResponseSchema)
}

const verifyHouseDocument = async ({ file, propertyData }) => {
  return runStructuredVision(file, buildHousePrompt(propertyData), houseDocResponseSchema)
}

export const documentVerificationService = {
  verifyCCCD,
  verifyHouseDocument
}





