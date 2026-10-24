import prisma from "../../src/config/db.js";

const DEFAULT_AMENITIES = [
  { name: "Fast Wifi", icon: "wifi" },
  { name: "Air Conditioning", icon: "wind" },
  { name: "Dedicated Workspace", icon: "laptop" },
  { name: "Kitchen", icon: "utensils" },
  { name: "Free Parking", icon: "car" },
  { name: "Swimming Pool", icon: "waves" },
  { name: "Washing Machine", icon: "washing-machine" },
  { name: "TV", icon: "tv" },
  { name: "Balcony", icon: "sun" },
  { name: "Power Backup", icon: "zap" },
];

export const seedAmenities = async () => {
  console.log("Seeding standard amenities...");

  for (const item of DEFAULT_AMENITIES) {
    await prisma.amenity.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  const all = await prisma.amenity.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`Seeded ${all.length} amenities successfully.`);
  return all;
};

// Allow direct CLI execution: node prisma/seed/seedAmenities.js
if (process.argv[1] && process.argv[1].endsWith("seedAmenities.js")) {
  seedAmenities()
    .then((amenities) => {
      console.log(amenities);
      return prisma.$disconnect();
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      return prisma.$disconnect();
    });
}