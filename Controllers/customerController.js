const prisma = require("../Config/database");

// Get all customers with pagination
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { isPublished: true },
        include: {
          shipments: {
            include: {
              statusUpdates: {
                orderBy: { status_update_ord: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({
        where: { isPublished: true },
      }),
    ]);

    res.json({
      customers,
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

// Get customer by ID
const getCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        shipments: {
          include: {
            statusUpdates: {
              orderBy: { status_update_ord: "asc" },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new customer with validation
const createCustomer = async (req, res) => {
  try {
    const { name, address, phone, isPublished, publishedAt } = req.body;

    // Validate required fields
    if (!name || !address || !phone) {
      return res.status(400).json({
        error: "Name, address, and phone are required fields",
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return res.status(400).json({
        error: "Please provide a valid phone number",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        address,
        phone,
        isPublished: isPublished !== undefined ? isPublished : true,
        publishedAt: publishedAt || new Date(),
      },
      include: {
        shipments: {
          include: {
            statusUpdates: {
              orderBy: { status_update_ord: "asc" },
            },
          },
        },
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Customer with this phone already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

// Update customer with validation
const updateCustomer = async (req, res) => {
  try {
    const { name, address, phone, isPublished, publishedAt } = req.body;
    const customerId = parseInt(req.params.id);

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
        return res.status(400).json({
          error: "Please provide a valid phone number",
        });
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(isPublished !== undefined && { isPublished }),
        ...(publishedAt && { publishedAt }),
      },
      include: {
        shipments: {
          include: {
            statusUpdates: {
              orderBy: { status_update_ord: "asc" },
            },
          },
        },
      },
    });

    // res.json(customer);

    // 👉 Send success message + full updated data
    return res.status(200).json({
      message: "Customer updated successfully",
      updatedCustomer: customer,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Customer with this phone already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Check if customer has associated shipments
    const shipmentCount = await prisma.shipment.count({
      where: { customerId },
    });

    if (shipmentCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete customer with associated shipments. Delete shipments first.",
      });
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Search customers by phone or name
const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
        isPublished: true,
      },
      include: {
        shipments: {
          include: {
            statusUpdates: {
              orderBy: { status_update_ord: "asc" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
};
