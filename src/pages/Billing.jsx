import React from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Receipt, CreditCard, Wallet, Download, CheckCircle2 } from 'lucide-react';

export default function Billing() {
  return (
    <div id="billing-page" data-component="BillingPage" className="space-y-6">
      <div id="billing-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <img
            id="billing-header-icon"
            src="/icons/cloud-billing.svg"
            alt="Billing and Invoices"
            className="w-10 h-10 rounded-xl p-1.5 bg-amber-950/40 border border-amber-800/40 shrink-0 shadow-sm shadow-amber-500/10"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Billing & Invoices
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Wallet balance, GST tax invoices (CGST/SGST/IGST), payment methods, and automated billing.
            </p>
          </div>
        </div>
        <Button id="btn-recharge-wallet-billing" data-action="recharge-wallet" data-function="cloudWalletRechargeFunction" variant="primary" iconLeft={Wallet}>
          Recharge Wallet
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs text-slate-400">Available Wallet Balance</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            ₹12,450.00
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Auto-debit active on 1st of month
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-slate-400">Current Billing Cycle</span>
          <div className="mt-2 text-xl font-bold text-white">
            Oct 1 – Oct 31, 2026
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Next invoice date: Nov 1, 2026
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-slate-400">Default Payment Method</span>
          <div className="mt-2 text-base font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>Mastercard •••• 4829</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400">
            Verified & Compliant
          </div>
        </Card>
      </div>

      <Card
        title="Invoices & Tax Ledger"
        subtitle="Itemized billing statements with GST compliance"
        icon={Receipt}
      >
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center p-6">
          <Receipt className="w-10 h-10 text-cyan-400 mb-3" />
          <h4 className="text-base font-semibold text-slate-200">
            Billing & Invoices Route Active
          </h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Invoices table with tax breakdown (CGST/SGST), PDF-ready invoice preview, and wallet top-up will be implemented in `feat/billing-invoices`.
          </p>
        </div>
      </Card>
    </div>
  );
}
