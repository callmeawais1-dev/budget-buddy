import express from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import "dotenv/config";

import { addExpense, getExpenses, setBudget, getBudgets } from "./src/storage.js";
import { categorizeExpense, generateSummary } from "./src/bedrock.js";

function createServer() {
  const server = new McpServer({ name: "budget-buddy", version: "1.0.0" });

  server.tool(
    "log_expense",
    "Log a new expense. The assistant will categorize it automatically using AI.",
    {
      amount: z.number().describe("The amount spent, e.g. 15.50"),
      description: z.string().describe("What the expense was for, e.g. 'lunch at cafe'"),
    },
    async ({ amount, description }) => {
      const category = await categorizeExpense(description);
      addExpense({ amount, description, category });
      return {
        content: [
          { type: "text", text: `Logged $${amount} for "${description}" under ${category}.` },
        ],
      };
    }
  );

  server.tool(
    "set_budget",
    "Set a monthly budget for a category, e.g. Food or Transport.",
    {
      category: z.string().describe("Budget category, e.g. 'Food'"),
      amount: z.number().describe("Monthly budget amount"),
    },
    async ({ category, amount }) => {
      setBudget(category, amount);
      return {
        content: [{ type: "text", text: `Budget for ${category} set to $${amount}.` }],
      };
    }
  );

  server.tool(
    "get_summary",
    "Get a spoken summary of spending versus budgets so far.",
    {},
    async () => {
      const expenses = getExpenses();
      const budgets = getBudgets();
      const summary = await generateSummary(expenses, budgets);
      return { content: [{ type: "text", text: summary }] };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Budget Buddy MCP server running on port ${PORT}`);
});
