/**
 * FinPilot AI - GST Invoice Management Controller
 * Multi-Tenant Frontend Integration with MongoDB Atlas
 */
const API_BASE_URL = 'http://localhost:5000/api';
const DEFAULT_ORG_ID = localStorage.getItem('finpilot_org_id') || '65f1a2b3c4d5e6f7a8b9c0d1';

let allInvoices = [];
let allCustomers = [];
let currentFilter = 'all';
let currentSearch = '';
let currentCounterparty = 'all';
let isSubmitting = false;

// DOM Elements
const createModal = document.getElementById('createInvoiceModal');
const auditDrawer = document.getElementById('invoiceAuditDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const createInvoiceForm = document.getElementById('createInvoiceForm');
const modalAlert = document.getElementById('modalAlert');
const editInvoiceId = document.getElementById('editInvoiceId');

const modalInvoiceNumber = document.getElementById('modalInvoiceNumber');
const modalInvoiceDate = document.getElementById('modalInvoiceDate');
const modalDueDate = document.getElementById('modalDueDate');
const modalCustomerSelect = document.getElementById('modalCustomerSelect');
const modalGstinField = document.getElementById('modalGstinField');
const modalAddressField = document.getElementById('modalAddressField');
const modalPaymentTerms = document.getElementById('modalPaymentTerms');
const modalNotes = document.getElementById('modalNotes');
const modalItemsContainer = document.getElementById('modalItemsContainer');
const addItemRowBtn = document.getElementById('addItemRowBtn');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const submitInvoiceBtn = document.getElementById('submitInvoiceBtn');
const submitInvoiceBtnText = document.getElementById('submitInvoiceBtnText');

const modalSubtotal = document.getElementById('modalSubtotal');
const modalGstAmount = document.getElementById('modalGstAmount');
const modalGrandTotal = document.getElementById('modalGrandTotal');

const topCreateBtn = document.getElementById('topCreateBtn');
const primaryCreateBtn = document.getElementById('primaryCreateBtn');
const toggleCreateModal = document.getElementById('toggleCreateModal');
const toggleDrawerBtn = document.getElementById('toggleDrawerBtn');
const toggleRegisterView = document.getElementById('toggleRegisterView');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');

const invoiceSearchInput = document.getElementById('invoiceSearchInput');
const headerSearchInput = document.getElementById('headerSearchInput');
const counterpartyFilter = document.getElementById('counterpartyFilter');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const selectAllInvoices = document.getElementById('selectAllInvoices');
const invoiceTableBody = document.getElementById('invoiceTableBody');

// --- Currency & Date Formatting Helpers ---
function formatINR(val) {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');

  if (!toast || !msg || !icon) return;

  msg.textContent = message;
  if (type === 'success') {
    toast.className = 'fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 transform transition-all duration-300';
    icon.innerHTML = '<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
  } else {
    toast.className = 'fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold bg-rose-50 text-rose-800 border-rose-200 transform transition-all duration-300';
    icon.innerHTML = '<svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
  }

  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  toast.style.pointerEvents = 'auto';

  setTimeout(() => {
    toast.style.transform = 'translateY(-100px)';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
  }, 4000);
}

function showModalAlert(msg, type = 'error') {
  if (!modalAlert) return;
  modalAlert.classList.remove('hidden');
  if (type === 'error') {
    modalAlert.className = 'p-3 rounded-xl border text-xs bg-rose-50 text-rose-700 border-rose-200';
  } else {
    modalAlert.className = 'p-3 rounded-xl border text-xs bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  modalAlert.textContent = msg;
}

function hideModalAlert() {
  if (!modalAlert) return;
  modalAlert.classList.add('hidden');
  modalAlert.textContent = '';
}

// --- Modal Toggles ---
async function openModal(isEdit = false) {
  hideModalAlert();
  if (createModal) createModal.classList.remove('hidden');

  if (!isEdit) {
    if (editInvoiceId) editInvoiceId.value = '';
    if (createInvoiceForm) createInvoiceForm.reset();
    const title = document.getElementById('modalTitle');
    const subtitle = document.getElementById('modalSubtitle');
    if (title) title.textContent = 'Create GST Tax Invoice';
    if (subtitle) subtitle.textContent = 'Generates verified tax invoice record in MongoDB Atlas';
    if (submitInvoiceBtnText) submitInvoiceBtnText.textContent = 'Create & Save Invoice';

    // Set default dates
    const today = new Date();
    if (modalInvoiceDate) modalInvoiceDate.value = today.toISOString().split('T')[0];
    const due = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (modalDueDate) modalDueDate.value = due.toISOString().split('T')[0];

    // Fetch next sequential invoice number
    await fetchNextInvoiceNumber();

    // Initialize single default item row
    if (modalItemsContainer) {
      modalItemsContainer.innerHTML = '';
      addItemRow();
    }
  }
}

function closeModal() {
  if (createModal) createModal.classList.add('hidden');
  hideModalAlert();
  if (editInvoiceId) editInvoiceId.value = '';
}

function openDrawer() {
  if (auditDrawer) auditDrawer.classList.remove('hidden');
}

function closeDrawer() {
  if (auditDrawer) auditDrawer.classList.add('hidden');
}

if (topCreateBtn) topCreateBtn.addEventListener('click', () => openModal(false));
if (primaryCreateBtn) primaryCreateBtn.addEventListener('click', () => openModal(false));
if (toggleCreateModal) toggleCreateModal.addEventListener('click', () => openModal(false));
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

if (toggleRegisterView) {
  toggleRegisterView.addEventListener('click', () => {
    closeModal();
    closeDrawer();
  });
}

// --- Dynamic Line Item Rows in Modal ---
function addItemRow(desc = '', qty = 1, unitPrice = 0, gstRate = 18) {
  if (!modalItemsContainer) return;
  const row = document.createElement('div');
  row.className = 'grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 item-row';
  row.innerHTML = `
    <div class="col-span-5">
      <input type="text" value="${desc}" required class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs item-desc focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Item / Service description">
    </div>
    <div class="col-span-2">
      <input type="number" value="${qty}" min="0.01" step="any" required class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs item-qty focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Qty">
    </div>
    <div class="col-span-2">
      <input type="number" value="${unitPrice}" min="0" step="any" required class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono item-rate focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Unit Price">
    </div>
    <div class="col-span-2">
      <select class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs item-gst focus:outline-none focus:ring-1 focus:ring-brand-500">
        <option value="18" ${gstRate == 18 ? 'selected' : ''}>GST 18%</option>
        <option value="12" ${gstRate == 12 ? 'selected' : ''}>GST 12%</option>
        <option value="5" ${gstRate == 5 ? 'selected' : ''}>GST 5%</option>
        <option value="28" ${gstRate == 28 ? 'selected' : ''}>GST 28%</option>
        <option value="0" ${gstRate == 0 ? 'selected' : ''}>GST 0%</option>
      </select>
    </div>
    <div class="col-span-1 text-center">
      <button type="button" class="text-slate-400 hover:text-rose-600 delete-row-btn transition-colors" title="Delete row">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  `;

  // Input listeners for real-time recalculation
  row.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', calculateModalTotals);
  });

  row.querySelector('.delete-row-btn').addEventListener('click', () => {
    const totalRows = modalItemsContainer.querySelectorAll('.item-row').length;
    if (totalRows <= 1) {
      showModalAlert('Invoice must contain at least one line item.', 'error');
      return;
    }
    row.remove();
    calculateModalTotals();
  });

  modalItemsContainer.appendChild(row);
  calculateModalTotals();
}

