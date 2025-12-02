// const fs = require("fs");

// // Load raw mixed JSON file (old unclean data)
// const raw = fs.readFileSync("newdata.json", "utf8");
// const mixedData = JSON.parse(raw);

// // Check for proper structure
// if (!mixedData.data || !Array.isArray(mixedData.data)) {
//   console.error("❌ ERROR: Root must be { data: [ ... ] }");
//   process.exit(1);
// }

// // Containers for final formatted structure
// const shipments = {};
// const customers = {};
// const statusUpdates = {};

// // Convert each mixed shipment entry
// mixedData.data.forEach((item) => {
//   const id = item.id;
//   const attr = item.attributes;

//   // ======== SHIPMENT ========
//   shipments[id] = {
//     id,
//     orderId: attr.orderId,
//     trackingId: attr.trackingId,
//     orderDate: attr.orderDate,
//     estimatedDelivery: attr.estimatedDelivery,
//     order_status: attr.order_status,
//     originAddress: attr.originAddress,
//     createdAt: attr.createdAt,
//     updatedAt: attr.updatedAt,
//     publishedAt: attr.publishedAt,
//     customer: attr.customer?.data?.id || null,
//     status_updates: [],
//     createdBy: null,
//     updatedBy: null,
//   };

//   // ======== CUSTOMER ========
//   if (attr.customer?.data) {
//     const c = attr.customer.data;

//     customers[c.id] = {
//       id: c.id,
//       name: c.attributes.name ?? null,
//       address: c.attributes.address ?? null,
//       phone: c.attributes.phone ?? null,
//       createdAt: c.attributes.createdAt,
//       updatedAt: c.attributes.updatedAt,
//       publishedAt: c.attributes.publishedAt,
//       shipment: id,
//       createdBy: null,
//       updatedBy: null,
//     };
//   }

//   // ======== STATUS UPDATES ========
//   if (attr.status_updates?.data) {
//     attr.status_updates.data.forEach((s) => {
//       statusUpdates[s.id] = {
//         id: s.id,
//         timestamp: s.attributes.timestamp,
//         order_status: s.attributes.order_status,
//         details: s.attributes.details,
//         createdAt: s.attributes.createdAt,
//         updatedAt: s.attributes.updatedAt,
//         publishedAt: s.attributes.publishedAt,
//         shipment: id,
//         createdBy: null,
//         updatedBy: null,
//       };

//       shipments[id].status_updates.push(s.id);
//     });
//   }
// });

// // Build final JSON structure
// const finalOutput = {
//   version: 3,
//   data: {
//     "api::shipment.shipment": shipments,
//     "api::customer.customer": customers,
//     "api::status-update.status-update": statusUpdates,
//   },
// };

// // Write final file
// fs.writeFileSync("clean-output.json", JSON.stringify(finalOutput, null, 2));

// console.log("✅ CLEAN CONVERSION DONE → clean-output.json (Version 3)");
