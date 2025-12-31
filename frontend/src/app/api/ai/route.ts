import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

// Check if API key is set
if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY is not set in environment variables");
}

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    // Check API key first
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: "GROQ_API_KEY is not configured. Please set it in your environment variables." 
      }, { status: 500 });
    }

    const {
      type,
      data,
      portfolioAlert,
      question,
      address,
      messageHistory = [],
    } = await req.json();

    // Validate required fields
    if (!question) {
      return NextResponse.json({ 
        error: "Question is required" 
      }, { status: 400 });
    }

    const prompt = createChatPrompt(data, portfolioAlert, question, address);

    const limitedHistory = messageHistory.slice(-10);

    const messages = [
      {
        role: "system",
        content: getSystemPrompt(),
      },
    ];

    if (limitedHistory && limitedHistory.length > 0) {
      limitedHistory.forEach((msg: { role: string; content: string }) => {
        messages.push({
          role: msg.role === "bot" ? "assistant" : "user",
          content: typeof msg.content === "string" ? msg.content : "User input",
        });
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2024,
      messages: messages as any,
      temperature: 0.7,
      tools: [
        {
          type: "function",
          function: {
            name: "transfer",
            description:
              "Transfer tokens from the user's wallet to another address",
            parameters: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "Recipient wallet address",
                },
                token1: {
                  type: "string",
                  description:
                    "Token symbol to transfer (e.g., TRBTC, DOC, RIF)",
                },
                amount: {
                  type: "number",
                  description: "Amount of tokens to transfer",
                },
              },
              required: ["address", "token1", "amount"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "balance",
            description: "Check token balance for an address. If no token is specified, checks tRBTC (native token) balance.",
            parameters: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description:
                    "Wallet address to check balance for. If not provided, checks the user's own wallet balance.",
                },
                token1: {
                  type: "string",
                  description:
                    "Token symbol to check balance for (e.g., tRBTC, DOC, RIF). Defaults to tRBTC if not specified.",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "portfolio",
            description: "Get the user's DeFi portfolio data from the LendingPool including collateral, debt, health factor, and max borrowable amount",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const aiMessage = response.choices[0].message;
    const toolCalls = aiMessage.tool_calls;

    // Handle function calls if present
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      return NextResponse.json({
        analysis: aiMessage.content || "Processing your request...",
        type,
        functionCall: {
          name: functionName,
          arguments: functionArgs,
        },
      });
    }

    // Regular response without function calls
    return NextResponse.json({
      analysis: aiMessage.content,
      type,
    });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const errorDetails = error?.response?.data || error?.error || null;
    
    return NextResponse.json({ 
      error: "Analysis failed",
      details: errorMessage,
      ...(errorDetails && { apiError: errorDetails })
    }, { status: 500 });
  }
}

function getSystemPrompt() {
  return `You are Rootstock AI Agent, a personal DeFi assistant for the Rootstock testnet ecosystem.
  
  IMPORTANT TESTNET DETAILS:
  - We are operating on Rootstock TESTNET, not mainnet
  - The native token is TRBTC (Testnet RBTC), not RBTC
  - Always use TRBTC when referring to the native token
  - All balances and transactions are using testnet tokens with no real value
  
  RESPONSE GUIDELINES:
  - Be extremely concise - no more than 2 short paragraphs total
  - Be conversational and professional - like a financial advisor
  - Always provide a personalized response that directly addresses the query
  - If portfolio is empty, briefly suggest 1-2 Rootstock options
  
  FORMATTING:
  - Keep responses under 300 characters whenever possible
  - Use bold (**text**) for important terms
  - No lists, no lengthy explanations
  - One short greeting line, then 1-2 concise sentences for the answer
  
  CONTENT:
  - Rootstock testnet ecosystem: TRBTC (native), tRIF, tDOC, etc.
  - For transfers/balances: respond naturally without mentioning functions
  - For strategies: give only brief, specific insights
  
  BE EXTREMELY BRIEF. Your responses should be scannable in 5 seconds or less.`;
}

function createChatPrompt(userContext: any, portfolioAlert: string | null, question: string, address: string) {
  const portfolioSection = userContext 
    ? `My portfolio data from the LendingPool contract:
- Collateral (tRBTC): ${userContext.collateralRBTC}
- Debt (USDT0): ${userContext.debtUSDT0}
- Collateral Value (USD): $${userContext.collateralUSD}
- Debt Value (USD): $${userContext.debtUSD}
- Max Borrowable (USD): $${userContext.maxBorrowableUSD}
- Health Factor: ${userContext.healthFactor >= 999999 ? "∞ (No Debt)" : userContext.healthFactor.toFixed(2)}
- Position Status: ${userContext.isHealthy ? (userContext.isAtRisk ? "Healthy but at risk" : "Healthy") : "UNHEALTHY - At risk of liquidation"}
- Has Active Position: ${userContext.hasPosition ? "Yes" : "No"}`
    : "I don't have any portfolio data yet (no position in the LendingPool).";

  const alertSection = portfolioAlert 
    ? `\n\n⚠️ PROACTIVE ALERT: ${portfolioAlert}`
    : "";
  
  return `I need your help with the following DeFi request for my Rootstock testnet wallet${address ? ` (${address})` : ''}:
  
  USER QUESTION: "${question}"
  
  ${portfolioSection}${alertSection}
  
  IMPORTANT: We are on the TESTNET environment. The native token is tRBTC (not RBTC). All tokens are testnet versions (tRBTC, tRIF, tDOC) with no real value.
  
  Please provide a helpful, personalized response that directly addresses my question. 
  
  - If I ask about my wallet address, tell me: ${address || "No wallet connected"}
  - If I'm asking about sending tokens or checking balances, please handle that appropriately using the available functions
  - If my portfolio is empty, don't just tell me I have no tokens - suggest what I could explore in the Rootstock testnet ecosystem
  - Answer simple questions directly and conversationally

  When I ask to send RBTC, you should interpret this as tRBTC (testnet RBTC). Always use tRBTC in your function calls and responses.

  If needed, you can USE FUNCTIONS like **transfer**, **balance**, or **portfolio** to help me with my request. 
  - WHENEVER ASKED TO SEND TOKENS, PLEASE USE THE **transfer** FUNCTION
  - WHENEVER ASKED TO CHECK BALANCES, PLEASE USE THE **balance** FUNCTION
  - WHENEVER ASKED ABOUT PORTFOLIO, LENDING POSITION, COLLATERAL, DEBT, HEALTH FACTOR, OR BORROWING CAPACITY, PLEASE USE THE **portfolio** FUNCTION
  
  Be conversational and friendly - like a professional financial advisor would be, not like a generic chatbot. Avoid technical language about functions or API calls - speak to me naturally about my options.`;
}



