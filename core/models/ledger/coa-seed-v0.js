export const COA_SEED_V0 = Object.freeze([
  { accountCode: '1200', accountId: 'acct.inventory', name: 'Inventory', normal: 'debit', unitTypes: ['currency', 'quantity'] },
  { accountCode: '1210', accountId: 'acct.grir', name: 'GRIR Clearing', normal: 'debit', unitTypes: ['currency', 'quantity'] },
  { accountCode: '2100', accountId: 'acct.ap', name: 'Accounts Payable', normal: 'credit', unitTypes: ['currency'] },
  { accountCode: '1010', accountId: 'acct.cashbank', name: 'Cash/Bank', normal: 'debit', unitTypes: ['currency'] },
  { accountCode: '5200', accountId: 'acct.priceVariance', name: 'Price Variance', normal: 'debit', unitTypes: ['currency'] },
  { accountCode: '5210', accountId: 'acct.qtyVariance', name: 'Quantity Variance', normal: 'debit', unitTypes: ['currency', 'quantity'] },
  { accountCode: '1400', accountId: 'acct.budgetCommitment', name: 'Budget Commitment', normal: 'debit', unitTypes: ['currency'] }
]);

export const CONTAINER_ACCOUNT_MAPPING_V0 = Object.freeze({
  'container.siteA.Inventory': 'acct.inventory',
  'container.siteA.GRIR': 'acct.grir',
  'container.company.AP': 'acct.ap',
  'container.company.CashBank': 'acct.cashbank',
  'container.siteA.PriceVariance': 'acct.priceVariance',
  'container.siteA.QtyVariance': 'acct.qtyVariance',
  'container.company.BudgetCommitment': 'acct.budgetCommitment'
});

export const LEDGER_MAPPING_POLICY_V0 = Object.freeze({
  id: 'LGR0-COA-MAPPING-V0',
  version: '2026-02-11',
  resolveAccount(containerRef) {
    const key = typeof containerRef === 'string' ? containerRef : containerRef?.id;
    return CONTAINER_ACCOUNT_MAPPING_V0[String(key || '')] || null;
  }
});