if (addItemRowBtn) {
  addItemRowBtn.addEventListener('click', () => addItemRow());
}

function calculateModalTotals() {
  if (!modalItemsContainer) return { subtotal: 0, totalGst: 0, grandTotal: 0 };
  let subtotal = 0;
  let totalGst = 0;

  const rows = modalItemsContainer.querySelectorAll('.item-row');
  rows.forEach(r => {
    const qty = parseFloat(r.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(r.querySelector('.item-rate').value) || 0;
    const gst = parseFloat(r.querySelector('.item-gst').value) || 0;

    const rowSubtotal = Math.round((qty * rate + Number.EPSILON) * 100) / 100;
    const rowGst = Math.round((rowSubtotal * (gst / 100) + Number.EPSILON) * 100) / 100;

    subtotal += rowSubtotal;
    totalGst += rowGst;
  });

  subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;
  totalGst = Math.round((totalGst + Number.EPSILON) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalGst + Number.EPSILON) * 100) / 100;

  if (modalSubtotal) modalSubtotal.textContent = formatINR(subtotal);
  if (modalGstAmount) modalGstAmount.textContent = formatINR(totalGst);
  if (modalGrandTotal) modalGrandTotal.textContent = formatINR(grandTotal);

  return { subtotal, totalGst, grandTotal };
}

