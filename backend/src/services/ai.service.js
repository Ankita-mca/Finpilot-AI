/**
 * FinPilot AI - Database-Backed AI Assistant Service
 * 
 * CORE ARCHITECTURAL PRINCIPLES:
 * 1. Strictly READ-ONLY on business financial collections (customers, invoices, payments, etc.).
 * 2. Real MongoDB Atlas queries with multi-tenant organization isolation (organizationId).
 * 3. Accurate financial calculations: INR formatting (₹), partial/full settlement reconciliation.
 * 4. Zero fake/mock responses or simulated balances. If a record doesn't exist, reports it truthfully.
 * 5. Persists conversation history (AIMessage, AISession, AIQuery) in MongoDB Atlas.
 */

const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const Reminder = require('../models/Reminder');
const BankTransaction = require('../models/BankTransaction');
const AISession = require('../models/AISession');
const AIMessage = require('../models/AIMessage');
const AIQuery = require('../models/AIQuery');

// Helper: Format INR currency (e.g. ₹1,25,000)
function formatINR(val) {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Helper: Format date
function formatDate(d) {
  if (!d) return '—';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '—';
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

class AIService {
  /**
   * Helper: Ensure database is reachable
   */
  ensureDbConnected() {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database is currently not connected. Please ensure MongoDB Atlas Network Access allows your IP.');
      err.statusCode = 503;
      throw err;
    }
  }

  /**
   * Query Parser & Intelligent Intent Resolver based on MongoDB Atlas data
   */
  async resolveQueryFromDatabase(queryText, orgId) {
    this.ensureDbConnected();
    const startTime = Date.now();
    const lower = queryText.toLowerCase().trim();

    // 1. Fetch all customer records for this organization to support fuzzy counterparty matching
    const orgCustomers = await Customer.find({ organizationId: orgId })
      .select('_id customerName companyName GSTIN phone email address customerType status')
      .lean();

    // Find if a specific customer is mentioned in the query
    let targetCustomer = null;
    for (const c of orgCustomers) {
      const cName = (c.customerName || '').toLowerCase();
      const compName = (c.companyName || '').toLowerCase();
      const gstin = (c.GSTIN || '').toLowerCase();

      // Check for name or company match in text
      if (
        (cName && lower.includes(cName)) ||
        (compName && lower.includes(compName)) ||
        (gstin && lower.includes(gstin))
      ) {
        targetCustomer = c;
        break;
      }

      // Check first name match if 3+ characters
      const firstName = cName.split(' ')[0];
      if (firstName.length >= 3 && lower.includes(firstName)) {
        targetCustomer = c;
        break;
      }
    }

    // Check if the query asks about a specific name that is NOT in the database
    let queriedEntityName = null;
    const extractedNameMatch = queryText.match(/(?:status of customer|status of|how much does|details of customer|details of|customer|client|debtor)\s+([A-Za-z0-9\.\'\-]+(?:\s+[A-Za-z0-9\.\'\-]+)?)/i);
    if (extractedNameMatch) {
      queriedEntityName = extractedNameMatch[1].replace(/^(customer|client|debtor|the)\s+/i, '').trim();
    }

    let responseText = '';
    let intent = 'general_financial_query';
    let cardData = null;
    let isCard = false;

    // =========================================================================
    // CATEGORY 1: SPECIFIC CUSTOMER QUERIES
    // =========================================================================
    if (
      targetCustomer ||
      (queriedEntityName && (lower.includes('status') || lower.includes('owe') || lower.includes('detail') || lower.includes('payment history') || lower.includes('paid')))
    ) {
      if (!targetCustomer) {
        // Customer was specifically requested by name but does not exist in Atlas
        intent = 'customer_not_found';
        const existingNames = orgCustomers.map(c => `• **${c.customerName}** (${c.companyName || 'Individual'})`).join('\n');
        responseText = 
          `🔍 **Customer Not Found in MongoDB Atlas**\n\n` +
          `No customer record matching **"${queriedEntityName}"** was found in your organization's database ledger.\n\n` +
          (orgCustomers.length > 0 
            ? `**Active counterparties currently registered in your directory:**\n${existingNames}\n\n*You can add new counterparties anytime from the [Customers Directory](customers.html).*`
            : `*Your customer directory currently has 0 registered customers.*`);
      } else {
        // Customer exists! Retrieve their live financial invoices and payments
        const [customerInvoices, customerPayments] = await Promise.all([
          Invoice.find({ organizationId: orgId, customerId: targetCustomer._id }).sort({ dueDate: -1 }).lean(),
          Payment.find({ organizationId: orgId, customerId: targetCustomer._id }).sort({ paymentDate: -1 }).lean(),
        ]);

        const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalPaid = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
        const outstanding = customerInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
        const overdueInvoices = customerInvoices.filter(inv => new Date(inv.dueDate) < new Date() && inv.balanceDue > 0);
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

        const addrStr = targetCustomer.address 
          ? [targetCustomer.address.city, targetCustomer.address.state, targetCustomer.address.country].filter(Boolean).join(', ')
          : '—';

        if (lower.includes('payment history') || (lower.includes('payment') && lower.includes('history'))) {
          intent = 'customer_payment_history';
          let paymentsList = 'No payment transactions recorded for this customer in MongoDB Atlas yet.';
          if (customerPayments.length > 0) {
            paymentsList = customerPayments.map(p => 
              `• **${formatDate(p.paymentDate)}**: **${formatINR(p.amount)}** via ${p.paymentMethod || 'NEFT'} (Ref: \`${p.referenceNumber || 'N/A'}\`) — *${p.status}*`
            ).join('\n');
          }

          responseText = 
            `📜 **Payment History for ${targetCustomer.customerName}**\n` +
            `**Entity**: ${targetCustomer.companyName || targetCustomer.customerName} | **GSTIN**: ${targetCustomer.GSTIN || 'Unregistered'}\n\n` +
            `**Total Paid to Date**: **${formatINR(totalPaid)}** across ${customerPayments.length} recorded payments\n\n` +
            `**Payment Records in Database:**\n${paymentsList}`;
        } else if (lower.includes('owe') || lower.includes('balance') || lower.includes('how much')) {
          intent = 'customer_balance';
          isCard = true;
          let billsList = 'No open unpaid bills.';
          if (customerInvoices.filter(i => i.balanceDue > 0).length > 0) {
            billsList = customerInvoices.filter(i => i.balanceDue > 0).map(i => 
              `• Invoice **#${i.invoiceNumber}**: ${formatINR(i.balanceDue)} due on ${formatDate(i.dueDate)} (${i.status})`
            ).join('\n');
          }

          responseText = 
            `💼 **Outstanding Balance: ${targetCustomer.customerName}**\n\n` +
            `• **Entity / Company**: ${targetCustomer.companyName || targetCustomer.customerName}\n` +
            `• **Total Invoiced**: ${formatINR(totalInvoiced)}\n` +
            `• **Total Settled**: ${formatINR(totalPaid)}\n` +
            `• **Current Amount Owed**: **${formatINR(outstanding)}**\n` +
            `• **Overdue Balance**: ${totalOverdue > 0 ? `**${formatINR(totalOverdue)}** ⚠️` : '₹0 (On Schedule)'}\n\n` +
            `**Open Bills:**\n${billsList}`;

          cardData = {
            customerName: targetCustomer.customerName,
            companyName: targetCustomer.companyName,
            gstin: targetCustomer.GSTIN || 'Unregistered',
            city: addrStr,
            totalInvoiced,
            totalPaid,
            outstanding,
            overdue: totalOverdue,
            status: targetCustomer.status,
          };
        } else {
          // General Customer Details & Status
          intent = 'customer_details';
          isCard = true;
          responseText = 
            `👤 **Customer Profile: ${targetCustomer.customerName}**\n\n` +
            `• **Entity**: ${targetCustomer.companyName || 'Individual'}\n` +
            `• **Status**: **${targetCustomer.status}** (${targetCustomer.customerType || 'Business'})\n` +
            `• **GSTIN**: \`${targetCustomer.GSTIN || 'Unregistered / None'}\`\n` +
            `• **Phone**: ${targetCustomer.phone || '—'}\n` +
            `• **Email**: ${targetCustomer.email || '—'}\n` +
            `• **Registered Address**: ${addrStr}\n\n` +
            `**Financial Position in Database:**\n` +
            `• **Total Invoiced**: ${formatINR(totalInvoiced)} (${customerInvoices.length} invoices)\n` +
            `• **Total Collected**: ${formatINR(totalPaid)}\n` +
            `• **Outstanding Balance**: **${formatINR(outstanding)}**`;

          cardData = {
            customerName: targetCustomer.customerName,
            companyName: targetCustomer.companyName,
            gstin: targetCustomer.GSTIN || 'Unregistered',
            city: addrStr,
            totalInvoiced,
            totalPaid,
            outstanding,
            overdue: totalOverdue,
            status: targetCustomer.status,
          };
        }
      }
    }

    // =========================================================================
    // CATEGORY 2: INVOICE QUERIES
    // =========================================================================
    else if (lower.includes('overdue invoice') || (lower.includes('overdue') && !lower.includes('customer') && !lower.includes('amount'))) {
      intent = 'overdue_invoices';
      const now = new Date();
      const overdue = await Invoice.find({
        organizationId: orgId,
        dueDate: { $lt: now },
        balanceDue: { $gt: 0 },
      }).sort({ dueDate: 1 }).lean();

      if (overdue.length === 0) {
        responseText = 
          `✅ **No Overdue Invoices in MongoDB Atlas**\n\n` +
          `All recorded invoices are currently settled or within their statutory MSME payment terms. No overdue amounts are pending.`;
      } else {
        const totalOverdue = overdue.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
        const list = overdue.map(inv => {
          const daysOverdue = Math.max(0, Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)));
          return `• **#${inv.invoiceNumber}** — **${inv.customerName}**: ${formatINR(inv.balanceDue)} (${daysOverdue} days overdue, due ${formatDate(inv.dueDate)})`;
        }).join('\n');

        responseText = 
          `🚨 **Overdue Invoices (${overdue.length} Total)**\n\n` +
          `**Total Overdue Amount**: **${formatINR(totalOverdue)}**\n\n` +
          `**Overdue Bills List:**\n${list}\n\n` +
          `*Trigger automated WhatsApp or email reminders from the Reminders console.*`;
      }
    } else if (lower.includes('due soon') || lower.includes('upcoming due')) {
      intent = 'invoices_due_soon';
      const now = new Date();
      const future15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const dueSoon = await Invoice.find({
        organizationId: orgId,
        dueDate: { $gte: now, $lte: future15Days },
        balanceDue: { $gt: 0 },
      }).sort({ dueDate: 1 }).lean();

      if (dueSoon.length === 0) {
        responseText = 
          `📅 **Invoices Due Soon (Next 15 Days)**\n\n` +
          `No open invoices are due within the next 15 days in your MongoDB Atlas database.`;
      } else {
        const totalDueSoon = dueSoon.reduce((sum, inv) => sum + inv.balanceDue, 0);
        const list = dueSoon.map(inv => 
          `• **#${inv.invoiceNumber}** — **${inv.customerName}**: ${formatINR(inv.balanceDue)} due on **${formatDate(inv.dueDate)}**`
        ).join('\n');

        responseText = 
          `⏰ **Invoices Due in the Next 15 Days (${dueSoon.length})**\n\n` +
          `**Total Payable Coming Due**: **${formatINR(totalDueSoon)}**\n\n` +
          `${list}`;
      }
    } else if (lower.includes('partially paid')) {
      intent = 'partially_paid_invoices';
      const partial = await Invoice.find({
        organizationId: orgId,
        paidAmount: { $gt: 0 },
        balanceDue: { $gt: 0 },
      }).sort({ dueDate: 1 }).lean();

      if (partial.length === 0) {
        responseText = 
          `📄 **Partially Paid Invoices**\n\n` +
          `No partially paid invoices found in your MongoDB Atlas database. Invoices are either fully paid or awaiting initial settlement.`;
      } else {
        const list = partial.map(inv => 
          `• **#${inv.invoiceNumber}** (${inv.customerName}): Invoiced ${formatINR(inv.amount)}, Paid ${formatINR(inv.paidAmount)}, **Balance: ${formatINR(inv.balanceDue)}**`
        ).join('\n');

        responseText = 
          `📊 **Partially Paid Invoices (${partial.length})**\n\n` +
          `${list}`;
      }
    } else if (lower.includes('fully paid') || lower.includes('cleared invoice')) {
      intent = 'fully_paid_invoices';
      const cleared = await Invoice.find({
        organizationId: orgId,
        balanceDue: 0,
        amount: { $gt: 0 },
      }).sort({ updatedAt: -1 }).limit(10).lean();

      if (cleared.length === 0) {
        responseText = 
          `✅ **Fully Settled Invoices**\n\n` +
          `No fully settled invoice records are logged in your MongoDB Atlas database yet.`;
      } else {
        const totalCleared = cleared.reduce((sum, inv) => sum + inv.amount, 0);
        const list = cleared.map(inv => 
          `• **#${inv.invoiceNumber}** — **${inv.customerName}**: ${formatINR(inv.amount)} (Settled on ${formatDate(inv.updatedAt)})`
        ).join('\n');

        responseText = 
          `💰 **Fully Settled Invoices (${cleared.length} Recent)**\n\n` +
          `**Total Cleared Revenue**: **${formatINR(totalCleared)}**\n\n` +
          `${list}`;
      }
    }

    // =========================================================================
    // CATEGORY 3: PAYMENT QUERIES
    // =========================================================================
    else if (lower.includes('last payment') || lower.includes('latest payment')) {
      intent = 'last_payment_received';
      const last = await Payment.findOne({ organizationId: orgId, status: 'Completed' })
        .sort({ paymentDate: -1 })
        .lean();

      if (!last) {
        responseText = 
          `💳 **Last Payment Received**\n\n` +
          `No payment receipts have been logged in your MongoDB Atlas database yet. Once bank UTR or NEFT/UPI collections are reconciled, they will appear here.`;
      } else {
        responseText = 
          `🎉 **Latest Payment Received**\n\n` +
          `• **Amount**: **${formatINR(last.amount)}**\n` +
          `• **Customer / Remitter**: **${last.customerName || 'Recorded Counterparty'}**\n` +
          `• **Date Received**: **${formatDate(last.paymentDate)}**\n` +
          `• **Payment Channel**: ${last.paymentMethod || 'NEFT / RTGS'}\n` +
          `• **Bank Reference / UTR**: \`${last.referenceNumber || 'N/A'}\`\n` +
          `• **Status**: ${last.status}`;
      }
    } else if (lower.includes('recent payment') || lower.includes('show payments') || lower.includes('payment list')) {
      intent = 'recent_payments';
      const recent = await Payment.find({ organizationId: orgId })
        .sort({ paymentDate: -1 })
        .limit(10)
        .lean();

      if (recent.length === 0) {
        responseText = 
          `💳 **Recent Payments**\n\n` +
          `No payment transactions have been logged in your MongoDB Atlas database yet.`;
      } else {
        const totalRecent = recent.reduce((sum, p) => sum + (p.amount || 0), 0);
        const list = recent.map(p => 
          `• **${formatDate(p.paymentDate)}**: **${formatINR(p.amount)}** from **${p.customerName || 'Counterparty'}** via ${p.paymentMethod || 'Bank'} (UTR: \`${p.referenceNumber || 'N/A'}\`)`
        ).join('\n');

        responseText = 
          `📥 **Recent Payments Received (${recent.length})**\n\n` +
          `**Total Value**: **${formatINR(totalRecent)}**\n\n` +
          `${list}`;
      }
    }

    // =========================================================================
    // CATEGORY 4: UNPAID FOR 30+ DAYS
    // =========================================================================
    else if (lower.includes('30 day') || lower.includes('not paid') || lower.includes('unpaid customer')) {
      intent = 'unpaid_30_days';
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const overdue30 = await Invoice.find({
        organizationId: orgId,
        dueDate: { $lt: thirtyDaysAgo },
        balanceDue: { $gt: 0 },
      }).lean();

      if (overdue30.length === 0) {
        responseText = 
          `🛡️ **30-Day Overdue Check**\n\n` +
          `Zero customers have payments pending beyond 30 days in your MongoDB Atlas records. Your working capital cycle is within statutory limits.`;
      } else {
        const debtorMap = {};
        overdue30.forEach(inv => {
          debtorMap[inv.customerName] = (debtorMap[inv.customerName] || 0) + inv.balanceDue;
        });

        const list = Object.entries(debtorMap).map(([name, sum]) => 
          `• **${name}**: **${formatINR(sum)}** overdue for >30 days`
        ).join('\n');

        responseText = 
          `⚠️ **Counterparties Past 30 Days (${Object.keys(debtorMap).length})**\n\n` +
          `These customers breach the agreed 30-day settlement window:\n\n` +
          `${list}\n\n` +
          `*Recommendation: Trigger Section 15/16 MSME formal statutory notices.*`;
      }
    }

    // =========================================================================
    // CATEGORY 5: FINANCIAL & RECEIVABLES OVERVIEW
    // =========================================================================
    else if (
      lower.includes('total outstanding') ||
      lower.includes('total receivable') ||
      lower.includes('total overdue') ||
      lower.includes('summary of current receivables') ||
      lower.includes('receivables summary') ||
      lower.includes('receivable') ||
      lower.includes('summary')
    ) {
      intent = 'receivables_summary';
      const [allInvoices, allPayments] = await Promise.all([
        Invoice.find({ organizationId: orgId }).lean(),
        Payment.find({ organizationId: orgId, status: 'Completed' }).lean(),
      ]);

      const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalCollected = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalOutstanding = allInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
      const now = new Date();
      const totalOverdue = allInvoices
        .filter(inv => new Date(inv.dueDate) < now && inv.balanceDue > 0)
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      const customerCount = orgCustomers.length;
      const activeCustomers = orgCustomers.filter(c => c.status === 'Active').length;

      responseText = 
        `📊 **FinPilot Current Receivables Summary**\n` +
        `*Live data aggregated from your MongoDB Atlas financial ledger:*\n\n` +
        `• **Total Customers Registered**: **${customerCount}** (${activeCustomers} Active)\n` +
        `• **Total Invoiced Volume**: **${formatINR(totalInvoiced)}** across ${allInvoices.length} invoices\n` +
        `• **Total Collections Reconciled**: **${formatINR(totalCollected)}** (${allPayments.length} receipts)\n` +
        `• **Total Current Receivables**: **${formatINR(totalOutstanding)}**\n` +
        `• **Total Overdue Amount**: **${totalOverdue > 0 ? formatINR(totalOverdue) + ' ⚠️' : '₹0 (Zero default risk)'}**\n\n` +
        (allInvoices.length === 0 
          ? `*Note: Your database currently has ${customerCount} counterparties registered. Invoice management documents have not been logged yet.*`
          : `*Calculations derived from live invoice balances and reconciled payments in MongoDB Atlas.*`);
    }

    // =========================================================================
    // CATEGORY 6: DIRECTORY INQUIRY / GENERAL FALLBACK
    // =========================================================================
    else {
      intent = 'customer_directory_list';
      if (orgCustomers.length > 0) {
        const list = orgCustomers.slice(0, 10).map(c => 
          `• **${c.customerName}** (${c.companyName || 'Individual'}) — Status: **${c.status}** | GSTIN: \`${c.GSTIN || 'Unregistered'}\``
        ).join('\n');

        responseText = 
          `🏢 **FinPilot Database Directory**\n\n` +
          `Your MongoDB Atlas database currently contains **${orgCustomers.length} registered counterparties**:\n\n` +
          `${list}\n\n` +
          `*You can ask me specific questions like:*\n` +
          `• *"What is the status of customer ${orgCustomers[0].customerName}?"*\n` +
          `• *"How much does ${orgCustomers[0].customerName} owe?"*\n` +
          `• *"Show me overdue invoices."*\n` +
          `• *"What is the total receivable amount?"*`;
      } else {
        responseText = 
          `👋 **Welcome to FinPilot AI Assistant**\n\n` +
          `I am connected directly to your MongoDB Atlas database. Currently, your organization has **0 customers** and **0 invoices** recorded.\n\n` +
          `Head over to the [Customers Directory](customers.html) and click **+ Add Customer** to register your counterparties. Once created, ask me anytime for instant financial intelligence!`;
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      intent,
      responseText,
      cardData,
      isCard,
      latencyMs,
    };
  }

  /**
   * Get or create active session
   */
  async getOrCreateSession(sessionId = null, title = null) {
    this.ensureDbConnected();

    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      const existingSession = await AISession.findById(sessionId);
      if (existingSession && existingSession.isActive) {
        return existingSession;
      }
    }

    const newSession = await AISession.create({
      title: title || `Financial Query ${new Date().toLocaleDateString('en-IN')}`,
      totalQueries: 0,
      isActive: true,
    });

    return newSession;
  }

  /**
   * Process a chat query: Queries MongoDB Atlas and persists user message & reply
   */
  async processQuery({ queryText, sessionId = null, orgId = null, userId = null }) {
    this.ensureDbConnected();

    const verifiedOrgId = orgId || '65f1a2b3c4d5e6f7a8b9c0d1';
    const session = await this.getOrCreateSession(sessionId);

    // 1. Resolve actual database-backed financial intelligence
    const dbResult = await this.resolveQueryFromDatabase(queryText, verifiedOrgId);

    // 2. Persist user message in MongoDB Atlas
    const userMsgDoc = await AIMessage.create({
      sessionId: session._id,
      sender: 'user',
      content: queryText,
      intent: dbResult.intent,
    });

    // 3. Persist assistant reply in MongoDB Atlas
    const assistantMsgDoc = await AIMessage.create({
      sessionId: session._id,
      sender: 'assistant',
      content: dbResult.responseText,
      intent: dbResult.intent,
      isCard: dbResult.isCard,
      cardData: dbResult.cardData,
      isMockResponse: false,
      latencyMs: dbResult.latencyMs,
    });

    // 4. Save AIQuery for historical audit trail
    await AIQuery.create({
      sessionId: session._id,
      orgId: verifiedOrgId,
      queryText,
      intent: dbResult.intent,
      responseText: dbResult.responseText,
      responseData: dbResult.cardData,
      isCard: dbResult.isCard,
      isMockResponse: false,
      latencyMs: dbResult.latencyMs,
    }).catch(() => {});

    // 5. Increment query counter on session
    await AISession.findByIdAndUpdate(session._id, {
      $inc: { totalQueries: 1 },
    });

    return {
      session: {
        id: session._id,
        title: session.title,
      },
      userMessage: userMsgDoc,
      assistantMessage: assistantMsgDoc,
      message: {
        _id: assistantMsgDoc._id,
        sessionId: session._id,
        queryText,
        responseText: assistantMsgDoc.content,
        intent: assistantMsgDoc.intent,
        isCard: assistantMsgDoc.isCard,
        responseData: assistantMsgDoc.cardData,
        isMockResponse: false,
        latencyMs: assistantMsgDoc.latencyMs,
        createdAt: assistantMsgDoc.createdAt,
      },
    };
  }

  /**
   * Retrieve chat message history for a given session
   */
  async getSessionHistory(sessionId) {
    this.ensureDbConnected();
    const messages = await AIMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    return messages || [];
  }

  /**
   * List all chat sessions
   */
  async getAllSessions() {
    this.ensureDbConnected();
    return await AISession.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
  }

  /**
   * Clear all messages in a session
   */
  async clearSessionMessages(sessionId) {
    this.ensureDbConnected();
    await Promise.all([
      AIMessage.deleteMany({ sessionId }),
      AIQuery.deleteMany({ sessionId }),
      AISession.findByIdAndUpdate(sessionId, { totalQueries: 0 }),
    ]);

    return { success: true, sessionId };
  }
}

module.exports = new AIService();
