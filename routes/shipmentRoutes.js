const express = require("express");
const router = express.Router();
const shipmentController = require("../Controllers/shipmentController");
const { authenticateToken } = require("../middleware/auth");

// ==========================
// TRACKING ----NO AUTH
// ==========================
router.get("/track/:trackingId", shipmentController.trackShipment);
router.get("/by-tracking/:trackingId", shipmentController.trackShipment);

// Apply authentication to all routes
router.use(authenticateToken);

// ==========================
// SHIPMENTS CRUD
// ==========================
router.post("/", shipmentController.createShipment);
router.put("/:id", shipmentController.updateShipment);
router.delete("/:id", shipmentController.deleteShipment);
router.get("/", shipmentController.getShipments);

// ==========================
// STATUS UPDATES
// ==========================
router.post(
  "/:trackingId/status",
  shipmentController.createStatusUpdateByTrackingId
);
router.post("/status-updates", shipmentController.createStatusUpdate);
router.delete("/status-updates/:id", shipmentController.deleteStatusUpdate);

// ==========================
// IMPORT / BULK
// ==========================
router.post("/import", shipmentController.importShipments);
router.put(
  "/update-all-status-updates",
  shipmentController.updateAllStatusUpdates
);

// ==========================
// STATUS
// ==========================
router.put("/:id/update-status", shipmentController.updateStatus);
router.put("/publish-all", shipmentController.publishAll);
router.post("/order-status", shipmentController.updateOrderStatus);
router.get("/status-options", shipmentController.getStatusOptions);

// ==========================
// DEBUG ROUTES (remove in production)
// ==========================
router.get("/debug/tracking-ids", shipmentController.debugTrackingIds);
router.get(
  "/debug/search-tracking/:pattern",
  shipmentController.searchTrackingId
);

// ==========================
// DASHBOARD
// ==========================
router.get("/dashboard", shipmentController.getDashboardData);

// ==========================
// GET BY ID (keep last!)
// ==========================
router.get("/:id", shipmentController.getShipmentDetails);

module.exports = router;
