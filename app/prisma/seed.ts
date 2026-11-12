import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_TODOS = ["Make coffee", "Organize notes"];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const existing = await prisma.note.count();
    if (existing > 0) {
      console.log(`Seed skipped: notes table already has ${existing} row(s).`);
      return;
    }
    for (const body of [...DEMO_TODOS].reverse()) {
      await prisma.note.create({ data: { body } });
    }
    console.log(`Seeded ${DEMO_TODOS.length} demo todo(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
