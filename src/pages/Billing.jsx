import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Wallet,
  Download,
  CheckCircle2,
  AlertCircle,
  Printer,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  FileText,
  Sparkles,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useCloud } from '../context/CloudContext';
import { cloudBillingInvoicesFunction } from '../services/cloudApiService';

export default function Billing() {
  const {
    organization,
    invoices,
    services,
    payInvoice,
    topUpWallet,
  } = useCloud();

  // On mount: trigger real HTTP telemetry request to /api/v1/cloud/billing
  useEffect(() => {
    cloudBillingInvoicesFunction();
  }, []);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'unpaid'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);

  // Top-Up Form State
  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [topUpMethod, setTopUpMethod] = useState('UPI / QR Code');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  // Payment Processing State
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState(null);

  // Quick top-up preset values
  const quickRechargeAmounts = [1000, 2500, 5000, 10000, 25000];

  // Financial calculations
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      totalBilled += inv.amount;
      if (inv.status === 'paid') {
        totalPaid += inv.amount;
        paidCount++;
      } else {
        totalUnpaid += inv.amount;
        unpaidCount++;
      }
    }

    return {
      totalBilled,
      totalPaid,
      totalUnpaid,
      paidCount,
      unpaidCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Filtered Invoices List
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.invoiceId.toLowerCase().includes(q) ||
        inv.period.toLowerCase().includes(q) ||
        (inv.paymentMethod && inv.paymentMethod.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Explicit Named Handlers for Chrome DevTools Inspect & Debugging
  const cloudInvoiceViewFunction = useCallback((invoice) => {
    console.info(`%c[CloudBillingFunction]%c Inspecting GST Invoice: ${invoice.invoiceId}`, 'color: #06b6d4; font-weight: bold;', 'color: #67e8f9;', invoice);
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  }, []);

  const cloudInvoiceDownloadFunction = useCallback((invoice) => {
    console.info(`%c[CloudBillingFunction]%c Generating Tax Invoice PDF export for ${invoice.invoiceId}`, 'color: #10b981; font-weight: bold;', 'color: #6ee7b7;');
    window.print();
  }, []);

  const cloudInvoicePayNowModalOpenFunction = useCallback((invoice) => {
    console.info(`%c[CloudBillingFunction]%c Initiating payment settlement for ${invoice.invoiceId} (₹${invoice.amount.toLocaleString()})`, 'color: #f59e0b; font-weight: bold;', 'color: #fde68a;');
    setPayingInvoice(invoice);
    setIsPayModalOpen(true);
    setPaymentFeedback(null);
  }, []);

  const cloudInvoiceConfirmPayFunction = useCallback(() => {
    if (!payingInvoice) return;

    setIsProcessingPay(true);
    console.info(`%c[CloudPaymentFunction]%c Processing automated wallet deduction for ${payingInvoice.invoiceId}`, 'color: #06b6d4; font-weight: bold;', 'color: #38bdf8;');

    setTimeout(() => {
      const result = payInvoice(payingInvoice._id);
      setIsProcessingPay(false);

      if (result.success) {
        setPaymentFeedback({
          type: 'success',
          message: `Invoice ${payingInvoice.invoiceId} paid successfully! ₹${payingInvoice.amount.toLocaleString()} settled from wallet.`,
        });
        setTimeout(() => {
          setIsPayModalOpen(false);
          setPayingInvoice(null);
          setPaymentFeedback(null);
        }, 1400);
      } else {
        setPaymentFeedback({
          type: 'error',
          message: result.message || 'Payment failed. Please top-up your wallet.',
        });
      }
    }, 900);
  }, [payingInvoice, payInvoice]);

  const cloudWalletRechargeSubmitFunction = useCallback((e) => {
    e?.preventDefault();
    if (topUpAmount <= 0) return;

    setIsProcessingTopUp(true);
    console.info(`%c[CloudWalletFunction]%c Processing wallet credit recharge: ₹${topUpAmount.toLocaleString()} via ${topUpMethod}`, 'color: #10b981; font-weight: bold;', 'color: #6ee7b7;');

    setTimeout(() => {
      topUpWallet(topUpAmount, topUpMethod);
      setIsProcessingTopUp(false);
      setIsTopUpOpen(false);
    }, 700);
  }, [topUpAmount, topUpMethod, topUpWallet]);

  return (
    <div id="billing-page" data-component="BillingPage" className="space-y-6">
      {/* 1. Header with Dedicated Cloud Billing SVG Icon */}
      <div id="billing-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <img
            id="billing-header-icon"
            src="/icons/cloud-billing.svg"
            alt="Billing and Invoices"
            className="w-10 h-10 rounded-xl p-1.5 bg-amber-950/40 border border-amber-800/40 shrink-0 shadow-sm shadow-amber-500/10"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Billing & Tax Invoices
              </h1>
              <Badge variant={stats.unpaidCount > 0 ? 'warning' : 'success'} size="sm">
                {stats.unpaidCount > 0 ? `${stats.unpaidCount} Due Settlement` : 'All Settled'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Multi-tenant prepaid credit balance, itemized GST tax invoices (CGST 9% + SGST 9%), and automated cloud metering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            id="btn-recharge-wallet-header"
            data-action="recharge-wallet"
            data-function="cloudWalletRechargeFunction"
            variant="primary"
            size="sm"
            iconLeft={Wallet}
            onClick={() => setIsTopUpOpen(true)}
            className="shadow-sm shadow-cyan-500/20"
          >
            Recharge Wallet
          </Button>
        </div>
      </div>

      {/* 2. Financial Overview Metric Cards */}
      <div id="billing-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Wallet Balance */}
        <Card id="card-wallet-balance" className="p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Available Wallet Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
              ₹{organization.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              Auto-debit active on 1st of month
            </p>
          </div>
        </Card>

        {/* Card 2: Current Monthly Run-Rate */}
        <Card id="card-monthly-runrate" className="p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimated Monthly Run-Rate</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              ₹{organization.totalMonthlyRunRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Across {services.filter((s) => s.status === 'active').length} active cloud instances
            </p>
          </div>
        </Card>

        {/* Card 3: Current Billing Cycle */}
        <Card id="card-billing-cycle" className="p-4 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Billing Cycle</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white tracking-tight">
              Oct 01 – Oct 31, 2026
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400 inline" /> Next statement in 14 days
            </p>
          </div>
        </Card>

        {/* Card 4: Default Payment Instrument */}
        <Card id="card-payment-instrument" className="p-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Primary Payment Instrument</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span className="font-mono text-cyan-300">Mastercard •••• 4829</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PCI-DSS & 3DS Verified</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Invoices Ledger Card */}
      <Card
        id="card-invoices-ledger"
        title="Tax Invoices & Billing Statements"
        subtitle="Historical monthly usage statements with itemized GST compliance"
        icon={Receipt}
        badge={
          <span className="text-xs font-mono text-slate-400">
            {stats.paidCount} Paid • {stats.unpaidCount} Due
          </span>
        }
      >
        {/* Search & Filter Toolbar */}
        <div id="invoices-filter-toolbar" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              id="filter-invoices-all"
              data-function="cloudInvoiceFilterAllFunction"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Invoices ({stats.totalCount})
            </button>
            <button
              id="filter-invoices-paid"
              data-function="cloudInvoiceFilterPaidFunction"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Paid ({stats.paidCount})
            </button>
            <button
              id="filter-invoices-unpaid"
              data-function="cloudInvoiceFilterUnpaidFunction"
              onClick={() => setStatusFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === 'unpaid'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unpaid / Due ({stats.unpaidCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-invoices"
              data-function="cloudInvoiceSearchFunction"
              type="text"
              placeholder="Search invoice ID or month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table id="billing-invoices-table" data-component="InvoicesTable" className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">Invoice ID & Period</th>
                <th className="pb-3 font-semibold">Issue / Due Date</th>
                <th className="pb-3 font-semibold">Taxable Subtotal</th>
                <th className="pb-3 font-semibold">GST (CGST + SGST)</th>
                <th className="pb-3 font-semibold">Total Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-sans">
                    <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-300">No invoices match your selection</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv._id}
                    id={`invoice-row-${inv.invoiceId}`}
                    data-invoice-id={inv.invoiceId}
                    data-invoice-status={inv.status}
                    className="hover:bg-slate-850/40 transition-colors group font-sans"
                  >
                    {/* 1. Invoice ID & Period */}
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <button
                            id={`btn-view-invoice-${inv.invoiceId}`}
                            data-action="view-invoice"
                            data-function="cloudInvoiceViewFunction"
                            onClick={() => cloudInvoiceViewFunction(inv)}
                            className="font-mono font-semibold text-slate-200 hover:text-cyan-400 text-left transition-colors cursor-pointer"
                          >
                            {inv.invoiceId}
                          </button>
                          <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[200px]">
                            {inv.period}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Issue / Due Date */}
                    <td className="py-3.5 px-3 font-mono text-[11px]">
                      <span className="text-slate-300 block">{inv.date}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Due: {inv.dueDate}
                      </span>
                    </td>

                    {/* 3. Subtotal */}
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      ₹{inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* 4. GST Breakdown */}
                    <td className="py-3.5 px-3 font-mono text-[11px]">
                      <span className="text-slate-300 block">
                        ₹{inv.taxBreakdown.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        CGST 9% + SGST 9%
                      </span>
                    </td>

                    {/* 5. Total Amount */}
                    <td className="py-3.5 px-3 font-mono">
                      <span className="text-white font-bold text-sm block">
                        ₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* 6. Payment Status */}
                    <td className="py-3.5 px-3">
                      <Badge
                        variant={inv.status === 'paid' ? 'success' : 'warning'}
                        size="xs"
                        dot
                      >
                        <span className="capitalize">{inv.status}</span>
                      </Badge>
                    </td>

                    {/* 7. Action Buttons */}
                    <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If unpaid, show prominent Pay Now action */}
                        {inv.status === 'unpaid' && (
                          <Button
                            id={`btn-pay-invoice-${inv.invoiceId}`}
                            data-action="pay-invoice"
                            data-function="cloudInvoicePayNowModalOpenFunction"
                            variant="primary"
                            size="xs"
                            onClick={() => cloudInvoicePayNowModalOpenFunction(inv)}
                            className="bg-amber-500 hover:bg-amber-600 border-amber-400 text-slate-950 font-semibold"
                          >
                            Pay Now
                          </Button>
                        )}

                        {/* View Tax Invoice Modal */}
                        <button
                          id={`btn-inspect-invoice-${inv.invoiceId}`}
                          data-action="inspect-invoice"
                          data-function="cloudInvoiceViewFunction"
                          onClick={() => cloudInvoiceViewFunction(inv)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer"
                          title="View Official GST Invoice"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Print / Download Button */}
                        <button
                          id={`btn-download-invoice-${inv.invoiceId}`}
                          data-action="download-invoice"
                          data-function="cloudInvoiceDownloadFunction"
                          onClick={() => cloudInvoiceDownloadFunction(inv)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                          title="Print or Download PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. GST Tax Invoice Modal (Official Print / PDF Ready) */}
      <Modal
        id="modal-gst-invoice"
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Official GST Tax Invoice"
        subtitle={`Statement Reference: ${selectedInvoice?.invoiceId || ''}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400 font-mono">
              SAC Code: 998315 (Hosting & Cloud Services)
            </span>
            <div className="flex items-center gap-2">
              <Button
                id="btn-close-invoice-modal"
                variant="outline"
                size="sm"
                onClick={() => setIsInvoiceModalOpen(false)}
              >
                Close
              </Button>
              <Button
                id="btn-print-invoice-modal"
                data-action="print-invoice"
                data-function="cloudInvoiceDownloadFunction"
                variant="primary"
                size="sm"
                iconLeft={Printer}
                onClick={() => cloudInvoiceDownloadFunction(selectedInvoice)}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        }
      >
        {selectedInvoice && (
          <div id="printable-gst-invoice" className="space-y-6 text-xs text-slate-300 font-sans">
            {/* Invoice Top Header */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-white tracking-tight">
                    Infra<span className="text-cyan-400">Pulse</span> Cloud Technologies Pvt Ltd
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase font-mono">
                    CMP Platform
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Plot C-59, G-Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051
                </p>
                <div className="mt-2 text-[11px] font-mono space-y-0.5 text-slate-300">
                  <p>
                    <span className="text-slate-500">Service Provider GSTIN:</span>{' '}
                    <span className="text-cyan-300 font-bold">27AABCI9876Q1Z2</span> (State Code: 27)
                  </p>
                  <p>
                    <span className="text-slate-500">Tax Invoice Number:</span>{' '}
                    <span className="text-white font-bold">{selectedInvoice.invoiceId}</span>
                  </p>
                </div>
              </div>

              {/* Status Stamp */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between">
                <div
                  className={`px-3 py-1 rounded-xl text-center font-bold tracking-wider font-mono text-xs uppercase border ${
                    selectedInvoice.status === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {selectedInvoice.status === 'paid' ? 'TAX INVOICE - PAID' : 'PAYMENT DUE'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2 text-right">
                  <p>Date: {selectedInvoice.date}</p>
                  <p>Due: {selectedInvoice.dueDate}</p>
                </div>
              </div>
            </div>

            {/* Billed To Customer Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To (Customer Details)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{organization.name}</p>
                  <p className="text-slate-300 mt-0.5">Attn: {organization.contactName} ({organization.role})</p>
                  <p className="text-slate-400 mt-0.5">{organization.billingAddress}</p>
                </div>
                <div className="font-mono text-xs space-y-1 sm:text-right">
                  <p>
                    <span className="text-slate-400 font-sans">Customer GSTIN:</span>{' '}
                    <span className="text-emerald-400 font-bold">{organization.gstin}</span>
                  </p>
                  <p>
                    <span className="text-slate-400 font-sans">Place of Supply:</span> Maharashtra (27)
                  </p>
                  <p>
                    <span className="text-slate-400 font-sans">Billing Period:</span> {selectedInvoice.period}
                  </p>
                </div>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Service Description & Hardware Specs</th>
                    <th className="py-2.5 px-3 text-center">Qty / Hrs</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 text-slate-200 font-sans font-medium">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-400">{item.qty}</td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right text-white font-semibold">
                        {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Calculation & Settlement Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                <span className="font-semibold text-slate-300 block">Payment Terms & GST Notes:</span>
                <p className="text-slate-400">
                  1. Supply of cloud computing infrastructure qualifies under SAC 998315.
                </p>
                <p className="text-slate-400">
                  2. Applicable GST: Central Tax (CGST) 9% + State Tax (SGST) 9% for intra-state supply.
                </p>
                <p className="text-slate-400">
                  3. Method of settlement: {selectedInvoice.paymentMethod || 'Prepaid Wallet / Card'}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Taxable Subtotal:</span>
                  <span className="text-slate-200">
                    ₹{selectedInvoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CGST (9.0%):</span>
                  <span className="text-slate-200">
                    ₹{selectedInvoice.taxBreakdown.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SGST (9.0%):</span>
                  <span className="text-slate-200">
                    ₹{selectedInvoice.taxBreakdown.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                  <span className="font-sans font-bold text-white">Total Amount Due:</span>
                  <span className="font-bold text-cyan-400 text-base">
                    ₹{selectedInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Pay Now Invoice Settlement Modal */}
      <Modal
        id="modal-pay-invoice"
        isOpen={isPayModalOpen}
        onClose={() => !isProcessingPay && setIsPayModalOpen(false)}
        title="Settle Outstanding Invoice"
        subtitle={`Invoice Ref: ${payingInvoice?.invoiceId || ''}`}
        size="md"
        footer={
          <>
            <Button
              id="btn-cancel-pay-invoice"
              variant="outline"
              size="sm"
              disabled={isProcessingPay}
              onClick={() => setIsPayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-confirm-pay-invoice"
              data-action="confirm-pay-invoice"
              data-function="cloudInvoiceConfirmPayFunction"
              variant="primary"
              size="sm"
              disabled={isProcessingPay || (payingInvoice && organization.walletBalance < payingInvoice.amount)}
              onClick={cloudInvoiceConfirmPayFunction}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              {isProcessingPay ? 'Settling Payment...' : 'Confirm Wallet Settlement'}
            </Button>
          </>
        }
      >
        {payingInvoice && (
          <div className="space-y-4 text-xs">
            {/* Feedback alert */}
            {paymentFeedback && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  paymentFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {paymentFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{paymentFeedback.message}</span>
              </div>
            )}

            {/* Bill amount */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Invoice Amount Due:</span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                  ₹{payingInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Includes 18% GST (CGST + SGST)</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Available Wallet Credits:</span>
                <span
                  className={`text-lg font-bold font-mono mt-0.5 block ${
                    organization.walletBalance >= payingInvoice.amount
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  ₹{organization.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Insufficient Funds Warning */}
            {organization.walletBalance < payingInvoice.amount && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Insufficient prepaid wallet credits to settle this invoice.</span>
                </div>
                <Button
                  id="btn-recharge-from-modal"
                  size="xs"
                  variant="primary"
                  onClick={() => {
                    setIsPayModalOpen(false);
                    setIsTopUpOpen(true);
                  }}
                >
                  Top-up Now
                </Button>
              </div>
            )}

            {/* Balance after payment preview */}
            {organization.walletBalance >= payingInvoice.amount && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Current Wallet Balance:</span>
                  <span>₹{organization.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Invoice Deducted:</span>
                  <span>-₹{payingInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                  <span>New Wallet Balance:</span>
                  <span>
                    ₹{(organization.walletBalance - payingInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 6. Prepaid Wallet Top-up Recharge Modal */}
      <Modal
        id="modal-wallet-topup"
        isOpen={isTopUpOpen}
        onClose={() => !isProcessingTopUp && setIsTopUpOpen(false)}
        title="Recharge Cloud Prepaid Credits"
        subtitle="Add funds to your multi-tenant automated debit balance"
        size="md"
        footer={
          <>
            <Button
              id="btn-cancel-topup"
              variant="outline"
              size="sm"
              disabled={isProcessingTopUp}
              onClick={() => setIsTopUpOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-confirm-topup"
              data-action="confirm-topup"
              data-function="cloudWalletRechargeSubmitFunction"
              variant="primary"
              size="sm"
              disabled={isProcessingTopUp || topUpAmount <= 0}
              onClick={cloudWalletRechargeSubmitFunction}
              className="shadow-sm shadow-cyan-500/20"
            >
              {isProcessingTopUp ? 'Crediting Account...' : `Credit ₹${topUpAmount.toLocaleString()}`}
            </Button>
          </>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Current balance chip */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Current Balance:</span>
            <span className="font-mono text-base font-bold text-emerald-400">
              ₹{organization.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Quick preset chips */}
          <div>
            <label className="font-semibold text-slate-300 block mb-2">Select Recharge Amount:</label>
            <div className="grid grid-cols-5 gap-2">
              {quickRechargeAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  id={`chip-topup-${amt}`}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                    topUpAmount === amt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount input */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">Or Enter Custom Amount (₹):</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">₹</span>
              <input
                id="input-custom-topup-amount"
                type="number"
                min="100"
                step="500"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="font-semibold text-slate-300 block mb-2">Select Payment Gateway:</label>
            <div className="space-y-2">
              {[
                { id: 'upi', label: 'UPI / QR Code (PhonePe, Google Pay, Paytm)', badge: 'Instant' },
                { id: 'netbanking', label: 'Corporate NetBanking (HDFC, ICICI, SBI, Axis)', badge: 'Zero Surcharge' },
                { id: 'card', label: 'Corporate Credit / Debit Card (Visa, Mastercard, RuPay)', badge: '3DS Secure' },
              ].map((m) => (
                <div
                  key={m.id}
                  id={`method-${m.id}`}
                  onClick={() => setTopUpMethod(m.label)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    topUpMethod === m.label
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        topUpMethod === m.label
                          ? 'border-cyan-400 bg-cyan-400'
                          : 'border-slate-600'
                      }`}
                    >
                      {topUpMethod === m.label && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{m.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {m.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
