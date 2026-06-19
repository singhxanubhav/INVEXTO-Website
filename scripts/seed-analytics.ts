const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodeCrypto = require("crypto");

async function main() {
  console.log("Seeding analytics data...");

  // Generate some past dates
  const now = new Date();
  
  const countries = [
    { code: "US", name: "United States", weight: 40 },
    { code: "IN", name: "India", weight: 30 },
    { code: "UK", name: "United Kingdom", weight: 10 },
    { code: "CA", name: "Canada", weight: 10 },
    { code: "AU", name: "Australia", weight: 5 },
    { code: "DE", name: "Germany", weight: 5 },
  ];

  const pages = ["/", "/tournament", "/stocks", "/portfolio", "/dictionary", "/login", "/register"];
  const devices = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Desktop", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Mobile", "Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) Tablet"];

  const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomCountry = () => {
    const rand = Math.random() * 100;
    let sum = 0;
    for (const c of countries) {
      sum += c.weight;
      if (rand <= sum) return c;
    }
    return countries[0];
  };

  const events = [];

  for (let i = 0; i < 500; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // last 90 days
    const visitedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);
    const country = getRandomCountry();
    
    events.push({
      visitorId: nodeCrypto.randomUUID(),
      sessionId: nodeCrypto.randomUUID(),
      pagePath: getRandomItem(pages),
      countryCode: country.code,
      countryName: country.name,
      userAgent: getRandomItem(devices),
      referrer: Math.random() > 0.5 ? "https://google.com" : null,
      visitedAt
    });
  }

  await prisma.visitorEvent.createMany({
    data: events
  });

  console.log("Seeded 500 analytics events.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
