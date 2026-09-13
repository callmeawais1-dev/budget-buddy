import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import "dotenv/config";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";

async function converse(prompt) {
  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  });
  const response = await client.send(command);
  return response.output.message.content[0].text.trim();
}

export async function categorizeExpense(description) {
  const prompt = `Categorize this expense into ONE word from this list: Food, Transport, Shopping, Entertainment, Bills, Health, Other.
Expense: "${description}"
Respond with only the category word, nothing else.`;
  const category = await converse(prompt);
  return category.replace(/[^a-zA-Z]/g, "");
}

export async function generateSummary(expenses, budgets) {
  const totalsByCategory = {};
  for (const e of expenses) {
    totalsByCategory[e.category] = (totalsByCategory[e.category] || 0) + e.amount;
  }

  const prompt = `You are a friendly budget assistant speaking to the user out loud.
Spending by category: ${JSON.stringify(totalsByCategory)}.
Budgets by category: ${JSON.stringify(budgets)}.
Give a short, encouraging, 2-3 sentence spoken summary of how they're doing against their budgets. Mention any category that's over or close to budget.`;

  return converse(prompt);
}
