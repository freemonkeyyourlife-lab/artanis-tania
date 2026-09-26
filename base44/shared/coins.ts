// Shared coin economy: value, packages and the credit/debit primitives.
// Used by the coinWallet function and by the Stripe webhook (coin purchases).

export const COIN_VALUE = 0.1; // 1 Coin = 0,10 €

export const COIN_PACKAGES = [
  { id: 'starter', coins: 100, price: 9.99, tag: null },
  { id: 'plus', coins: 350, price: 29.99, tag: 'Beliebt' },
  { id: 'pro', coins: 900, price: 69.99, tag: 'Bester Wert' },
];

export const DAILY_BONUS = 50;
export const WELCOME_BONUS = 100;

export function coinsForPrice(price) {
  return Math.max(1, Math.round(Number(price) / COIN_VALUE));
}

// Every user gets a wallet; the first one comes with a welcome bonus.
export async function getOrCreateWallet(base44, userId) {
  const found = await base44.asServiceRole.entities.CoinWallet.filter({ userId });
  if (found.length > 0) return found[0];

  const wallet = await base44.asServiceRole.entities.CoinWallet.create({
    userId,
    balance: WELCOME_BONUS,
    currencyCode: 'EUR',
    coinValueInCurrency: COIN_VALUE,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
  });

  await base44.asServiceRole.entities.CoinLedger.create({
    userId,
    walletId: wallet.id,
    direction: 'CREDIT',
    amountCoins: WELCOME_BONUS,
    valueInCurrency: Number((WELCOME_BONUS * COIN_VALUE).toFixed(2)),
    currency: 'EUR',
    sourceType: 'BONUS',
    sourceId: 'welcome',
    description: 'Willkommensbonus',
    balanceAfter: WELCOME_BONUS,
  });

  return wallet;
}

export async function creditCoins(base44, userId, amount, sourceType, description, sourceId) {
  const wallet = await getOrCreateWallet(base44, userId);
  const balance = (wallet.balance || 0) + amount;

  await base44.asServiceRole.entities.CoinWallet.update(wallet.id, {
    balance,
    updatedAt: new Date().toISOString(),
  });

  await base44.asServiceRole.entities.CoinLedger.create({
    userId,
    walletId: wallet.id,
    direction: 'CREDIT',
    amountCoins: amount,
    valueInCurrency: Number((amount * COIN_VALUE).toFixed(2)),
    currency: 'EUR',
    sourceType,
    sourceId,
    description,
    balanceAfter: balance,
  });

  return balance;
}

export async function debitCoins(base44, userId, amount, sourceType, description) {
  const wallet = await getOrCreateWallet(base44, userId);
  if ((wallet.balance || 0) < amount) return { error: 'Nicht genug Coins' };

  const balance = wallet.balance - amount;

  await base44.asServiceRole.entities.CoinWallet.update(wallet.id, {
    balance,
    updatedAt: new Date().toISOString(),
  });

  await base44.asServiceRole.entities.CoinLedger.create({
    userId,
    walletId: wallet.id,
    direction: 'DEBIT',
    amountCoins: amount,
    valueInCurrency: Number((amount * COIN_VALUE).toFixed(2)),
    currency: 'EUR',
    sourceType,
    description,
    balanceAfter: balance,
  });

  return { balance };
}