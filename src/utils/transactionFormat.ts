/**
 * PalmPay Transaction & Receipt Formatter Utility
 * Generates authentic 18-digit PalmPay Transaction IDs, 30-digit NIBSS Session IDs,
 * and realistic PalmPay Remark lines that match genuine PalmPay transaction receipts.
 */

// Helper to generate a consistent hash from a seed string
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Generates an 18-digit authentic PalmPay Transaction ID.
 * Format: YYMMDDHHmmss + 6 digits (e.g. 261002143029188471)
 */
export function generatePalmPayTransactionId(dateInput?: any, seedInput?: string): string {
  // If already an 16-20 digit numeric string, preserve it
  if (seedInput && /^\d{16,20}$/.test(String(seedInput).trim())) {
    return String(seedInput).trim();
  }

  const d = dateInput
    ? (typeof dateInput === 'number'
        ? new Date(dateInput > 1e11 ? dateInput : dateInput * 1000)
        : (dateInput?.seconds ? new Date(dateInput.seconds * 1000) : new Date(dateInput)))
    : new Date();

  const valid = isNaN(d.getTime()) ? new Date() : d;

  const yy = String(valid.getFullYear()).slice(-2);
  const mm = String(valid.getMonth() + 1).padStart(2, '0');
  const dd = String(valid.getDate()).padStart(2, '0');
  const hh = String(valid.getHours()).padStart(2, '0');
  const min = String(valid.getMinutes()).padStart(2, '0');
  const ss = String(valid.getSeconds()).padStart(2, '0');

  const seed = String(seedInput || `${yy}${mm}${dd}${hh}${min}${ss}`);
  const h = hashSeed(seed + 'txid');
  const suffix6 = String(h % 1000000).padStart(6, '7');

  return `${yy}${mm}${dd}${hh}${min}${ss}${suffix6}`;
}

/**
 * Generates an authentic 30-digit NIBSS / PalmPay Session ID.
 * Format: 6-digit Bank Code (999991 / 100033) + 12-digit YYMMDDHHmmss + 12 random/deterministic digits
 * Example: 999991261002143029188471928374
 */
export function generatePalmPaySessionId(dateInput?: any, bankCode = '999991', seedInput?: string): string {
  // If already a 30-digit numeric string, preserve it
  if (seedInput && /^\d{30}$/.test(String(seedInput).trim())) {
    return String(seedInput).trim();
  }

  const txId = generatePalmPayTransactionId(dateInput, seedInput);
  const dateTime12 = txId.slice(0, 12); // YYMMDDHHmmss

  let code = String(bankCode || '999991').replace(/\D/g, '');
  if (!code || code.length < 6) {
    code = code.padStart(6, '9');
  } else if (code.length > 6) {
    code = code.slice(0, 6);
  }

  const seed = String(seedInput || `${txId}session`);
  const h1 = hashSeed(seed + 'nibss1');
  const h2 = hashSeed(seed + 'nibss2');

  const suffix12 = String(h1 % 1000000).padStart(6, '4') + String(h2 % 1000000).padStart(6, '9');

  return `${code}${dateTime12}${suffix12}`;
}

/**
 * Generates the authentic Remark line as printed on PalmPay transaction receipts.
 */
export function generatePalmPayRemark(tx: {
  isIncoming?: boolean;
  type?: string;
  category?: string;
  senderName?: string;
  senderBank?: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  bankName?: string;
  accountNumber?: string;
  narration?: string;
  remark?: string;
  network?: string;
  platform?: string;
}): string {
  // If a custom narration exists and already has NIP/ or trsf from format, use it
  const custom = tx.remark || tx.narration;
  if (custom && (custom.startsWith('trsf') || custom.startsWith('NIP/') || custom.startsWith('TRSF/') || custom.startsWith('transfer to'))) {
    return custom;
  }

  const isCredit =
    tx.isIncoming ??
    (tx.type === 'credit' ||
      tx.type === 'interest' ||
      (typeof tx.narration === 'string' && tx.narration.toLowerCase().includes('received')));

  const senderName = (tx.senderName || 'PALMPAY USER').trim().toUpperCase();
  const senderBank = (tx.senderBank || 'PALMPAY').trim().toUpperCase();
  const recipientName = (tx.recipientName || 'PALMPAY USER').trim().toUpperCase();
  const recipientAcc = (tx.recipientAccount || tx.accountNumber || '8082076038').trim();
  const recipientBank = (tx.recipientBank || tx.bankName || 'PALMPAY').trim().toUpperCase();

  if (tx.type === 'airtime' || tx.category === 'airtime') {
    const net = (tx.network || tx.senderBank || 'MTN').toUpperCase();
    return `Airtime recharge for ${recipientAcc} ${net}`;
  }

  if (tx.type === 'data' || tx.category === 'data') {
    const net = (tx.network || tx.senderBank || 'MTN').toUpperCase();
    return `Data bundle recharge for ${recipientAcc} ${net}`;
  }

  if (tx.type === 'electricity' || tx.category === 'electricity') {
    return `Token recharge for Meter ${recipientAcc} - AEDC`;
  }

  if (tx.type === 'betting' || tx.category === 'betting') {
    const platform = (tx.platform || tx.recipientName || 'SPORTYBET').toUpperCase();
    return `Wallet funding for ${platform} - ID: ${recipientAcc}`;
  }

  if (isCredit) {
    if (custom && custom !== 'PalmPay Cashback' && !custom.includes('Received from')) {
      return `trsf from ${senderBank} / ${senderName} to ${recipientAcc} ${recipientName} - ${custom}`;
    }
    return `trsf from ${senderBank} / ${senderName} to ${recipientAcc} ${recipientName}`;
  } else {
    return `transfer to ${recipientAcc}/${recipientName}/${recipientBank}`;
  }
}