// --- Customer Selection & Auto-fill ---
if (modalCustomerSelect) {
  modalCustomerSelect.addEventListener('change', (e) => {
    const selected = e.target.selectedOptions[0];
    if (selected && selected.value) {
      if (modalGstinField) modalGstinField.value = selected.dataset.gst || 'UNREGISTERED';
      if (modalAddressField) modalAddressField.value = selected.dataset.addr || 'No registered address';
    } else {
      if (modalGstinField) modalGstinField.value = '';
      if (modalAddressField) modalAddressField.value = '';
    }
  });
}

// --- Fetch Next Sequential Invoice Number ---
async function fetchNextInvoiceNumber() {
  try {
    const res = await fetch(`${API_BASE_URL}/invoices/next-number`, {
      headers: { 'x-organization-id': DEFAULT_ORG_ID }
    });
    const data = await res.json();
    if (data.success && data.data && data.data.invoiceNumber) {
      if (modalInvoiceNumber) modalInvoiceNumber.value = data.data.invoiceNumber;
    }
  } catch (err) {
    console.warn('Could not auto-generate invoice number:', err);
  }
}

// --- Load Customers ---
async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE_URL}/customers?limit=100`, {
      headers: { 'x-organization-id': DEFAULT_ORG_ID }
    });
    const data = await res.json();
    if (data.success && data.data && data.data.customers) {
      allCustomers = data.data.customers;

      if (modalCustomerSelect) {
        modalCustomerSelect.innerHTML = '<option value="">-- Choose Customer from Directory --</option>';
      }
      if (counterpartyFilter) {
        counterpartyFilter.innerHTML = '<option value="all">All Counterparties</option>';
      }

      allCustomers.forEach(c => {
        const addr = c.address || {};
        const addrStr = [addr.city, addr.state, addr.country, addr.pincode].filter(Boolean).join(', ');
        
        if (modalCustomerSelect) {
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = `${c.customerName || c.companyName} (${c.GSTIN || 'Unregistered'})`;
          opt.dataset.gst = c.GSTIN || 'UNREGISTERED';
          opt.dataset.addr = addrStr;
          modalCustomerSelect.appendChild(opt);
        }

        if (counterpartyFilter) {
          const filterOpt = document.createElement('option');
          filterOpt.value = c.customerName || c.companyName;
          filterOpt.textContent = c.customerName || c.companyName;
          counterpartyFilter.appendChild(filterOpt);
        }
      });
    }
  } catch (err) {
    console.error('Failed to load customers from API:', err);
  }
}

// --- Load Summary Metrics ---
async function loadSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/invoices/summary`, {
      headers: { 'x-organization-id': DEFAULT_ORG_ID }
    });
    const data = await res.json();
    if (data.success && data.data) {
      const s = data.data;

      const elInvoices = document.getElementById('statTotalInvoices');
      const elInvoiced = document.getElementById('statTotalInvoiced');
      const elPaid = document.getElementById('statTotalPaid');
      const elPaidPct = document.getElementById('statPaidPct');
      const elOut = document.getElementById('statOutstandingBalance');
      const elOverdue = document.getElementById('statOverdueDetail');

      if (elInvoices) elInvoices.textContent = s.totalInvoices || 0;
      if (elInvoiced) elInvoiced.textContent = formatINR(s.totalInvoiced);
      if (elPaid) elPaid.textContent = formatINR(s.totalPaid);
      if (elPaidPct) elPaidPct.textContent = `${s.paidPercentage || 0}%`;
      if (elOut) elOut.textContent = formatINR(s.totalOutstanding);
      if (elOverdue) elOverdue.textContent = `${formatINR(s.overdueAmount)} Overdue (${s.overdueCount} bills)`;

      const c = s.counts || {};
      const elTabAll = document.getElementById('tabCountAll');
      const elTabPaid = document.getElementById('tabCountPaid');
      const elTabPending = document.getElementById('tabCountPending');
      const elTabPart = document.getElementById('tabCountPartiallyPaid');
      const elTabOverdue = document.getElementById('tabCountOverdue');

      if (elTabAll) elTabAll.textContent = c.all || 0;
      if (elTabPaid) elTabPaid.textContent = c.paid || 0;
      if (elTabPending) elTabPending.textContent = c.pending || 0;
      if (elTabPart) elTabPart.textContent = c.partiallyPaid || 0;
      if (elTabOverdue) elTabOverdue.textContent = c.overdue || 0;

      const navBadge = document.getElementById('navInvoiceCount');
      if (navBadge) navBadge.textContent = s.totalInvoices || 0;
    }
  } catch (err) {
    console.error('Failed to load invoice summary:', err);
  }
}

