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
    district: z.string().nonempty("The district can't be empty"),
    ward: z.string().nonempty("The ward can't be empty"),
    street: z.string().nonempty("The street can't be empty"),
    location: z.object({
      coordinates: z
        .array(z.number())
        .length(2, "Cần 2 giá trị [lng, lat]"),
    }),
  }),

  price: z.object({
    value: z.number().min(0, "Giá phải ≥ 0"),
    currency: z.enum(["VND", "USD", "EUR"]),
    period: z.enum(["month", "year", "other"]),
  }),

  files: z
    .any()
    .refine((files) => files?.length > 0, "At least one file is required"), // validate file
  
  tour_link: z.string().url("Link không hợp lệ. Vui lòng nhập đúng URL.").optional()
});
