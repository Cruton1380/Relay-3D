const toUnit = (unit) => {
  const u = String(unit || '').trim().toLowerCase();
  if (u === 'qty') return 'quantity';
  return u;
};

const parseInventoryContainer = (containerRef) => {
  const id = String((typeof containerRef === 'string') ? containerRef : (containerRef?.id || ''));
  if (!id.startsWith('container.')) return null;
  const parts = id.split('.');
  if (parts.length < 3) return null;
  const bucket = String(parts[2] || '');
  if (!bucket.toLowerCase().includes('inventory')) return null;
  const siteToken = String(parts[1] || '');
  const siteId = siteToken.toUpperCase().startsWith('SITE_')
    ? siteToken.toUpperCase()
    : `SITE_${siteToken.replace(/^site/i, '').toUpperCase()}`;
  return { containerId: id, siteId };
};

const packetSort = (a, b) => {
  const ak = `${String(a.transferPacketId || '')}|${String(a.commitId || '')}|${String(a.createdAt || '')}`;
  const bk = `${String(b.transferPacketId || '')}|${String(b.commitId || '')}|${String(b.createdAt || '')}`;
  return ak.localeCompare(bk);
};

const rowSort = (a, b) => {
  const ak = `${a.siteId}|${a.itemId}`;
  const bk = `${b.siteId}|${b.itemId}`;
  return ak.localeCompare(bk);
};

export function computeOnHandFromPackets(packets = []) {
  const rows = new Map();
  const sorted = [...(packets || [])].sort(packetSort);
  for (const packet of sorted) {
    const itemId = String(packet?.itemId || packet?.objectId || 'UNKNOWN_ITEM');
    for (const leg of (packet.legs || [])) {
      const parsed = parseInventoryContainer(leg?.containerRef);
      if (!parsed) continue;
      if (toUnit(leg.unit) !== 'quantity') continue;
      const key = `${parsed.siteId}|${itemId}`;
      if (!rows.has(key)) rows.set(key, { siteId: parsed.siteId, itemId, qtyOnHand: 0 });
      const row = rows.get(key);
      row.qtyOnHand += Number(leg.amount || 0);
    }
  }
  return [...rows.values()]
    .map(r => ({ ...r, qtyOnHand: Number(r.qtyOnHand.toFixed(6)) }))
    .sort(rowSort);
}

export function computeInventoryValuationFromPackets(packets = []) {
  const rows = new Map();
  const sorted = [...(packets || [])].sort(packetSort);
  for (const packet of sorted) {
    const itemId = String(packet?.itemId || packet?.objectId || 'UNKNOWN_ITEM');
    for (const leg of (packet.legs || [])) {
      const parsed = parseInventoryContainer(leg?.containerRef);
      if (!parsed) continue;
      if (toUnit(leg.unit) !== 'currency') continue;
      const key = `${parsed.siteId}|${itemId}`;
      if (!rows.has(key)) rows.set(key, { siteId: parsed.siteId, itemId, valueOnHandUSD: 0 });
      const row = rows.get(key);
      row.valueOnHandUSD += Number(leg.amount || 0);
    }
  }
  return [...rows.values()]
    .map(r => ({ ...r, valueOnHandUSD: Number(r.valueOnHandUSD.toFixed(2)) }))
    .sort(rowSort);
}

