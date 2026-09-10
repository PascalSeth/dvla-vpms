import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: "pascal", mode: "insensitive" } },
        { email: { contains: "pascal", mode: "insensitive" } }
      ]
    },
    include: {
      branch: true
    }
  });

  console.log("USERS FOUND:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => process.exit());
