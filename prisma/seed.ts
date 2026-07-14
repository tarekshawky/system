import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { Role } from "../lib/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      name: "Manager",
      email: "manager@example.com",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      name: "Staff",
      email: "staff@example.com",
      passwordHash,
      role: Role.STAFF,
    },
  });

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: "Demo Warehouse Co.",
      defaultLowStockThreshold: 10,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "WH-01" },
    update: {},
    create: {
      code: "WH-01",
      name: "المخزن الرئيسي",
      location: "الرياض",
    },
  });

  const category = await prisma.category.create({
    data: { name: "أدوات كهربائية" },
  });

  const product = await prisma.product.upsert({
    where: { sku: "SKU-0001" },
    update: {},
    create: {
      sku: "SKU-0001",
      name: "مثقاب كهربائي",
      categoryId: category.id,
      unit: "قطعة",
      costPrice: 150,
      sellPrice: 220,
      reorderLevel: 5,
    },
  });

  await prisma.stock.upsert({
    where: {
      productId_warehouseId: {
        productId: product.id,
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: {
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: 25,
    },
  });

  await prisma.supplier.create({
    data: {
      name: "شركة التوريدات المتحدة",
      contactName: "خالد أحمد",
      phone: "0500000000",
    },
  });

  await prisma.customer.create({
    data: {
      name: "مؤسسة البناء الحديث",
      contactName: "سارة محمد",
      phone: "0511111111",
    },
  });

  console.log("Seed complete. Admin login: admin@example.com / password123");
  console.log(`Created admin user id=${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
