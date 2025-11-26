const Customer = require('../models/customer');
const Shipment = require('../models/shipment');
const StatusUpdate = require('../models/statusUpdate');
const { formatTimestamp } = require('./csvParser');

const processShipments = async (shipments) => {
  const results = [];
  const now = new Date();
  
  for (const shipment of shipments) {
    try {
      // 1. Upsert Customer
      let customer = await Customer.findOne({ address: shipment.address });
      if (!customer) {
        customer = await Customer.create({
          address: shipment.address,
          name: 'Unknown', // Default name if not provided
          phone: 'Unknown' // Default phone if not provided
        });
      }

      // 2. Upsert Shipment
      let dbShipment = await Shipment.findOne({ orderId: shipment.orderId });
      const shipmentData = {
        orderId: shipment.orderId,
        trackingId: shipment.trackingId,
        estimatedDelivery: formatTimestamp(shipment.estimatedDelivery),
        orderDate: now,
        order_status: 'yet_to_be_picked',
        customer: customer._id
      };

      if (dbShipment) {
        dbShipment = await Shipment.findByIdAndUpdate(
          dbShipment._id, 
          shipmentData, 
          { new: true }
        );
      } else {
        dbShipment = await Shipment.create(shipmentData);
      }

      // 3. Process Status Updates
      const statusList = shipment.status_updates ? shipment.status_updates.split('|') : [];
      const statusUpdates = [];
      
      for (const [index, status] of statusList.entries()) {
        const parts = status.trim().split(' ').filter(Boolean);
        if (parts.length === 0) continue;
        
        const status_type = parts[0];
        const timestampIdx = parts.findIndex(part => 
          /\d{1,2}\/\d{1,2}\/\d{4}/.test(part)
        );
        
        const timestamp = timestampIdx !== -1 ? 
          parts.slice(timestampIdx).join(' ') : null;
        
        const location = timestampIdx !== -1 ? 
          parts.slice(1, timestampIdx).join(' ') : 
          parts.slice(1).join(' ');

        const statusUpdateData = {
          order_status: status_type,
          timestamp: formatTimestamp(timestamp) || now,
          details: location || 'No details provided',
          status_update_ord: index + 1,
          shipment: dbShipment._id
        };

        // Check if status update already exists
        let statusUpdate = await StatusUpdate.findOne({
          order_status: statusUpdateData.order_status,
          timestamp: statusUpdateData.timestamp,
          details: statusUpdateData.details,
          shipment: dbShipment._id
        });

        if (!statusUpdate) {
          statusUpdate = await StatusUpdate.create(statusUpdateData);
        }
        
        statusUpdates.push(statusUpdate._id);
      }

      // 4. Link Status Updates to Shipment
      if (statusUpdates.length > 0) {
        dbShipment = await Shipment.findByIdAndUpdate(
          dbShipment._id,
          { 
            status_updates: statusUpdates,
            // Update order_status to the latest status update
            order_status: statusUpdates.length > 0 ? 
              (await StatusUpdate.findById(statusUpdates[statusUpdates.length - 1])).order_status : 
              'yet_to_be_picked'
          },
          { new: true }
        );
      }

      results.push({
        orderId: shipment.orderId,
        trackingId: shipment.trackingId,
        customer_id: customer._id,
        status_updates: statusUpdates,
        success: true
      });
    } catch (error) {
      results.push({
        orderId: shipment.orderId,
        trackingId: shipment.trackingId,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

const processStatusUpdates = async (shipments) => {
  const results = [];
  const now = new Date();

  // Fetch all existing shipments to map trackingId to shipment ID
  const allShipments = await Shipment.find({})
    .select('_id trackingId')
    .populate('status_updates');

  const shipmentMap = new Map(allShipments.map(s => [s.trackingId, s]));

  for (const shipmentData of shipments) {
    try {
      const trackingId = shipmentData.trackingId;
      const shipment = shipmentMap.get(trackingId);

      if (!shipment) {
        results.push({
          trackingId,
          message: "Shipment not found, skipped",
          success: false
        });
        continue;
      }

      // 1. Delete existing status updates for this shipment
      if (shipment.status_updates && shipment.status_updates.length > 0) {
        await StatusUpdate.deleteMany({ 
          _id: { $in: shipment.status_updates } 
        });
      }

      // 2. Process new status updates from CSV
      const statusList = shipmentData.status_updates ? 
        shipmentData.status_updates.split('|') : [];
      
      const newStatusUpdates = [];
      
      for (const [index, status] of statusList.entries()) {
        const parts = status.trim().split(' ').filter(Boolean);
        if (parts.length === 0) continue;
        
        const status_type = parts[0];
        const timestampIdx = parts.findIndex(part => 
          /\d{1,2}\/\d{1,2}\/\d{4}/.test(part)
        );
        
        const timestamp = timestampIdx !== -1 ? 
          parts.slice(timestampIdx).join(' ') : null;
        
        const location = timestampIdx !== -1 ? 
          parts.slice(1, timestampIdx).join(' ') : 
          parts.slice(1).join(' ');

        const statusUpdateData = {
          order_status: status_type,
          timestamp: formatTimestamp(timestamp) || now,
          details: location || 'No details provided',
          status_update_ord: index + 1,
          shipment: shipment._id
        };

        const statusUpdate = await StatusUpdate.create(statusUpdateData);
        newStatusUpdates.push(statusUpdate._id);
      }

      // 3. Update shipment with new status_updates and latest order_status
      const latestStatusUpdate = newStatusUpdates.length > 0 ?
        await StatusUpdate.findById(newStatusUpdates[newStatusUpdates.length - 1]) : 
        null;

      const updatedShipment = await Shipment.findByIdAndUpdate(
        shipment._id,
        {
          status_updates: newStatusUpdates,
          order_status: latestStatusUpdate ? 
            latestStatusUpdate.order_status : 'yet_to_be_picked'
        },
        { new: true }
      );

      results.push({
        trackingId,
        orderId: shipmentData.orderId,
        updatedStatusCount: newStatusUpdates.length,
        order_status: updatedShipment.order_status,
        success: true
      });
    } catch (error) {
      results.push({
        trackingId: shipmentData.trackingId,
        error: error.message,
        success: false
      });
    }
  }

  return results;
};

module.exports = {
  processShipments,
  processStatusUpdates
};