const readline = require('readline');

// Initial balance matches COBOL `STORAGE-BALANCE` default
let balance = 1000.00;

function formatBalance(b) {
  const rounded = Math.round(b * 100) / 100;
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const intPart = Math.floor(abs);
  const frac = Math.round((abs - intPart) * 100);
  const intStr = String(intPart).padStart(6, '0');
  const fracStr = String(frac).padStart(2, '0');
  return (negative ? '-' : '') + intStr + '.' + fracStr;
}

function parseAmount(input) {
  // Preserve behavior similar to legacy COBOL: accept numeric/decimal input.
  // If parsing fails, treat as 0 (legacy COBOL ACCEPT into numeric PIC often results in zeros).

  const fs = require('fs');
  const path = require('path');
  const readline = require('readline');

  // Data file for student account persistence (loading/saving)
  const DATA_FILE = path.join(__dirname, 'account.json');

  // Default account state matches COBOL `STORAGE-BALANCE` default
  const DEFAULT_ACCOUNT = {
    studentName: 'Student',
    balance: 1000.0
  };

  let account = { ...DEFAULT_ACCOUNT };

  function loadAccount() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const obj = JSON.parse(raw);
        // ensure shape and numbers
        account.studentName = obj.studentName || DEFAULT_ACCOUNT.studentName;
        account.balance = typeof obj.balance === 'number' ? obj.balance : DEFAULT_ACCOUNT.balance;
      } else {
        account = { ...DEFAULT_ACCOUNT };
      }
    } catch (err) {
      // If any error occurs, fall back to defaults to preserve data integrity
      account = { ...DEFAULT_ACCOUNT };
    }
    // normalize to two decimals
    account.balance = Math.round(account.balance * 100) / 100;
    return account;
  }

  function saveAccount() {
    try {
      const toWrite = { studentName: account.studentName, balance: Math.round(account.balance * 100) / 100 };
      fs.writeFileSync(DATA_FILE, JSON.stringify(toWrite, null, 2), 'utf8');
      return true;
    } catch (err) {
      return false;
    }
  }

  function formatBalance(b) {
    const rounded = Math.round(b * 100) / 100;
    const negative = rounded < 0;
    const abs = Math.abs(rounded);
    const intPart = Math.floor(abs);
    const frac = Math.round((abs - intPart) * 100);
    const intStr = String(intPart).padStart(6, '0');
    const fracStr = String(frac).padStart(2, '0');
    return (negative ? '-' : '') + intStr + '.' + fracStr;
  }

  function parseAmount(input) {
    const n = parseFloat(String(input).trim());
    if (Number.isNaN(n)) return 0.0;
    return Math.round(n * 100) / 100;
  }

  // Public helpers for programmatic use & testing
  function getBalance() {
    return Math.round(account.balance * 100) / 100;
  }

  function resetBalance() {
    account = { ...DEFAULT_ACCOUNT };
    saveAccount();
    return getBalance();
  }

  function creditAmount(amountRaw) {
    const amt = parseAmount(amountRaw);
    account.balance = Math.round((account.balance + amt) * 100) / 100;
    saveAccount();
    return { balance: getBalance(), amount: amt };
  }

  function debitAmount(amountRaw) {
    const amt = parseAmount(amountRaw);
    if (account.balance >= amt) {
      account.balance = Math.round((account.balance - amt) * 100) / 100;
      saveAccount();
      return { success: true, balance: getBalance(), amount: amt };
    }
    return { success: false, balance: getBalance(), amount: amt };
  }

  function showMenu() {
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');
  }

  async function prompt(question, rl) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });
  }

  async function runCli() {
    loadAccount();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
      showMenu();
      const choiceRaw = await prompt('Enter your choice (1-4): ', rl);
      const choice = parseInt(String(choiceRaw).trim(), 10);

      switch (choice) {
        case 1: // View Balance (TOTAL)
          console.log('Current balance: ' + formatBalance(account.balance));
          break;

        case 2: // Credit
          {
            const amtRaw = await prompt('Enter credit amount: ', rl);
            // credit functionality
            const res = creditAmount(amtRaw);
            console.log('Amount credited. New balance: ' + formatBalance(res.balance));
          }
          break;

        case 3: // Debit
          {
            const amtRaw = await prompt('Enter debit amount: ', rl);
            // debit functionality
            const res = debitAmount(amtRaw);
            if (res.success) {
              console.log('Amount debited. New balance: ' + formatBalance(res.balance));
            } else {
              console.log('Insufficient funds for this debit.');
            }
          }
          break;

        case 4: // Exit
          console.log('Exiting the program. Goodbye!');
          rl.close();
          return;

        default:
          console.log('Invalid choice, please select 1-4.');
          break;
      }
    }
  }

  if (require.main === module) {
    // Ensure account is loaded for CLI runs
    loadAccount();
    runCli();
  }

  module.exports = {
    formatBalance,
    parseAmount,
    getBalance,
    resetBalance,
    creditAmount,
    debitAmount,
    loadAccount,
    saveAccount
  };

if (require.main === module) {
  main();
}

module.exports = { formatBalance, parseAmount, getBalance, resetBalance, creditAmount, debitAmount };

