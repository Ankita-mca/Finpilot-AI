/**
 * FinPilot AI - Automated Test Suite for AI Assistant APIs
 * Can be run via: npm test (or node src/tests/ai.test.js)
 */
const http = require('http');
const app = require('../../app');

let server;
const PORT = 5099; // Test-specific port

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
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
  console.log('🧪 Starting FinPilot AI Assistant API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  server = app.listen(PORT);

  try {
    // Test 1: Health check
    const health = await makeRequest('GET', '/api/health');
    if (health.status === 200 && health.body.success === true) {
      console.log('✅ Test 1 Passed: GET /api/health returned 200 OK');
      passed++;
    } else {
      console.error('❌ Test 1 Failed: GET /api/health', health);
      failed++;
    }

    // Test 2: Validation on empty query
    const emptyQuery = await makeRequest('POST', '/api/ai/query', { queryText: '' });
    if (emptyQuery.status === 400 && emptyQuery.body.success === false) {
      console.log('✅ Test 2 Passed: POST /api/ai/query rejects empty query with 400 Bad Request');
      passed++;
    } else {
      console.error('❌ Test 2 Failed: POST /api/ai/query validation', emptyQuery);
      failed++;
    }

    // Test 3: Send valid query (ABC Company -> customer ledger card)
    const query1 = await makeRequest('POST', '/api/ai/query', {
      queryText: 'How much does ABC Company owe us?',
    });

    let sessionId = null;
    if (
      query1.status === 200 &&
      query1.body.success === true &&
      query1.body.data.userMessage.sender === 'user' &&
      query1.body.data.assistantMessage.sender === 'assistant' &&
      query1.body.data.assistantMessage.isCard === true &&
      query1.body.data.assistantMessage.isMockResponse === true
    ) {
      sessionId = query1.body.data.session.id;
      console.log('✅ Test 3 Passed: POST /api/ai/query saved user message & assistant reply with mock label');
      passed++;
    } else {
      console.error('❌ Test 3 Failed: POST /api/ai/query response', query1);
      failed++;
    }

    // Test 4: Send general query in same session
    const query2 = await makeRequest('POST', '/api/ai/query', {
      queryText: 'What are my total overdue receivables?',
      sessionId,
    });
    if (
      query2.status === 200 &&
      query2.body.success === true &&
      query2.body.data.assistantMessage.intent === 'overdue_summary'
    ) {
      console.log('✅ Test 4 Passed: POST /api/ai/query processed overdue summary query in same session');
      passed++;
    } else {
      console.error('❌ Test 4 Failed: POST /api/ai/query follow-up', query2);
      failed++;
    }

    // Test 5: Get session history
    if (sessionId) {
      const history = await makeRequest('GET', `/api/ai/sessions/${sessionId}/messages`);
      if (
        history.status === 200 &&
        history.body.success === true &&
        Array.isArray(history.body.data.messages)
      ) {
        console.log(`✅ Test 5 Passed: GET /api/ai/sessions/${sessionId}/messages returned message history`);
        passed++;
      } else {
        console.error('❌ Test 5 Failed: GET /api/ai/sessions/:id/messages', history);
        failed++;
      }
    }

    // Test 6: Delete session history
    if (sessionId) {
      const del = await makeRequest('DELETE', `/api/ai/sessions/${sessionId}/messages`);
      if (del.status === 200 && del.body.success === true) {
        console.log(`✅ Test 6 Passed: DELETE /api/ai/sessions/${sessionId}/messages cleared history`);
        passed++;
      } else {
        console.error('❌ Test 6 Failed: DELETE /api/ai/sessions/:id/messages', del);
        failed++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('💥 Test suite runner error:', err);
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
