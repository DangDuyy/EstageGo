import { ListingTierConfig } from "~/models/listingTierConfig";

const listingTierSeedData = [
  {
    tierName: "basic",
    displayName: {
      vi: "Cơ bản",
      en: "Basic Listing"
    },
    priority: 1,
    features: {
      featuredListing: false
    },
    durations: [
      { days: 30, price: 31500 },
      { days: 60, price: 59000 }
    ],
    isActive: true
  },
  {
    tierName: "boosted",
    displayName: {
      vi: "Tăng cường",
      en: "Boosted Listing"
    },
    priority: 2,
    features: {
      featuredListing: false
    },
    durations: [
      { days: 30, price: 89000 },
      { days: 60, price: 165000 }
    ],
    isActive: true
  },
  {
    tierName: "advanced",
    displayName: {
      vi: "Nâng cao",
      en: "Advanced Listing"
    },
    priority: 3,
    features: {
      featuredListing: true
    },
    durations: [
      { days: 30, price: 214300 },
      { days: 60, price: 399000 }
    ],
    isActive: true
  }
];

export const seedListingTiers = async () => {
  for (const tier of listingTierSeedData) {
    await ListingTierConfig.updateOne(
      { tierName: tier.tierName },
      { $set: tier },
      { upsert: true }
    );
  }

  console.log("✅ ListingTierConfig seeded (schema mới) thành công");
};