// --- Load Invoices Table ---
async function loadInvoices() {
  if (!invoiceTableBody) return;
  invoiceTableBody.innerHTML = `
    <tr>
      <td colspan="10" class="py-12 text-center text-slate-400">
        <div class="flex flex-col items-center justify-center gap-2">
          <svg class="w-6 h-6 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <span>Loading invoice records from MongoDB Atlas...</span>
        </div>
      </td>
    </tr>
  `;

  try {
    let url = `${API_BASE_URL}/invoices?limit=100`;
    if (currentFilter !== 'all') url += `&status=${encodeURIComponent(currentFilter)}`;
    if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;

    const res = await fetch(url, {
      headers: { 'x-organization-id': DEFAULT_ORG_ID }
    });
    const data = await res.json();

    if (data.success && data.data && data.data.invoices) {
      allInvoices = data.data.invoices;
      renderInvoicesTable(allInvoices);
    } else {
      invoiceTableBody.innerHTML = `<tr><td colspan="10" class="py-8 text-center text-rose-500">Failed to load invoices.</td></tr>`;
    }
  } catch (err) {
    console.error('Failed to fetch invoices:', err);
    invoiceTableBody.innerHTML = `<tr><td colspan="10" class="py-8 text-center text-rose-500">Network error connecting to backend server.</td></tr>`;
  }
}

