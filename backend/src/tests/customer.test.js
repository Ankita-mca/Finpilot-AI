/**
 * FinPilot AI - Customer Management Automated Test Suite
 * Validates CRUD, Tenant Isolation, Validation, and MongoDB Persistence
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');
const mongoose = require('mongoose');
const app = require('../../app');
const connectDB = require('../config/db');

let server;
const PORT = 5098;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    };

    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting FinPilot AI Customer Management Test Suite...\n');
  let passed = 0;
  let failed = 0;

  // Connect to MongoDB Atlas
  await connectDB();
  server = app.listen(PORT);

  const orgId1 = new mongoose.Types.ObjectId().toString();
  const orgId2 = new mongoose.Types.ObjectId().toString();

  let customer1Id = null;

  try {
    // Test 1: Validation failure on missing required fields
    const invalidCreate = await makeRequest('POST', '/api/customers', {
      customerName: '',
      organizationId: orgId1,
    });
    if (invalidCreate.status === 400 && invalidCreate.body.success === false) {
      console.log('✅ Test 1 Passed: POST /api/customers rejects missing customerName with 400 Bad Request');
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Validation failure expected', invalidCreate);
      failed++;
    }

    // Test 2: Add customer for Org 1
    const createRes = await makeRequest('POST', '/api/customers', {
      organizationId: orgId1,
      customerName: 'Kalyan Precision Forgings',
      companyName: 'Kalyan Precision Pvt Ltd',
      email: 'accounts@kalyanprecision.in',
      phone: '+91 9822012345',
      address: {
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        pincode: '411018',
      },
      GSTIN: '27AABCK1234F1Z5',
      customerType: 'Business',
      status: 'Active',
    });

    if (
      createRes.status === 201 &&
      createRes.body.success === true &&
      createRes.body.data._id
    ) {
      customer1Id = createRes.body.data._id;
      console.log('✅ Test 2 Passed: POST /api/customers created customer record in MongoDB Atlas');
      passed++;
    } else {
      console.error('❌ Test 2 Failed: Customer creation error', createRes);
      failed++;
    }

    // Test 3: Prevent duplicate GSTIN within same organization
    const duplicateGstin = await makeRequest('POST', '/api/customers', {
      organizationId: orgId1,
      customerName: 'Another Company With Same GSTIN',
      GSTIN: '27AABCK1234F1Z5',
    });
    if (duplicateGstin.status === 409 && duplicateGstin.body.success === false) {
      console.log('✅ Test 3 Passed: POST /api/customers prevented duplicate GSTIN with 409 Conflict');
      passed++;
    } else {
      console.error('❌ Test 3 Failed: Duplicate GSTIN detection', duplicateGstin);
      failed++;
    }

    // Test 4: Get all customers for Org 1 (with header isolation)
    const listRes = await makeRequest('GET', '/api/customers', null, {
      'x-organization-id': orgId1,
    });
    if (
      listRes.status === 200 &&
      listRes.body.success === true &&
      listRes.body.data.customers.length >= 1
    ) {
      console.log('✅ Test 4 Passed: GET /api/customers retrieved customers list for Org 1');
      passed++;
    } else {
      console.error('❌ Test 4 Failed: Customer list retrieval', listRes);
      failed++;
    }

    // Test 5: Tenant Isolation - Org 2 cannot see Org 1 customers
    const org2List = await makeRequest('GET', '/api/customers', null, {
      'x-organization-id': orgId2,
    });
    if (
      org2List.status === 200 &&
      org2List.body.data.customers.length === 0
    ) {
      console.log('✅ Test 5 Passed: Tenant Isolation verified (Org 2 cannot see Org 1 records)');
      passed++;
    } else {
      console.error('❌ Test 5 Failed: Tenant isolation leak', org2List);
      failed++;
    }

    // Test 6: Get customer by ID
    const getSingle = await makeRequest('GET', `/api/customers/${customer1Id}`, null, {
      'x-organization-id': orgId1,
    });
    if (
      getSingle.status === 200 &&
      getSingle.body.data.customerName === 'Kalyan Precision Forgings'
    ) {
      console.log('✅ Test 6 Passed: GET /api/customers/:id retrieved single customer details');
      passed++;
    } else {
      console.error('❌ Test 6 Failed: Single customer retrieval', getSingle);
      failed++;
    }

    // Test 7: Tenant Isolation on GET by ID - Org 2 cannot access Org 1 customer
    const crossOrgGet = await makeRequest('GET', `/api/customers/${customer1Id}`, null, {
      'x-organization-id': orgId2,
    });
    if (crossOrgGet.status === 404) {
      console.log('✅ Test 7 Passed: Cross-org access blocked on GET /api/customers/:id (returned 404)');
      passed++;
    } else {
      console.error('❌ Test 7 Failed: Cross-org read leak', crossOrgGet);
      failed++;
    }

    // Test 8: Update customer details (PUT)
    const updateRes = await makeRequest(
      'PUT',
      `/api/customers/${customer1Id}`,
      {
        companyName: 'Kalyan Precision International Ltd',
        phone: '+91 9988776655',
      },
      { 'x-organization-id': orgId1 }
    );
    if (
      updateRes.status === 200 &&
      updateRes.body.data.companyName === 'Kalyan Precision International Ltd'
    ) {
      console.log('✅ Test 8 Passed: PUT /api/customers/:id updated customer successfully');
      passed++;
    } else {
      console.error('❌ Test 8 Failed: Customer update failed', updateRes);
      failed++;
    }

    // Test 9: Delete customer (DELETE)
    const deleteRes = await makeRequest(
      'DELETE',
      `/api/customers/${customer1Id}`,
      null,
      { 'x-organization-id': orgId1 }
    );
    if (deleteRes.status === 200 && deleteRes.body.success === true) {
      console.log('✅ Test 9 Passed: DELETE /api/customers/:id deleted customer successfully');
      passed++;
    } else {
      console.error('❌ Test 9 Failed: Customer deletion failed', deleteRes);
      failed++;
    }

    // Test 10: Verify customer no longer exists after deletion
    const verifyDeleted = await makeRequest('GET', `/api/customers/${customer1Id}`, null, {
      'x-organization-id': orgId1,
    });
    if (verifyDeleted.status === 404) {
      console.log('✅ Test 10 Passed: Verified customer is deleted (returned 404)');
      passed++;
    } else {
      console.error('❌ Test 10 Failed: Customer still accessible after delete', verifyDeleted);
      failed++;
    }

    console.log(`\n========================================`);
    console.log(`Customer Module Tests: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('💥 Test suite runner error:', err);
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

