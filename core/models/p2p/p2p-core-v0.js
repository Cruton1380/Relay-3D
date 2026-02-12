const fnv1aHex = (value) => {
  let hash = 0x811c9dc5;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const isoDay = () => new Date().toISOString().slice(0, 10);

const decimal = (n, digits = 2) => Number(Number(n || 0).toFixed(digits));

export const P2P_OBJECT_TYPES = Object.freeze(['PR', 'PO', 'GR', 'INV', 'PAY']);

export function buildDeterministicP2PId(type, keyParts) {
  const t = String(type || '').toUpperCase();
  const seed = `${t}|${(keyParts || []).map(v => String(v ?? '')).join('|')}`;
  return `${t}-${fnv1aHex(seed).slice(0, 8).toUpperCase()}`;
}

export function createPR(payload = {}) {
  const siteId = String(payload.siteId || 'SITE_A');
  const itemId = String(payload.itemId || 'ITEM-UNKNOWN');
  const qty = decimal(payload.qty || 0, 3);
  const unit = String(payload.unit || 'EA');
  const estUnitPrice = decimal(payload.unitPrice || payload.estUnitPrice || 0);
  const prId = String(payload.prId || buildDeterministicP2PId('PR', [siteId, itemId, qty, unit]));
  const prLineId = String(payload.prLineId || buildDeterministicP2PId('PRL', [prId, itemId]));
  const routePayload = {
    entrySource: 'relay-form',
    sourceId: prLineId,
    eventTimestamp: new Date().toISOString(),
    prId,
    prLineId,
    requestorUserId: String(payload.requesterUserId || payload.userId || 'user.buyer1'),
    department: String(payload.department || 'OPS'),
    siteId,
    itemId,
    description: String(payload.description || itemId),
    qty,
    unit,
    estUnitPrice,
    estTotal: decimal(qty * estUnitPrice),
    currency: String(payload.currency || 'USD'),
    requestDate: String(payload.requestDate || isoDay()),
    status: String(payload.status || 'DRAFT')
  };
  return { objectType: 'PR', id: prId, lineId: prLineId, routeId: 'p2p.pr', routePayload };
}

export function createPOFromPR(prRecord, payload = {}) {
  const source = prRecord || {};
  const siteId = String(payload.siteId || source.siteId || 'SITE_A');
  const itemId = String(payload.itemId || source.itemId || 'ITEM-UNKNOWN');
  const qty = decimal(payload.qty || source.qty || 0, 3);
  const unit = String(payload.unit || source.unit || 'EA');
  const unitPrice = decimal(payload.unitPrice || source.estUnitPrice || 0);
  const poId = String(payload.poId || buildDeterministicP2PId('PO', [source.id || source.prId || 'PR', siteId, itemId]));
  const poLineId = String(payload.poLineId || buildDeterministicP2PId('POL', [poId, itemId]));
  const routePayload = {
    entrySource: 'relay-form',
    sourceId: poLineId,
    eventTimestamp: new Date().toISOString(),
    poId,
    poLineId,
    prId: String(payload.prId || source.id || source.prId || ''),
    vendorId: String(payload.vendorId || 'vendor.APEX'),
    vendorName: String(payload.vendorName || 'APEX'),
    siteId,
    itemId,
    description: String(payload.description || itemId),
    qty,
    unit,
    unitPrice,
    lineTotal: decimal(qty * unitPrice),
    currency: String(payload.currency || source.currency || 'USD'),
    poDate: String(payload.poDate || isoDay()),
    deliveryDate: String(payload.deliveryDate || ''),
    status: String(payload.status || 'OPEN')
  };
  return { objectType: 'PO', id: poId, lineId: poLineId, routeId: 'p2p.po', routePayload };
}

export function createGRFromPO(poRecord, payload = {}) {
  const source = poRecord || {};
  const qty = decimal(payload.qty || source.qty || 0, 3);
  const unitPrice = decimal(payload.unitPrice || source.unitPrice || 0);
  const grId = String(payload.grId || buildDeterministicP2PId('GR', [source.id || source.poId || 'PO', source.lineId || source.poLineId || '', qty]));
  const grLineId = String(payload.grLineId || buildDeterministicP2PId('GRL', [grId, source.lineId || source.poLineId || 'POL']));
  const routePayload = {
    entrySource: 'relay-form',
    sourceId: grLineId,
    eventTimestamp: new Date().toISOString(),
    grId,
    grLineId,
    poId: String(payload.poId || source.id || source.poId || ''),
    poLineId: String(payload.poLineId || source.lineId || source.poLineId || ''),
    siteId: String(payload.siteId || source.siteId || 'SITE_A'),
    itemId: String(payload.itemId || source.itemId || 'ITEM-UNKNOWN'),
    qtyReceived: qty,
    qtyOrdered: decimal(payload.qtyOrdered || source.qty || qty, 3),
    qtyUnit: String(payload.unit || source.unit || 'EA'),
    unitPrice,
    lineValue: decimal(qty * unitPrice),
    receiptDate: String(payload.receiptDate || isoDay()),
    warehouseId: String(payload.warehouseId || 'WH-01'),
    inspectionStatus: String(payload.inspectionStatus || 'PASSED'),
    status: String(payload.status || 'RECEIVED')
  };
  return { objectType: 'GR', id: grId, lineId: grLineId, routeId: 'p2p.gr', routePayload };
}

export function createINVFromPO(poRecord, payload = {}) {
  const source = poRecord || {};
  const qty = decimal(payload.qty || source.qty || 0, 3);
  const unitPrice = decimal(payload.unitPrice || source.unitPrice || 0);
  const invId = String(payload.invId || buildDeterministicP2PId('INV', [source.id || source.poId || 'PO', source.lineId || source.poLineId || '', qty, unitPrice]));
  const invLineId = String(payload.invLineId || buildDeterministicP2PId('INVL', [invId, source.lineId || source.poLineId || 'POL']));
  const taxRate = decimal(payload.taxRate || 0, 4);
  const jurisdiction = String(payload.jurisdiction || 'US-DEFAULT');
  const taxTreatment = String(payload.taxTreatment || 'STANDARD');
  const taxAmount = decimal(payload.taxAmount ?? (qty * unitPrice * taxRate), 2);
  const routePayload = {
    entrySource: 'relay-form',
    sourceId: invLineId,
    eventTimestamp: new Date().toISOString(),
    invId,
    invLineId,
    poId: String(payload.poId || source.id || source.poId || ''),
    poLineId: String(payload.poLineId || source.lineId || source.poLineId || ''),
    vendorId: String(payload.vendorId || source.vendorId || 'vendor.APEX'),
    siteId: String(payload.siteId || source.siteId || 'SITE_A'),
    itemId: String(payload.itemId || source.itemId || 'ITEM-UNKNOWN'),
    qty,
    qtyUnit: String(payload.unit || source.unit || 'EA'),
    unitPrice,
    lineTotal: decimal(qty * unitPrice),
    taxAmount,
    taxRate,
    jurisdiction,
    taxTreatment,
    currency: String(payload.currency || source.currency || 'USD'),
    invoiceDate: String(payload.invoiceDate || isoDay()),
    dueDate: String(payload.dueDate || ''),
    status: String(payload.status || 'POSTED')
  };
  return { objectType: 'INV', id: invId, lineId: invLineId, routeId: 'p2p.inv', routePayload };
}

export function createPAYFromINV(invRecord, payload = {}) {
  const source = invRecord || {};
  const amount = decimal(payload.amount || source.lineTotal || 0);
  const payId = String(payload.payId || buildDeterministicP2PId('PAY', [source.id || source.invId || 'INV', amount]));
  const payLineId = String(payload.payLineId || buildDeterministicP2PId('PAYL', [payId, source.lineId || source.invLineId || 'INVL']));
  const jurisdiction = String(payload.jurisdiction || source.jurisdiction || 'US-DEFAULT');
  const taxTreatment = String(payload.taxTreatment || source.taxTreatment || 'STANDARD');
  const taxRate = decimal(payload.taxRate || source.taxRate || 0, 4);
  const taxAmount = decimal(payload.taxAmount || source.taxAmount || 0, 2);
  const routePayload = {
    entrySource: 'relay-form',
    sourceId: payLineId,
    eventTimestamp: new Date().toISOString(),
    paymentId: payId,
    payLineId,
    invId: String(payload.invId || source.id || source.invId || ''),
    invLineId: String(payload.invLineId || source.lineId || source.invLineId || ''),
    vendorId: String(payload.vendorId || source.vendorId || 'vendor.APEX'),
    amount,
    currency: String(payload.currency || source.currency || 'USD'),
    paymentDate: String(payload.paymentDate || isoDay()),
    paymentMethod: String(payload.paymentMethod || 'WIRE'),
    bankRef: String(payload.bankRef || `BNK-${payId}`),
    jurisdiction,
    taxTreatment,
    taxRate,
    taxAmount,
    status: String(payload.status || 'CLEARED')
  };
  return { objectType: 'PAY', id: payId, lineId: payLineId, routeId: 'p2p.pay', routePayload };
}

