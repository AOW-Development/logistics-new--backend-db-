const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  // 1. Ensure default admin exists
  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  await prisma.admin.upsert({
    where: { username: "Admin" },
    update: {},
    create: {
      username: "Admin",
      email: "admin@aow.co.in",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("✅ Default Admin ensured");

  // 2. Load Strapi export JSON
  const filePath = path.join(__dirname, "json", "clean-output.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData).data;

  // 🔍 Debug logs
  console.log(
    "Customers found:",
    Object.keys(data["api::customer.customer"] || {}).length
  );
  console.log(
    "Shipments found:",
    Object.keys(data["api::shipment.shipment"] || {}).length
  );
  console.log(
    "Status Updates found:",
    Object.keys(data["api::status-update.status-update"] || {}).length
  );

  // 3. Insert customers
  const customers = Object.values(data["api::customer.customer"] || {});
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id }, // prevents duplicates
      update: {},
      create: {
        id: c.id, // ✅ allowed since PK is Int autoincrement
        name:
          c.name && c.name.trim() !== "" ? c.name : `Unknown Customer ${c.id}`,
        address: c.address || "Unknown Address",
        phone: c.phone && c.phone.trim() !== "" ? c.phone : "N/A",
        isPublished: c.publishedAt ? true : false,
        publishedAt: c.publishedAt ? new Date(c.publishedAt) : new Date(),
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✅ Inserted ${customers.length} customers`);

  // 4. Insert shipments
  const shipments = Object.values(data["api::shipment.shipment"] || {});
  for (const s of shipments) {
    let customerId = null;

    if (s.customer && typeof s.customer === "object" && s.customer.id) {
      customerId = s.customer.id;
    } else if (typeof s.customer === "number") {
      customerId = s.customer;
    }

    await prisma.shipment.upsert({
      where: { id: s.id }, // prevents duplicates
      update: {},
      create: {
        id: s.id, // ✅ we can set because JSON has original IDs
        orderId: s.orderId || `ORD-${s.id}`,
        trackingId: s.trackingId ? `${s.trackingId}-${s.id}` : `TRK-${s.id}`,
        orderDate: s.orderDate ? new Date(s.orderDate) : new Date(),
        estimatedDelivery: s.estimatedDelivery
          ? new Date(s.estimatedDelivery)
          : null,
        order_status: s.order_status || "yet_to_be_picked",
        originAddress: s.originAddress || "Unknown Origin",
        customerId: customerId || 1, // 👈 FK must be set
        isPublished: s.publishedAt ? true : false,
        publishedAt: s.publishedAt ? new Date(s.publishedAt) : new Date(),
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✅ Inserted ${shipments.length} shipments`);

  // 5. Insert status updates
  const statusUpdates = Object.values(
    data["api::status-update.status-update"] || {}
  );
  for (const su of statusUpdates) {
    let shipmentId = null;

    if (su.shipment && typeof su.shipment === "object" && su.shipment.id) {
      shipmentId = su.shipment.id;
    } else if (typeof su.shipment === "number") {
      shipmentId = su.shipment;
    }

    await prisma.statusUpdate.upsert({
      where: { id: su.id }, // prevents duplicates
      update: {},
      create: {
        id: su.id,
        order_status: su.order_status || "yet_to_be_picked",
        timestamp: su.timestamp ? new Date(su.timestamp) : new Date(),
        details: su.details || null,
        location: su.location || null,
        status_update_ord: su.status_update_ord || 1,
        shipmentId: shipmentId || 1, // 👈 FK required
        isPublished: su.publishedAt ? true : false,
        publishedAt: su.publishedAt ? new Date(su.publishedAt) : new Date(),
        createdAt: su.createdAt ? new Date(su.createdAt) : new Date(),
        updatedAt: su.updatedAt ? new Date(su.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✅ Inserted ${statusUpdates.length} status updates`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