function renderInvoicesTable(invoices) {
  if (!invoiceTableBody) return;
  const countEl = document.getElementById('tableRecordCount');
  if (countEl) countEl.textContent = `(Showing ${invoices.length} Records)`;

  if (invoices.length === 0) {
    invoiceTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="py-16 text-center">
          <div class="max-w-sm mx-auto flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center mb-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h4 class="font-bold text-slate-800 text-sm">No Invoices Found</h4>
            <p class="text-slate-500 text-xs mt-1 mb-4">No invoice documents match your selected filters in MongoDB Atlas.</p>
            <button onclick="openModal(false)" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              Create Your First Invoice
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const now = new Date();
  invoiceTableBody.innerHTML = invoices.map(inv => {
    const grand = inv.grandTotal || inv.amount || 0;
    const paid = inv.paidAmount || 0;
    const balance = inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.balanceDue || 0);
    const paidPct = grand > 0 ? Math.min(100, Math.round((paid / grand) * 100)) : 0;

    let statusClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (inv.status === 'Paid') statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (inv.status === 'Partially Paid') statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (inv.status === 'Overdue') statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (inv.status === 'Draft') statusClass = 'bg-zinc-100 text-zinc-600 border-zinc-200';

    const isOverdue = new Date(inv.dueDate) < now && balance > 0;
    const overdueDays = isOverdue ? Math.max(1, Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))) : 0;

    return `
      <tr class="hover:bg-slate-50/70 transition-colors invoice-row" data-id="${inv._id}">
        <td class="py-4 px-4 text-center">
          <input type="checkbox" class="row-checkbox rounded text-brand-600 focus:ring-brand-500 border-slate-300">
        </td>
        <td class="py-4 px-4">
          <div class="flex items-center gap-1.5 font-bold text-brand-600 hover:underline cursor-pointer open-drawer-btn" data-id="${inv._id}">
            #${inv.invoiceNumber}
            <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </div>
          <span class="block font-mono text-[10px] text-slate-400 mt-0.5">IRN Verified</span>
        </td>
        <td class="py-4 px-4">
          <div class="font-bold text-slate-900">${inv.customerName || 'Direct Buyer'}</div>
          <span class="font-mono text-[10px] text-slate-500">GSTIN: ${inv.customerGstin || 'UNREGISTERED'}</span>
        </td>
        <td class="py-4 px-4 text-slate-600">${formatDate(inv.invoiceDate || inv.issueDate)}</td>
        <td class="py-4 px-4">
          <span class="font-medium text-slate-900">${formatDate(inv.dueDate)}</span>
          ${isOverdue ? `<span class="block text-[10px] font-bold text-rose-600">● Overdue ${overdueDays}d</span>` : ''}
        </td>
        <td class="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
          ${formatINR(grand)}
        </td>
        <td class="py-4 px-4">
          <div class="w-28">
            <div class="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
              <span>${formatINR(paid)}</span>
              <span class="text-brand-600 font-bold">${paidPct}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div class="bg-brand-600 h-1.5 rounded-full" style="width: ${paidPct}%"></div>
            </div>
          </div>
        </td>
        <td class="py-4 px-4 text-right font-extrabold ${balance > 0 ? 'text-rose-600' : 'text-slate-900'} text-sm">
          ${formatINR(balance)}
        </td>
        <td class="py-4 px-4 text-center">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}">
            ${inv.status}
          </span>
        </td>
        <td class="py-4 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-blue-50 rounded-lg transition-colors open-drawer-btn" data-id="${inv._id}" title="View Details">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors edit-inv-btn" data-id="${inv._id}" title="Edit Invoice">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors print-inv-btn" data-id="${inv._id}" title="Download / Print PDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors delete-inv-btn" data-id="${inv._id}" title="Delete Invoice">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Wire Row Actions
  invoiceTableBody.querySelectorAll('.open-drawer-btn').forEach(btn => {
    btn.addEventListener('click', () => viewInvoiceInDrawer(btn.dataset.id));
  });

  invoiceTableBody.querySelectorAll('.edit-inv-btn').forEach(btn => {
    btn.addEventListener('click', () => populateEditModal(btn.dataset.id));
  });

  invoiceTableBody.querySelectorAll('.print-inv-btn').forEach(btn => {
    btn.addEventListener('click', () => printInvoice(btn.dataset.id));
  });

  invoiceTableBody.querySelectorAll('.delete-inv-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteInvoiceRecord(btn.dataset.id));
  });
}

// --- View Single Invoice in Audit Drawer ---
function viewInvoiceInDrawer(invoiceId) {
  openDrawer();
  const inv = allInvoices.find(i => i._id === invoiceId);
  if (!inv) return;

  const drawerInvNum = document.getElementById('drawerInvoiceNumber');
  const drawerIssue = document.getElementById('drawerIssueDate');
  const drawerDue = document.getElementById('drawerDueDate');
  const statusBadge = document.getElementById('drawerStatusBadge');

  if (drawerInvNum) drawerInvNum.textContent = '#' + inv.invoiceNumber;
  if (drawerIssue) drawerIssue.textContent = 'Issued: ' + formatDate(inv.invoiceDate || inv.issueDate);
  if (drawerDue) drawerDue.textContent = formatDate(inv.dueDate);

  if (statusBadge) {
    statusBadge.textContent = inv.status;
    if (inv.status === 'Paid') statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
    else if (inv.status === 'Overdue') statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200';
    else if (inv.status === 'Partially Paid') statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200';
    else statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200';
  }

  const custName = document.getElementById('drawerCustomerName');
  const custAddr = document.getElementById('drawerCustomerAddress');
  const custGst = document.getElementById('drawerCustomerGstin');

  if (custName) custName.textContent = inv.customerName || 'Direct Counterparty';
  if (custAddr) custAddr.textContent = inv.customerAddress || 'No address logged';
  if (custGst) custGst.textContent = 'GSTIN: ' + (inv.customerGstin || 'UNREGISTERED');

  const grand = inv.grandTotal || inv.amount || 0;
  const paid = inv.paidAmount || 0;
  const balance = inv.outstandingAmount !== undefined ? inv.outstandingAmount : (inv.balanceDue || 0);

  const elBilled = document.getElementById('drawerTotalBilled');
  const elRec = document.getElementById('drawerTotalReceived');
  const elDue = document.getElementById('drawerBalanceDue');
  const elNotes = document.getElementById('drawerNotes');

  if (elBilled) elBilled.textContent = formatINR(grand);
  if (elRec) elRec.textContent = formatINR(paid);
  if (elDue) elDue.textContent = formatINR(balance);
  if (elNotes) elNotes.textContent = inv.notes || ('Payment terms: ' + (inv.paymentTerms || 'Net 30 Days'));

  // Populate Items Table in Drawer
  const itemsBody = document.getElementById('drawerItemsBody');
  const items = inv.items || [];
  if (itemsBody) {
    if (items.length > 0) {
      itemsBody.innerHTML = items.map(item => `
        <tr>
          <td class="py-2.5 px-3 font-medium text-slate-800">${item.description}</td>
          <td class="py-2.5 px-3 text-center">${item.quantity}</td>
          <td class="py-2.5 px-3 text-right">${formatINR(item.unitPrice)}</td>
          <td class="py-2.5 px-3 text-right font-mono">${formatINR(item.subtotal)}</td>
          <td class="py-2.5 px-3 text-right font-mono">${formatINR(item.gstAmount)} (${item.gstRate}%)</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${formatINR(item.grandTotal)}</td>
        </tr>
      `).join('');
    } else {
      itemsBody.innerHTML = '<tr><td colspan="6" class="py-3 text-center text-slate-400">No line items</td></tr>';
    }
  }
}

// --- Edit Invoice Modal ---
function populateEditModal(invoiceId) {
  const inv = allInvoices.find(i => i._id === invoiceId);
  if (!inv) return;

  openModal(true);
  if (editInvoiceId) editInvoiceId.value = inv._id;
  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSubtitle');
  if (title) title.textContent = 'Edit Invoice #' + inv.invoiceNumber;
  if (sub) sub.textContent = 'Updates verified invoice document in MongoDB Atlas';
  if (submitInvoiceBtnText) submitInvoiceBtnText.textContent = 'Save Changes';

  if (modalInvoiceNumber) modalInvoiceNumber.value = inv.invoiceNumber;
  if (modalInvoiceDate && (inv.invoiceDate || inv.issueDate)) {
    modalInvoiceDate.value = new Date(inv.invoiceDate || inv.issueDate).toISOString().split('T')[0];
  }
  if (modalDueDate && inv.dueDate) {
    modalDueDate.value = new Date(inv.dueDate).toISOString().split('T')[0];
  }

  if (modalCustomerSelect) {
    modalCustomerSelect.value = inv.customerId ? (inv.customerId._id || inv.customerId) : '';
  }
  if (modalGstinField) modalGstinField.value = inv.customerGstin || '';
  if (modalAddressField) modalAddressField.value = inv.customerAddress || '';
  if (modalPaymentTerms) modalPaymentTerms.value = inv.paymentTerms || 'Net 30 Days (Standard Corporate)';
  if (modalNotes) modalNotes.value = inv.notes || '';

  if (modalItemsContainer) {
    modalItemsContainer.innerHTML = '';
    if (inv.items && inv.items.length > 0) {
      inv.items.forEach(it => {
        addItemRow(it.description, it.quantity, it.unitPrice, it.gstRate);
      });
    } else {
      addItemRow();
    }
  }

  calculateModalTotals();
}

// --- Save or Submit Invoice Form Handler ---
if (createInvoiceForm) {
  createInvoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveInvoice(false);
  });
}

if (saveDraftBtn) {
  saveDraftBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleSaveInvoice(true);
  });
}

async function handleSaveInvoice(isDraft = false) {
  if (isSubmitting) return;

  const customerId = modalCustomerSelect ? modalCustomerSelect.value : '';
  if (!customerId) {
    showModalAlert('Please select a customer from the directory.', 'error');
    if (modalCustomerSelect) modalCustomerSelect.focus();
    return;
  }

  const invNumber = modalInvoiceNumber ? modalInvoiceNumber.value.trim() : '';
  const invDate = modalInvoiceDate ? modalInvoiceDate.value : '';
  const dueDate = modalDueDate ? modalDueDate.value : '';
  if (!invDate || !dueDate) {
    showModalAlert('Please provide valid invoice and due dates.', 'error');
    return;
  }

  const rows = modalItemsContainer ? modalItemsContainer.querySelectorAll('.item-row') : [];
  const items = [];
  let itemValidationError = false;

  rows.forEach(r => {
    const desc = r.querySelector('.item-desc').value.trim();
    const qty = parseFloat(r.querySelector('.item-qty').value);
    const unitPrice = parseFloat(r.querySelector('.item-rate').value);
    const gstRate = parseFloat(r.querySelector('.item-gst').value);

    if (!desc || isNaN(qty) || qty <= 0 || isNaN(unitPrice) || unitPrice < 0) {
      itemValidationError = true;
    } else {
      items.push({
        description: desc,
        quantity: qty,
        unitPrice,
        gstRate,
      });
    }
  });

  if (itemValidationError || items.length === 0) {
    showModalAlert('Please fill in complete descriptions, valid quantities, and unit prices for all rows.', 'error');
    return;
  }

  const payload = {
    customerId,
    invoiceNumber: invNumber,
    invoiceDate: invDate,
    dueDate,
    items,
    paymentTerms: modalPaymentTerms ? modalPaymentTerms.value : 'Net 30 Days (Standard Corporate)',
    notes: modalNotes ? modalNotes.value.trim() : '',
    status: isDraft ? 'Draft' : 'Pending',
  };

  try {
    isSubmitting = true;
    if (submitInvoiceBtn) {
      submitInvoiceBtn.disabled = true;
      submitInvoiceBtn.classList.add('opacity-75', 'cursor-not-allowed');
    }
    if (submitInvoiceBtnText) submitInvoiceBtnText.textContent = 'Saving to MongoDB Atlas...';

    const isEditing = Boolean(editInvoiceId && editInvoiceId.value);
    const url = isEditing ? `${API_BASE_URL}/invoices/${editInvoiceId.value}` : `${API_BASE_URL}/invoices`;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': DEFAULT_ORG_ID,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      const msg = isEditing
        ? `Invoice #${data.data.invoiceNumber} successfully updated in MongoDB Atlas!`
        : `Invoice #${data.data.invoiceNumber} successfully created in MongoDB Atlas!`;
      showToast(msg, 'success');
      closeModal();
      await Promise.all([loadSummary(), loadInvoices()]);
    } else {
      showModalAlert(data.message || 'Failed to save invoice record.', 'error');
    }
  } catch (err) {
    console.error('Error saving invoice:', err);
    showModalAlert('Network error connecting to backend API.', 'error');
  } finally {
    isSubmitting = false;
    if (submitInvoiceBtn) {
      submitInvoiceBtn.disabled = false;
      submitInvoiceBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
    if (submitInvoiceBtnText) {
      submitInvoiceBtnText.textContent = (editInvoiceId && editInvoiceId.value) ? 'Save Changes' : 'Create & Save Invoice';
    }
  }
}

