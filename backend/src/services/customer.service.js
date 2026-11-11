/**
 * FinPilot AI - Customer Service
 * Encapsulates multi-tenant business logic and MongoDB operations
 */
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const ensureDbConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is currently not connected. Please ensure your IP address is whitelisted in MongoDB Atlas Network Access.');
    error.statusCode = 503;
    throw error;
  }
};

class CustomerService {
  /**
   * Add a new customer scoped to an organization
   */
  async createCustomer(data) {
    ensureDbConnected();
    const { organizationId, customerName, companyName, email, phone, address, GSTIN, customerType, status } = data;

    // 1. Prevent duplicate GSTIN within the same organization
    if (GSTIN) {
      const existingGstin = await Customer.findOne({ organizationId, GSTIN });
      if (existingGstin) {
        const error = new Error(`A customer with GSTIN "${GSTIN}" already exists in your organization.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 2. Prevent duplicate email within the same organization
    if (email) {
      const existingEmail = await Customer.findOne({ organizationId, email });
      if (existingEmail) {
        const error = new Error(`A customer with email "${email}" already exists in your organization.`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 3. Structure address object
    const formattedAddress = {
      city: address && address.city ? address.city.toString().trim() : (typeof address === 'string' ? address.trim() : ''),
      state: address && address.state ? address.state.toString().trim() : '',
      country: address && address.country ? address.country.toString().trim() : 'India',
      pincode: address && address.pincode ? address.pincode.toString().trim() : '',
    };

    // 4. Create customer record
    const customer = await Customer.create({
      organizationId,
      customerName: customerName.trim(),
      companyName: (companyName || '').trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: (phone || '').trim(),
      address: formattedAddress,
      GSTIN: GSTIN ? GSTIN.trim().toUpperCase() : null,
      customerType: customerType || 'Business',
      status: status || 'Active',
    });

    return customer;
  }

  /**
   * Retrieve all customers for an organization with optional filtering, search, and pagination
   */
  async getCustomers(organizationId, options = {}) {
    ensureDbConnected();
    const {
      search,
      status,
      customerType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // 1. Enforce strict organization-level data isolation
    const query = { organizationId };

    // 2. Status filter
    if (status) {
      query.status = status;
    }

    // 3. Customer Type filter
    if (customerType) {
      query.customerType = customerType;
    }

    // 4. Multi-field text search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { companyName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { GSTIN: searchRegex },
      ];
    }

    // 5. Pagination and sorting
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return {
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: pageNum * limitNum < total,
      },
    };
  }

  /**
   * Retrieve a single customer by ID, strictly scoped to organizationId
   */
  async getCustomerById(customerId, organizationId) {
    ensureDbConnected();
    const customer = await Customer.findOne({
      _id: customerId,
      organizationId,
    }).lean();

    if (!customer) {
      const error = new Error('Customer not found or does not belong to this organization.');
      error.statusCode = 404;
      throw error;
    }

    return customer;
  }

  /**
   * Update an existing customer, preventing cross-organization leakage & uniqueness conflicts
   */
  async updateCustomer(customerId, organizationId, updateData) {
    ensureDbConnected();
    // 1. Verify existence in this organization
    const existing = await Customer.findOne({ _id: customerId, organizationId });
    if (!existing) {
      const error = new Error('Customer not found or does not belong to this organization.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check duplicate GSTIN if being changed
    if (updateData.GSTIN && updateData.GSTIN !== existing.GSTIN) {
      const duplicateGstin = await Customer.findOne({
        _id: { $ne: customerId },
        organizationId,
        GSTIN: updateData.GSTIN,
      });
      if (duplicateGstin) {
        const error = new Error(`Another customer in your organization already has GSTIN "${updateData.GSTIN}".`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 3. Check duplicate email if being changed
    if (updateData.email && updateData.email !== existing.email) {
      const duplicateEmail = await Customer.findOne({
        _id: { $ne: customerId },
        organizationId,
        email: updateData.email,
      });
      if (duplicateEmail) {
        const error = new Error(`Another customer in your organization already has email "${updateData.email}".`);
        error.statusCode = 409;
        throw error;
      }
    }

    // 4. Whitelist allowed fields to update
    const allowedFields = [
      'customerName',
      'companyName',
      'email',
      'phone',
      'address',
      'GSTIN',
      'customerType',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        existing[field] = updateData[field];
      }
    });

    const updatedCustomer = await existing.save();
    return updatedCustomer;
  }

  /**
   * Delete a customer record, strictly scoped to organizationId
   */
  async deleteCustomer(customerId, organizationId) {
    ensureDbConnected();
    const deletedCustomer = await Customer.findOneAndDelete({
      _id: customerId,
      organizationId,
    });

    if (!deletedCustomer) {
      const error = new Error('Customer not found or does not belong to this organization.');
      error.statusCode = 404;
      throw error;
    }

    return deletedCustomer;
  }
}

module.exports = new CustomerService();

