import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().nonempty('Tiêu đề không được để trống'),
  
  description: z.string().nonempty("The description can't be empty"),

  status: z.enum(["active", "hidden", "sold", "rented", "draft"]).default('active').optional(),

  visibility: z.enum(["public", "private"]),

  purpose: z.enum(["sale", "rent"]).optional(),

  type: z.enum([
    "apartment",
    "house",
    "condo",
    "land",
    "commercial",
    "office",
    "villa",
    "townhouse",
    "other",
  ]).optional(),

  yearBuilt: z
    .number({ invalid_type_error: "Năm xây dựng phải là số" })
    .max(new Date().getFullYear(), "Năm không vượt quá hiện tại")
    .optional(),

  area: z
    .number({ invalid_type_error: "Diện tích phải là số" })
    .min(0, "Diện tích không thể âm"),

  rooms: z.object({
    bedrooms: z.number().min(0),
    bathrooms: z.number().min(0),
    livingrooms: z.number().min(0),
    kitchens: z.number().min(0),
  }),

  amenities: z.array(z.string()).optional(),

  address: z.object({
    fullAddress: z.string().nonempty("The full address can't be empty").optional(),
    country: z.string().nonempty("The country can't be empty").optional(),
    province: z.string().nonempty("The province can't be empty"),
    // district/ward có thể rỗng nếu đã có coordinates
    district: z.string().optional(),
    ward: z.string().optional(),
    street: z.string().nonempty("The street can't be empty"),
    location: z.object({
      coordinates: z
        .array(z.number())
        .length(2, "Cần 2 giá trị [lng, lat]"),
    }),
  }),

  price: z.object({
    value: z.number({ invalid_type_error: "Giá phải là số" }).gt(0, "Vui lòng nhập giá"),
    currency: z.enum(["VND", "USD", "EUR"]),
    period: z.enum(["month", "year", "other"]),
  }),

  files: z
    .any()
    .refine((files) => files?.length > 0, "At least one file is required")
    .refine((files) => {
      if (!files || !Array.isArray(files)) return true;
      return files.length <= 10;
    }, "Maximum 10 files allowed")
    .refine((files) => {
      if (!files || !Array.isArray(files)) return true;
      const images = files.filter(f => f.type?.startsWith('image/'));
      return images.length >= 1;
    }, "At least 1 image is required")
    .refine((files) => {
      if (!files || !Array.isArray(files)) return true;
      const videos = files.filter(f => f.type?.startsWith('video/'));
      return videos.length <= 2;
    }, "Maximum 2 videos allowed"),
  
  tour_link: z.string().url("Link không hợp lệ. Vui lòng nhập đúng URL.").optional()
});
