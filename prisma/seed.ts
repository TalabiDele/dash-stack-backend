import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Clean existing data to prevent duplicates on multiple runs
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data...');

  // 2. Create Dummy Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: {
      email: 'admin@dashstack.com',
      fullName: 'Admin User',
      password: hashedPassword,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      fullName: 'Test Customer',
      password: hashedPassword,
    },
  });

  // 3. Create Dummy Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Pro Developer Laptop',
        price: 1299.99,
        rating: 4.8,
        images: [
          'https://example.com/laptop1.jpg',
          'https://example.com/laptop2.jpg',
        ],
      },
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Mechanical Keyboard',
        price: 149.5,
        rating: 4.5,
        images: ['https://example.com/key1.jpg'],
      },
    }),
    prisma.product.create({
      data: {
        name: 'Noise Cancelling Headphones',
        price: 299.0,
        rating: 4.2,
        images: [
          'https://example.com/audio1.jpg',
          'https://example.com/audio2.jpg',
        ],
      },
    }),
  ]);

  console.log('Created Users and Products...');

  // 4. Create Dummy Orders (Historical Data for Analytics)
  // We need data from last month and this month to see percentage changes
  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(now.getMonth() - 1);

  const ordersData: any[] = [];

  // Generate 20 orders for LAST month
  for (let i = 0; i < 20; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    ordersData.push({
      productId: randomProduct.id,
      totalAmount: randomProduct.price,
      status: i % 5 === 0 ? 'PENDING' : 'COMPLETED', // 20% pending
      createdAt: new Date(lastMonth.getTime() + Math.random() * 1000000000), // Random time last month
    });
  }

  // Generate 35 orders for THIS month (simulating growth!)
  for (let i = 0; i < 35; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    ordersData.push({
      productId: randomProduct.id,
      totalAmount: randomProduct.price * (Math.random() > 0.8 ? 2 : 1), // Sometimes buy 2
      status: i % 7 === 0 ? 'PENDING' : 'COMPLETED',
      createdAt: new Date(now.getTime() - Math.random() * 1000000000), // Random time this month
    });
  }

  await prisma.order.createMany({ data: ordersData });
  console.log(`Successfully seeded ${ordersData.length} orders for analytics!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
