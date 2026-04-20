// Populates the `Plan` collection with the canonical plan catalogue.
// Run via `node prisma/seed.js` (or `npm run seed`) after `prisma generate`.

import { PrismaClient } from "@prisma/client";
import { plansData } from "../app/constant/plans.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.deleteMany({});
  console.log("--- Old plans removed ---");

  for (const plan of plansData) {
    const { _id, ...rest } = plan;
    await prisma.plan.create({
      data: {
        id: _id,
        ...rest,
      },
    });
  }

  console.log("--- Database seeded successfully ---");
}

main()
  .catch((err) => {
    console.error("Error seeding Plans:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
