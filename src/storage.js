import fs from "fs";
import path from "path";

// Simple file-based storage so the project runs with zero setup.
// Swap this out for DynamoDB later without changing index.js.
const DATA_FILE = path.join(process.cwd(), "data", "expenses.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ expenses: [], budgets: {} }, null, 2)
    );
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function addExpense({ amount, description, category }) {
  const data = readData();
  const expense = {
    id: Date.now().toString(),
    amount,
    description,
    category,
    date: new Date().toISOString(),
  };
  data.expenses.push(expense);
  writeData(data);
  return expense;
}

export function getExpenses({ since } = {}) {
  const data = readData();
  if (!since) return data.expenses;
  return data.expenses.filter((e) => new Date(e.date) >= new Date(since));
}

export function setBudget(category, amount) {
  const data = readData();
  data.budgets[category] = amount;
  writeData(data);
}

export function getBudgets() {
  return readData().budgets;
}
