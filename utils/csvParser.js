const { parse } = require('csv-parse');
const fs = require('fs');

const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const shipments = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({ 
        columns: true, 
        trim: true,
        skip_empty_lines: true
      }))
      .on('data', (row) => {
        shipments.push({
          orderId: row['Order ID'],
          trackingId: row['Tracking Details'],
          status_updates: row['Status Updates'],
          address: row['Delivery Location'],
          estimatedDelivery: row['ETA'] ? row['ETA'].split(' - ')[0] : null
        });
      })
      .on('end', () => resolve(shipments))
      .on('error', (err) => reject(err));
  });
};

const formatTimestamp = (str) => {
  if (!str) return null;
  try {
    // Handle various date formats from CSV
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
};

module.exports = {
  parseCSVFile,
  formatTimestamp
};