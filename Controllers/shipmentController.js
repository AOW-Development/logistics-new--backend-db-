const prisma = require("../Config/database");

// Get all shipments with pagination, search, and filtering
const getShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.toLowerCase() : "";
    const status = req.query.status || "";

    // Build where clause
    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { orderId: { contains: search } },
          { trackingId: { contains: search } },
          {
            customer: {
              OR: [
                { name: { contains: search } },
                { address: { contains: search } },
              ],
            },
          },
        ],
      }),
      ...(status && status !== "all" && { order_status: status }),
    };

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          customer: {
            select: { name: true, address: true, phone: true },
          },
          statusUpdates: {
            orderBy: { status_update_ord: "desc" },
            take: 1,
          },
        },
        orderBy: { orderDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ]);

    // Format response
    const formattedShipments = shipments.map((shipment, index) => ({
      sNo: (page - 1) * limit + index + 1,
      id: shipment.id,
      orderId: shipment.orderId,
      trackingId: shipment.trackingId,
      customer: shipment.customer?.name || "N/A",
      address: shipment.customer?.address || "N/A",
      phone: shipment.customer?.phone || "N/A",
      status: shipment.order_status,
      date: shipment.orderDate.toLocaleDateString("en-GB"),
      estimatedDelivery: shipment.estimatedDelivery
        ? shipment.estimatedDelivery.toLocaleDateString("en-GB")
        : "N/A",
      lastUpdate: shipment.statusUpdates[0]
        ? shipment.statusUpdates[0].timestamp
        : null,
    }));

    res.json({
      shipments: formattedShipments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// In your shipmentController.js

// Get shipment details with full tracking history
const getShipmentDetails = async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        statusUpdates: {
          orderBy: { status_update_ord: "desc" },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Format the response to match frontend expectations
    const formattedShipment = {
      id: shipment.id,
      orderId: shipment.orderId,
      trackingId: shipment.trackingId,
      orderDate: shipment.orderDate,
      estimatedDelivery: shipment.estimatedDelivery,
      order_status: shipment.order_status,
      status: shipment.order_status, // Add this for frontend compatibility
      originAddress: shipment.originAddress,

      // Customer data in expected format
      customer: shipment.customer
        ? {
            id: shipment.customer.id,
            name: shipment.customer.name,
            address: shipment.customer.address,
            phone: shipment.customer.phone,
          }
        : null,

      // Status updates in expected format
      statusUpdates: shipment.statusUpdates.map((update) => ({
        id: update.id,
        status: update.order_status,
        details: update.details,
        location: update.location,
        timestamp: update.timestamp,
        createdAt: update.timestamp, // For sorting
      })),
    };

    res.json(formattedShipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track shipment (public endpoint)
// Track shipment (public endpoint)
// Track shipment (public endpoint)
const trackShipment = async (req, res) => {
  try {
    const trackingId = req.params.trackingId.trim();

    console.log("Tracking request for:", trackingId);

    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { trackingId: { equals: trackingId } }, // exact match
          { trackingId: { contains: trackingId } }, // partial match
          { trackingId: { contains: trackingId.replace(/\D/g, "") } }, // digits only
        ],
        isPublished: true,
      },
      include: {
        customer: true,
        statusUpdates: {
          orderBy: { status_update_ord: "desc" },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const trackingInfo = {
      id: shipment.id,
      orderId: shipment.orderId,
      trackingId: shipment.trackingId,
      status: shipment.order_status,
      estimatedDelivery: shipment.estimatedDelivery,
      customer: shipment.customer
        ? {
            id: shipment.customer.id,
            name: shipment.customer.name,
            address: shipment.customer.address,
            phone: shipment.customer.phone,
          }
        : null,
      statusUpdates: shipment.statusUpdates.map((update) => ({
        id: update.id,
        status: update.order_status,
        details: update.details,
        location: update.location,
        timestamp: update.timestamp,
        createdAt: update.timestamp,
      })),
    };

    res.json(trackingInfo);
  } catch (error) {
    console.error("Error in trackShipment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add these to your shipmentController.js

// Debug endpoint to list all tracking IDs
const debugTrackingIds = async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      select: {
        id: true,
        trackingId: true,
        orderId: true,
        order_status: true,
      },
      where: { isPublished: true },
      orderBy: { trackingId: "asc" },
    });

    res.json({
      total: shipments.length,
      shipments: shipments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search for a specific tracking ID pattern
const searchTrackingId = async (req, res) => {
  try {
    const { pattern } = req.params;
    const shipments = await prisma.shipment.findMany({
      where: {
        trackingId: { contains: pattern },
        isPublished: true,
      },
      select: {
        id: true,
        trackingId: true,
        orderId: true,
        order_status: true,
      },
    });

    res.json({
      pattern: pattern,
      results: shipments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update shipment status with tracking history
const updateStatus = async (req, res) => {
  try {
    const { order_status, details, location, timestamp } = req.body;
    const shipmentId = parseInt(req.params.id);

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        statusUpdates: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Get the next order number for status update
    const statusUpdateCount = await prisma.statusUpdate.count({
      where: { shipmentId },
    });

    // Create new status update
    const statusUpdate = await prisma.statusUpdate.create({
      data: {
        order_status: order_status || shipment.order_status,
        details: details || null,
        location: location || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status_update_ord: statusUpdateCount + 1,
        publishedAt: new Date(),
        shipmentId,
      },
    });

    // Update shipment status if provided
    if (order_status) {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { order_status },
      });
    }

    // Get updated shipment with tracking history
    const updatedShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        customer: true,
        statusUpdates: {
          orderBy: { status_update_ord: "desc" },
        },
      },
    });

    res.json({
      message: "Status updated successfully",
      shipment: updatedShipment,
      statusUpdate,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get shipment by tracking ID (public endpoint)
// const trackShipment = async (req, res) => {
//   try {
//     const shipment = await prisma.shipment.findFirst({
//       where: {
//         trackingId: req.params.trackingId,
//         isPublished: true,
//       },
//       include: {
//         customer: true,
//         statusUpdates: {
//           orderBy: { status_update_ord: "desc" },
//         },
//       },
//     });

//     if (!shipment) {
//       return res.status(404).json({ error: "Shipment not found" });
//     }

// Format for public tracking
//     const trackingInfo = {
//       orderId: shipment.orderId,
//       trackingId: shipment.trackingId,
//       status: shipment.order_status,
//       estimatedDelivery: shipment.estimatedDelivery,
//       customer: {
//         name: shipment.customer?.name || "Customer",
//         address: shipment.customer?.address || "Address not available",
//       },
//       trackingHistory: shipment.statusUpdates.map((update) => ({
//         status: update.order_status,
//         timestamp: update.timestamp,
//         details: update.details,
//         location: update.location,
//       })),
//     };

//     res.json(trackingInfo);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Delete shipment with all status updates
const deleteShipment = async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!existingShipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Delete all status updates first
    await prisma.statusUpdate.deleteMany({
      where: { shipmentId },
    });

    // Delete the shipment
    await prisma.shipment.delete({
      where: { id: shipmentId },
    });

    res.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Shipment not found" });
    }
    res.status(500).json({ error: error.message });
  }
};
// Create a new shipment
const createShipment = async (req, res) => {
  try {
    const {
      orderId,
      trackingId,
      customerId,
      orderDate,
      estimatedDelivery,
      originAddress,
      deliveryAddress,
      order_status,
    } = req.body;

    const newShipment = await prisma.shipment.create({
      data: {
        orderId,
        trackingId,
        customerId,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : null,
        originAddress,
        deliveryAddress,
        order_status: order_status || "yet_to_be_picked",
        isPublished: true,
      },
    });

    res.status(201).json({
      message: "Shipment created successfully",
      shipment: newShipment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update an existing shipment
const updateShipment = async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);

    const {
      orderId,
      trackingId,
      customerId,
      orderDate,
      estimatedDelivery,
      originAddress,
      deliveryAddress,
      order_status,
    } = req.body;

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        orderId,
        trackingId,
        customerId,
        orderDate: orderDate ? new Date(orderDate) : undefined,
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : undefined,
        originAddress,
        deliveryAddress,
        order_status,
      },
    });

    res.json({
      message: "Shipment updated successfully",
      shipment: updatedShipment,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Shipment not found" });
    }
    res.status(500).json({ error: error.message });
  }
};
// In shipmentController.js
const findShipmentByTracking = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const strategies = [
      { trackingId: { equals: trackingId } }, // exact
      { trackingId: { equals: trackingId.trim() } }, // trimmed
      { trackingId: { contains: trackingId } }, // partial
      { trackingId: { contains: trackingId.replace(/\D/g, "") } }, // numbers only
    ];

    for (const whereClause of strategies) {
      const shipment = await prisma.shipment.findFirst({
        where: { ...whereClause, isPublished: true },
        include: {
          customer: true,
          statusUpdates: {
            orderBy: { status_update_ord: "desc" },
          },
        },
      });

      if (shipment) {
        return res.json({
          id: shipment.id,
          orderId: shipment.orderId,
          trackingId: shipment.trackingId,
          status: shipment.order_status,
          estimatedDelivery: shipment.estimatedDelivery,
          customer: shipment.customer,
          statusUpdates: shipment.statusUpdates,
        });
      }
    }

    res.status(404).json({ error: "Shipment not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dashboard data (summary counts, latest shipments)
const getDashboardData = async (req, res) => {
  try {
    const totalShipments = await prisma.shipment.count();
    const deliveredCount = await prisma.shipment.count({
      where: { order_status: "delivered" },
    });
    const inTransitCount = await prisma.shipment.count({
      where: { order_status: "intransit" },
    });
    const pendingCount = await prisma.shipment.count({
      where: { NOT: { order_status: "delivered" } },
    });

    const recentShipments = await prisma.shipment.findMany({
      orderBy: { orderDate: "desc" },
      take: 5,
      include: {
        customer: { select: { name: true } },
      },
    });

    res.json({
      stats: {
        totalShipments,
        deliveredCount,
        inTransitCount,
        pendingCount,
      },
      recentShipments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Bulk import shipments
const importShipments = async (req, res) => {
  try {
    const { shipments } = req.body; // expect an array of shipment objects

    if (!shipments || !Array.isArray(shipments)) {
      return res
        .status(400)
        .json({ error: "Invalid input, expected an array of shipments" });
    }

    const createdShipments = await prisma.shipment.createMany({
      data: shipments.map((s) => ({
        orderId: s.orderId,
        trackingId: s.trackingId,
        customerId: s.customerId,
        orderDate: s.orderDate ? new Date(s.orderDate) : new Date(),
        estimatedDelivery: s.estimatedDelivery
          ? new Date(s.estimatedDelivery)
          : null,
        originAddress: s.originAddress,
        deliveryAddress: s.deliveryAddress,
        order_status: s.order_status || "yet_to_be_picked",
        isPublished: true,
      })),
      skipDuplicates: true, // avoid inserting same orderId/trackingId twice
    });

    res.json({
      message: "Shipments imported successfully",
      count: createdShipments.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Bulk update all status updates for given shipments
const updateAllStatusUpdates = async (req, res) => {
  try {
    const { updates } = req.body;
    // Expect: [{ shipmentId, order_status, details, location, timestamp }, ...]

    if (!updates || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "Invalid input, expected an array of updates" });
    }

    const results = [];

    for (const update of updates) {
      const shipment = await prisma.shipment.findUnique({
        where: { id: update.shipmentId },
      });
      if (!shipment) continue;

      // count existing updates
      const count = await prisma.statusUpdate.count({
        where: { shipmentId: update.shipmentId },
      });

      // create status update
      const statusUpdate = await prisma.statusUpdate.create({
        data: {
          order_status: update.order_status || shipment.order_status,
          details: update.details || null,
          location: update.location || null,
          timestamp: update.timestamp ? new Date(update.timestamp) : new Date(),
          status_update_ord: count + 1,
          publishedAt: new Date(),
          shipmentId: update.shipmentId,
        },
      });

      // update main shipment if status changed
      if (update.order_status) {
        await prisma.shipment.update({
          where: { id: update.shipmentId },
          data: { order_status: update.order_status },
        });
      }

      results.push(statusUpdate);
    }

    res.json({ message: "Bulk status updates applied", updates: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res
        .status(400)
        .json({ error: "Order ID and status are required" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};
// Publish all shipments (dummy example, adjust to your logic)
const publishAll = async (req, res) => {
  try {
    const result = await prisma.shipment.updateMany({
      data: { published: true },
    });

    res.status(200).json({ message: "All shipments published", result });
  } catch (error) {
    console.error("Error publishing all shipments:", error);
    res.status(500).json({ error: "Failed to publish all shipments" });
  }
};
// Create a status update for a shipment by tracking ID
const createStatusUpdateByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { status, details, timestamp } = req.body;

    // Find the shipment by tracking ID
    const shipment = await prisma.shipment.findFirst({
      where: { trackingId, isPublished: true },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Get the next order number for status update
    const statusUpdateCount = await prisma.statusUpdate.count({
      where: { shipmentId: shipment.id },
    });

    // Create new status update
    const statusUpdate = await prisma.statusUpdate.create({
      data: {
        order_status: status,
        details: details || null,
        location: null, // You can add location if needed
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status_update_ord: statusUpdateCount + 1,
        publishedAt: new Date(),
        shipmentId: shipment.id,
      },
    });

    // Update shipment status
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { order_status: status },
    });

    res.json({
      message: "Status updated successfully",
      statusUpdate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a status update (generic endpoint)
const createStatusUpdate = async (req, res) => {
  try {
    const { shipmentId, status, details, timestamp } = req.body;

    if (!shipmentId || !status) {
      return res
        .status(400)
        .json({ error: "Shipment ID and status are required" });
    }

    // Check if shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { id: parseInt(shipmentId) },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Get the next order number for status update
    const statusUpdateCount = await prisma.statusUpdate.count({
      where: { shipmentId: parseInt(shipmentId) },
    });

    // Create new status update
    const statusUpdate = await prisma.statusUpdate.create({
      data: {
        order_status: status,
        details: details || null,
        location: null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status_update_ord: statusUpdateCount + 1,
        publishedAt: new Date(),
        shipmentId: parseInt(shipmentId),
      },
    });

    // Update shipment status
    await prisma.shipment.update({
      where: { id: parseInt(shipmentId) },
      data: { order_status: status },
    });

    res.json({
      message: "Status updated successfully",
      statusUpdate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a status update by ID
const deleteStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if status update exists
    const existingStatusUpdate = await prisma.statusUpdate.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingStatusUpdate) {
      return res.status(404).json({ error: "Status update not found" });
    }

    // Delete the status update
    await prisma.statusUpdate.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Status update deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Status update not found" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get available status options
const getStatusOptions = async (req, res) => {
  try {
    const statusOptions = [
      { value: "yet_to_be_picked", label: "Yet to be Picked", icon: "⏳" },
      { value: "picked_up", label: "Picked Up", icon: "📦" },
      { value: "intransit", label: "In Transit", icon: "🚚" },
      { value: "on_the_way", label: "On the Way", icon: "🛣️" },
      { value: "out_for_delivery", label: "Out for Delivery", icon: "📭" },
      { value: "delivered", label: "Delivered", icon: "✅" },
      { value: "cancelled", label: "Cancelled", icon: "❌" },
    ];

    res.json(statusOptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // CRUD
  getShipments,
  getShipmentDetails,
  createShipment,
  updateShipment,
  deleteShipment,

  // Tracking
  trackShipment,
  findShipmentByTracking, // optional but you wrote it

  // Status
  updateStatus,
  getStatusOptions,
  updateOrderStatus,
  publishAll,

  // Status updates
  createStatusUpdateByTrackingId,
  createStatusUpdate,
  deleteStatusUpdate,
  updateAllStatusUpdates,

  // Import / bulk
  importShipments,

  // Dashboard
  getDashboardData,

  // Debug
  debugTrackingIds,
  searchTrackingId,
};