// --- Delete Invoice Record ---
async function deleteInvoiceRecord(invoiceId) {
  const inv = allInvoices.find(i => i._id === invoiceId);
  const invNum = inv ? inv.invoiceNumber : invoiceId;

  if (!confirm(`Are you sure you want to delete Invoice #${invNum}? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: { 'x-organization-id': DEFAULT_ORG_ID }
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`Invoice #${invNum} deleted from MongoDB Atlas.`, 'success');
      await Promise.all([loadSummary(), loadInvoices()]);
    } else {
      alert(data.message || 'Failed to delete invoice.');
    }
  } catch (err) {
    console.error('Delete invoice error:', err);
    alert('Network error connecting to backend.');
  }
}

// --- Print / Download Invoice PDF Simulation ---
function printInvoice(invoiceId) {
  const inv = allInvoices.find(i => i._id === invoiceId);
  if (!inv) return;

  const itemsHtml = (inv.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${it.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatINR(it.unitPrice)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatINR(it.subtotal)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${it.gstRate}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatINR(it.grandTotal)}</td>
    </tr>
  `).join('');

  const printContent = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <title>Tax Invoice #' + inv.invoiceNumber + ' — FinPilot AI</title>',
    '  <style>',
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }',
    '    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }',
    '    .title { font-size: 24px; font-weight: 800; color: #1e3a8a; }',
    '    .meta { margin-top: 20px; display: flex; justify-content: space-between; }',
    '    .card { background: #f8fafc; padding: 15px; border-radius: 8px; width: 45%; }',
    '    table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 13px; }',
    '    th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }',
    '    .totals { margin-top: 20px; margin-left: auto; width: 300px; }',
    '    .totals div { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }',
    '    .grand { font-size: 16px; font-weight: bold; color: #1e3a8a; border-top: 2px solid #cbd5e1; padding-top: 8px; }',
    '    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="header">',
    '    <div>',
    '      <div class="title">TAX INVOICE</div>',
    '      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">FinPilot AI Enterprise Cashflow Platform</div>',
    '    </div>',
    '    <div style="text-align: right;">',
    '      <div style="font-size: 18px; font-weight: bold; color: #2563eb;">#' + inv.invoiceNumber + '</div>',
    '      <div style="font-size: 12px; color: #64748b;">Date: ' + formatDate(inv.invoiceDate || inv.issueDate) + '</div>',
    '      <div style="font-size: 12px; color: #ef4444; font-weight: bold;">Due Date: ' + formatDate(inv.dueDate) + '</div>',
    '    </div>',
    '  </div>',
    '  <div class="meta">',
    '    <div class="card">',
    '      <strong style="color: #0f172a;">Supplier / Entity:</strong><br>',
    '      Kalyan Forge Engineering Pvt Ltd<br>',
    '      GSTIN: 27AABCK1298L1ZU<br>',
    '      Pune, Maharashtra 411014',
    '    </div>',
    '    <div class="card">',
    '      <strong style="color: #0f172a;">Bill To (Customer):</strong><br>',
    '      ' + (inv.customerName || 'Customer') + '<br>',
    '      GSTIN: ' + (inv.customerGstin || 'UNREGISTERED') + '<br>',
    '      ' + (inv.customerAddress || '') + '',
    '    </div>',
    '  </div>',
    '  <table>',
    '    <thead>',
    '      <tr>',
    '        <th style="text-align: center;">#</th>',
    '        <th>Description</th>',
    '        <th style="text-align: center;">Qty</th>',
    '        <th style="text-align: right;">Rate</th>',
    '        <th style="text-align: right;">Taxable</th>',
    '        <th style="text-align: right;">GST</th>',
    '        <th style="text-align: right;">Total</th>',
    '      </tr>',
    '    </thead>',
    '    <tbody>',
    itemsHtml,
    '    </tbody>',
    '  </table>',
    '  <div class="totals">',
    '    <div><span>Subtotal:</span> <span>' + formatINR(inv.subtotal) + '</span></div>',
    '    <div><span>Total GST:</span> <span>' + formatINR(inv.totalGstAmount) + '</span></div>',
    '    <div class="grand"><span>Grand Total:</span> <span>' + formatINR(inv.grandTotal || inv.amount) + '</span></div>',
    '    <div><span>Paid Amount:</span> <span style="color: #16a34a;">' + formatINR(inv.paidAmount || 0) + '</span></div>',
    '    <div style="font-weight: bold; color: #dc2626;"><span>Balance Due:</span> <span>' + formatINR(inv.outstandingAmount !== undefined ? inv.outstandingAmount : inv.balanceDue) + '</span></div>',
    '  </div>',
    '  <div style="margin-top: 25px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px;">',
    '    <strong>Payment Terms:</strong> ' + (inv.paymentTerms || 'Net 30 Days') + '<br>',
    '    <strong>Notes:</strong> ' + (inv.notes || 'Thank you for your business.') + '',
    '  </div>',
    '  <div class="footer">',
    '    Generated by FinPilot AI Autonomous Cashflow Engine &bull; Digitally Validated Invoice Record',
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n');

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printContent);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  }
}

// --- Search & Filter Listeners ---
let debounceTimer;
if (invoiceSearchInput) {
  invoiceSearchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      loadInvoices();
    }, 300);
  });
}

if (headerSearchInput) {
  headerSearchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      loadInvoices();
    }, 300);
  });
}

if (counterpartyFilter) {
  counterpartyFilter.addEventListener('change', (e) => {
    currentCounterparty = e.target.value;
    if (currentCounterparty === 'all') {
      renderInvoicesTable(allInvoices);
    } else {
      const filtered = allInvoices.filter(i => (i.customerName || '').toLowerCase().includes(currentCounterparty.toLowerCase()));
      renderInvoicesTable(filtered);
    }
  });
}

// Status Tabs
const tabs = document.querySelectorAll('.status-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-xs');
      t.classList.add('text-slate-600');
    });
    tab.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-xs');
    tab.classList.remove('text-slate-600');

    currentFilter = tab.dataset.status;
    loadInvoices();
  });
});

// Reset Filters Button
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    if (invoiceSearchInput) invoiceSearchInput.value = '';
    if (headerSearchInput) headerSearchInput.value = '';
    if (counterpartyFilter) counterpartyFilter.value = 'all';
    currentSearch = '';
    currentFilter = 'all';
    currentCounterparty = 'all';
    if (tabs.length > 0) tabs[0].click();
  });
}

// Select All Checkbox
if (selectAllInvoices) {
  selectAllInvoices.addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
    });
  });
}

// --- Initialize on Page Load ---
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadCustomers(),
    loadSummary(),
    loadInvoices(),
  ]);
});