/**
 * Standard PalmPay completion time format:
 * YYYY-MM-DD HH:mm:ss (e.g. 2026-10-02 14:30:25)
 */
export function formatReceiptCompletionTime(dateInput?: any): string {
  if (!dateInput) {
    const now = new Date();
    return formatDateTimeStandard(now);
  }

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }

  let d: Date;
  if (dateInput?.seconds) {
    d = new Date(dateInput.seconds * 1000);
  } else if (typeof dateInput === 'number') {
    d = new Date(dateInput > 1e11 ? dateInput : dateInput * 1000);
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) {
    return formatDateTimeStandard(new Date());
  }

  return formatDateTimeStandard(d);
}

function formatDateTimeStandard(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export interface PalmPayReceiptDetails {
  txId: string;
  sessionId: string;
  remark: string;
  completionTime: string;
  senderName: string;
  senderBank: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  maskedSenderAccount: string;
  maskedRecipientAccount: string;
  isIncoming: boolean;
}

/**
 * Comprehensive resolution of authentic receipt metadata for any transaction.
 */
export function ensureReceiptDetails(tx: any, currentUserName?: string, currentUserPhone?: string): PalmPayReceiptDetails {
  const isIncoming =
    tx.type === 'credit' ||
    (typeof tx.formattedAmount === 'string' && tx.formattedAmount.startsWith('+')) ||
    (typeof tx.amount === 'number' && tx.amount > 0 && tx.type !== 'transfer' && tx.type !== 'bill' && tx.type !== 'airtime' && tx.type !== 'data' && tx.type !== 'electricity' && tx.type !== 'betting');

  const seed = String(tx.id || tx.reference || tx.txId || tx.sessionId || `${tx.amount}_${tx.date}`);
  const txDate = tx.timestamp || tx.createdAt || tx.date;

  const txId = generatePalmPayTransactionId(txDate, tx.txId || tx.transactionId || seed);
  const bankCode = tx.bankCode || tx.senderBankCode || '999991';
  const sessionId = generatePalmPaySessionId(txDate, bankCode, tx.sessionId || seed);

  const recipientName = tx.recipient || (isIncoming ? (currentUserName || 'PalmPay Customer') : 'PalmPay User');
  const recipientAccount = tx.accountNumber || (isIncoming ? (currentUserPhone || '8082076038') : '09022856059');
  const recipientBank = tx.recipientBank || tx.bankName || (isIncoming ? 'PalmPay' : 'PalmPay');

  const senderName = tx.senderName || (isIncoming ? 'Site A Portal' : (currentUserName || 'PalmPay User'));
  const senderBank = tx.senderBank || (isIncoming ? 'Site A Portal' : 'PalmPay');

  const remark = generatePalmPayRemark({
    isIncoming,
    type: tx.type,
    category: tx.category,
    senderName,
    senderBank,
    recipientName,
    recipientAccount,
    recipientBank,
    bankName: tx.bankName,
    narration: tx.narration,
    remark: tx.remark,
    network: tx.network,
    platform: tx.platform,
  });

  const completionTime = formatReceiptCompletionTime(txDate);

  // Masking accounts in authentic PalmPay style (e.g. 080***6038 or 090***6059)
  let cleanSenderAcc = '';
  if (tx.senderAccount) {
    cleanSenderAcc = String(tx.senderAccount).replace(/\D/g, '');
  } else if (!isIncoming) {
    cleanSenderAcc = String(currentUserPhone || '08082076038').replace(/\D/g, '');
  } else {
    // Generate deterministic masked account from senderName
    const h = hashSeed(senderName + 'sender');
    cleanSenderAcc = `080${String(h % 10000000).padStart(7, '3')}`;
  }

  const maskedSenderAccount = cleanSenderAcc.length >= 7
    ? `${cleanSenderAcc.slice(0, 3)}***${cleanSenderAcc.slice(-4)}`
    : '080***6038';

  const cleanRecAcc = String(recipientAccount).replace(/\D/g, '');
  const maskedRecipientAccount = cleanRecAcc.length >= 7
    ? `${cleanRecAcc.slice(0, 3)}***${cleanRecAcc.slice(-4)}`
    : '090***6059';

  return {
    txId,
    sessionId,
    remark,
    completionTime,
    senderName,
    senderBank,
    recipientName,
    recipientAccount,
    recipientBank,
    maskedSenderAccount,
    maskedRecipientAccount,
    isIncoming,
  };
}
