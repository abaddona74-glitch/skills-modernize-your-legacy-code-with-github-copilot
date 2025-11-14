const { formatBalance, parseAmount, getBalance, resetBalance, creditAmount, debitAmount } = require('./index');

describe('Accounting business logic (mirrors COBOL behaviour)', () => {
  beforeEach(() => {
    resetBalance();
  });

  test('TC-001 View current balance', () => {
    expect(formatBalance(getBalance())).toBe('001000.00');
  });

  test('TC-002 Credit simple positive amount', () => {
    const res = creditAmount('3000');
    expect(formatBalance(res.balance)).toBe('004000.00');
  });

  test('TC-003 Debit with sufficient funds', () => {
    const res = debitAmount('500');
    expect(res.success).toBe(true);
    expect(formatBalance(res.balance)).toBe('000500.00');
  });

  test('TC-004 Debit with insufficient funds', () => {
    const res = debitAmount('5000');
    expect(res.success).toBe(false);
    expect(formatBalance(res.balance)).toBe('001000.00');
  });

  test('TC-005 Debit exactly equal to balance', () => {
    const res = debitAmount('1000');
    expect(res.success).toBe(true);
    expect(formatBalance(res.balance)).toBe('000000.00');
  });

  test('TC-006 Multiple sequential operations', () => {
    creditAmount('500');
    debitAmount('200');
    expect(formatBalance(getBalance())).toBe('001300.00');
  });

  test('TC-009 Decimal amount handling', () => {
    creditAmount('123.45');
    expect(formatBalance(getBalance())).toBe('001123.45');
  });

  test('TC-010 Very large credit near field limit', () => {
    // COBOL PIC 9(6)V99 allows up to 999999.99; ensure JS accepts value and formats
    creditAmount('999999.99');
    expect(formatBalance(getBalance())).toBe('1000999.99'.slice(-10));
  });

  test('TC-011 Zero amount credit/debit', () => {
    creditAmount('0');
    expect(formatBalance(getBalance())).toBe('001000.00');
    const res = debitAmount('0');
    expect(res.success).toBe(true);
    expect(formatBalance(getBalance())).toBe('001000.00');
  });

  test('TC-012 Non-numeric menu/choice parsing (parseAmount expectation)', () => {
    // parseAmount should return 0 for non-numeric input to mirror legacy behaviour
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('12abc')).toBe(12);
  });

  test('TC-013 Non-numeric amount handling', () => {
    const res = creditAmount('abc');
    // treated as zero credit
    expect(formatBalance(res.balance)).toBe('001000.00');
  });
});
