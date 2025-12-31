"use client";

// TypeScript declaration for window.ethereum (MetaMask)
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

import { ConnectButton } from "@/components/ConnectButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Loader2, Send, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useConfig, useAccount, useChainId, useSwitchChain, useConnections } from "wagmi";
import {
  getBalance,
  getChainId,
  readContract,
  sendTransaction,
  writeContract,
} from "@wagmi/core";
import { checksumAddress, erc20Abi, isAddress, parseEther } from "viem";
import { findToken, isValidWalletAddress } from "@/lib/utils";
import { BLOCK_EXPLORER_URL } from "@/lib/contants";
import { rootstockTestnet } from "@/config/chains";
import { fetchPortfolioData, type PortfolioData } from "@/lib/portfolio";

export default function Home() {
  const [messages, setMessages] = useState<
    { role: string; content: React.ReactNode }[]
  >([
    {
      role: "agent",
      content:
        "Hello! I can help you interact with the Rootstock testnet. What would you like to do?",
    },
  ]);

  const { address, isConnected } = useAppKitAccount();
  const { address: wagmiAddress, connector } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const { switchChain } = useSwitchChain();
  const connections = useConnections();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to get actual chain from MetaMask (not wagmi's cached state)
  const getMetaMaskChainId = async (): Promise<number> => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        return parseInt(chainIdHex as string, 16);
      } catch (e) {
        console.error("Failed to get chain from MetaMask:", e);
      }
    }
    return getChainId(config);
  };

  const ensureRootstockTestnet = async (): Promise<void> => {
    // Get the ACTUAL chain from MetaMask, not wagmi's cached state
    let actualChainId = await getMetaMaskChainId();
    console.log(`📍 Actual MetaMask chain ID: ${actualChainId}, Required: ${rootstockTestnet.id}`);
    
    if (actualChainId === rootstockTestnet.id) {
      console.log("✅ Already on Rootstock Testnet");
      return;
    }

    const networkName = actualChainId === 11155111 ? "Sepolia" : `Chain ${actualChainId}`;
    console.log(`🚨 MetaMask is on ${networkName} (${actualChainId}), switching to Rootstock Testnet...`);

    // Use window.ethereum directly to switch/add network
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // First, try to switch to Rootstock Testnet
        console.log("Requesting network switch via MetaMask...");
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${rootstockTestnet.id.toString(16)}` }], // 0x1f = 31
        });
        
        // Verify the switch worked
        await new Promise(resolve => setTimeout(resolve, 1000));
        actualChainId = await getMetaMaskChainId();
        
        if (actualChainId === rootstockTestnet.id) {
          console.log("✅ Successfully switched to Rootstock Testnet!");
          return;
        }
      } catch (switchError: any) {
        // Error 4902 means the chain is not added to MetaMask
        if (switchError.code === 4902) {
          console.log("Rootstock Testnet not found in MetaMask, adding it...");
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${rootstockTestnet.id.toString(16)}`, // 0x1f = 31
                chainName: rootstockTestnet.name,
                nativeCurrency: {
                  name: rootstockTestnet.nativeCurrency.name,
                  symbol: rootstockTestnet.nativeCurrency.symbol,
                  decimals: rootstockTestnet.nativeCurrency.decimals,
                },
                rpcUrls: rootstockTestnet.rpcUrls.default.http,
                blockExplorerUrls: [rootstockTestnet.blockExplorers.default.url],
              }],
            });
            
            // After adding, verify we're on the right chain
            await new Promise(resolve => setTimeout(resolve, 1000));
            actualChainId = await getMetaMaskChainId();
            
            if (actualChainId === rootstockTestnet.id) {
              console.log("✅ Added and switched to Rootstock Testnet!");
              return;
            }
          } catch (addError: any) {
            if (addError.code === 4001) {
              throw new Error(
                `🚨 You REJECTED adding Rootstock Testnet!\n\n` +
                `You must approve adding the network to send tRBTC.\n\n` +
                `Please try again and click "Approve" when MetaMask asks to add Rootstock Testnet.`
              );
            }
            throw new Error(
              `🚨 Failed to add Rootstock Testnet to MetaMask: ${addError.message}\n\n` +
              `Please add it manually:\n` +
              `• Network Name: ${rootstockTestnet.name}\n` +
              `• RPC URL: ${rootstockTestnet.rpcUrls.default.http[0]}\n` +
              `• Chain ID: ${rootstockTestnet.id}\n` +
              `• Currency Symbol: ${rootstockTestnet.nativeCurrency.symbol}`
            );
          }
        } else if (switchError.code === 4001) {
          throw new Error(
            `🚨 You REJECTED switching to Rootstock Testnet!\n\n` +
            `❌ CANNOT send tRBTC while on ${networkName}!\n\n` +
            `You MUST approve the network switch to send tRBTC.\n` +
            `Please try again and click "Switch network" when prompted.`
          );
        } else {
          throw new Error(
            `🚨 Failed to switch network: ${switchError.message}\n\n` +
            `Please manually switch to Rootstock Testnet in MetaMask.`
          );
        }
      }
    }
    
    // Final check - if still wrong network, block the transaction
    actualChainId = await getMetaMaskChainId();
    if (actualChainId !== rootstockTestnet.id) {
      throw new Error(
        `🚨🚨🚨 STILL ON WRONG NETWORK! 🚨🚨🚨\n\n` +
        `MetaMask is on ${actualChainId === 11155111 ? "Sepolia" : `Chain ${actualChainId}`} (ID: ${actualChainId})\n\n` +
        `❌ Transaction will show "Sepolia ETH" instead of "tRBTC" on wrong network!\n\n` +
        `MANUAL FIX REQUIRED:\n` +
        `1. Open MetaMask extension\n` +
        `2. Click the network dropdown at the TOP of MetaMask\n` +
        `3. Select "Rootstock Testnet"\n` +
        `4. If not listed, click "Add Network" and enter:\n` +
        `   • Network Name: Rootstock Testnet\n` +
        `   • RPC URL: ${rootstockTestnet.rpcUrls.default.http[0]}\n` +
        `   • Chain ID: ${rootstockTestnet.id}\n` +
        `   • Currency Symbol: tRBTC\n` +
        `5. Then try sending again`
      );
    }
  };

  const handleTransfer = async (data: {
    token1: string;
    address: string;
    amount: number;
  }) => {
    console.log("Data:", data);
    try {
      // Ensure we're on Rootstock testnet before proceeding
      await ensureRootstockTestnet();

      const tokenAddress =
        data.token1.toLowerCase() === "trbtc"
          ? "trbtc"
          : await findToken(data.token1);

      if (!tokenAddress) throw new Error("Token not found");

      // ABSOLUTE FINAL CHECK - Get chain directly from MetaMask
      const finalChainId = await getMetaMaskChainId();
      console.log(`🔍 FINAL CHECK (from MetaMask): Chain ID ${finalChainId}, required: ${rootstockTestnet.id}`);
      
      if (finalChainId !== rootstockTestnet.id) {
        const currentNetwork = finalChainId === 11155111 ? "Sepolia" : `Chain ${finalChainId}`;
        console.error(`🚨 BLOCKING TRANSACTION: MetaMask is on ${currentNetwork}, need Rootstock Testnet`);
        throw new Error(
          `🚨🚨🚨 TRANSACTION BLOCKED 🚨🚨🚨\n\n` +
          `MetaMask is STILL on ${currentNetwork} (Chain ID: ${finalChainId})\n\n` +
          `❌ This is why you see "Sepolia ETH" instead of "tRBTC"!\n\n` +
          `The transaction REQUIRES Rootstock Testnet (Chain ID: ${rootstockTestnet.id})\n\n` +
          `FIX:\n` +
          `1. Open MetaMask\n` +
          `2. Click network dropdown at TOP\n` +
          `3. Switch to "Rootstock Testnet"\n` +
          `4. Then try again`
        );
      }
      
      console.log(`✅ MetaMask confirmed on Rootstock Testnet (${finalChainId}), sending transaction...`);

      let transactionHash: string;
      if (tokenAddress === "trbtc") {
        // Get the account from wagmi
        const account = wagmiAddress || address;
        if (!account) {
          throw new Error("No account connected");
        }
        
        transactionHash = await sendTransaction(config, {
          account: account as `0x${string}`,
          to: data.address as `0x${string}`,
          value: parseEther(data.amount.toString()),
        });
      } else {
        transactionHash = await writeContract(config, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "transfer",
          args: [data.address as `0x${string}`, BigInt(data.amount)],
        });
      }

      return transactionHash;
    } catch (error) {
      console.error("Transfer failed:", error);
      throw error;
    }
  };

  const handleBalance = async (data: any) => {
    try {
      // Ensure we're on Rootstock testnet before checking balance
      await ensureRootstockTestnet();

      // Default to tRBTC if no token specified
      const tokenSymbol = data.token1?.toLowerCase() || "trbtc";
      
      const tokenAdd =
        tokenSymbol === "trbtc"
          ? "trbtc"
          : await findToken(tokenSymbol);

      if (!tokenAdd && tokenSymbol !== "trbtc") {
        throw new Error(`Token "${data.token1 || tokenSymbol}" not found`);
      }

      // Use provided address or default to user's address
      const acc = (data.address && isAddress(data.address)) ? data.address : address;
      
      if (!acc) {
        throw new Error("No address provided and wallet not connected");
      }

      let balance;

      if (tokenAdd === "trbtc") {
        const queryBalance = await getBalance(config, {
          address: acc,
        });

        balance = {
          displayValue: Number(queryBalance.value) / 1e18,
          symbol: "tRBTC",
        };
      } else {
        const queryBalance = await readContract(config, {
          abi: erc20Abi,
          address: checksumAddress(tokenAdd as `0x${string}`) as `0x${string}`,
          functionName: "balanceOf",
          args: [acc],
        });
        balance = {
          displayValue: Number(queryBalance) / 1e18,
          symbol: tokenSymbol.toUpperCase(),
        };
      }

      return balance;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      throw error;
    }
  };

  const handlePortfolio = async () => {
    try {
      // Ensure we're on Rootstock testnet
      await ensureRootstockTestnet();

      const account = wagmiAddress || address;
      if (!account) {
        throw new Error("No account connected");
      }

      const actualChainId = await getMetaMaskChainId();
      const portfolioData = await fetchPortfolioData(
        config,
        account as `0x${string}`,
        actualChainId
      );

      if (!portfolioData) {
        throw new Error("Failed to fetch portfolio data");
      }

      return portfolioData;
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setInput("");
    setIsLoading(true);

    const processingMessage = {
      role: "bot" as const,
      content: "Processing your request...",
    };

    const newMessages = [...messages, userMessage, processingMessage];

    if (!isConnected) {
      setMessages([
        ...newMessages.slice(0, -1),
        {
          role: "bot",
          content: "Please connect your wallet to perform this action.",
        },
      ]);
      setIsLoading(false);
      return;
    }

    setMessages(newMessages);

    try {
      // Fetch portfolio data if wallet is connected
      let portfolioData: PortfolioData | null = null;
      let portfolioAlert: string | null = null;
      
      if (isConnected && address) {
        try {
          const actualChainId = await getMetaMaskChainId();
          if (actualChainId === rootstockTestnet.id) {
            portfolioData = await fetchPortfolioData(
              config,
              address as `0x${string}`,
              actualChainId
            );
            
            // Generate proactive alerts based on portfolio health
            if (portfolioData && portfolioData.hasPosition) {
              if (!portfolioData.isHealthy) {
                portfolioAlert = "🚨 CRITICAL: Your health factor is below 1.0! Your position is at risk of liquidation. Consider adding collateral or repaying debt immediately.";
              } else if (portfolioData.isAtRisk) {
                portfolioAlert = "⚠️ WARNING: Your health factor is below 1.5. Your position is approaching risk levels. Consider adding more collateral or reducing debt.";
              }
            }
          }
        } catch (error) {
          console.log("Could not fetch portfolio data:", error);
          // Continue without portfolio data
        }
      }

      // Extract text-only message history for API
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === "string"
            ? msg.content
            : "Content not available as string",
      }));

      // Process all requests through the AI endpoint
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          data: portfolioData, // Send portfolio data to AI
          portfolioAlert: portfolioAlert, // Send any proactive alerts
          question: input,
          address: address || "",
          messageHistory: messageHistory,
        }),
      });

      const data = await response.json();

      console.log("AI response:", data);

      // Check for errors
      if (data.error) {
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error;
        throw new Error(errorMsg);
      }

      if (data?.functionCall) {
        const functionData = data.functionCall;

        switch (functionData.name) {
          case "transfer":
            if (!isValidWalletAddress(functionData?.arguments?.address)) {
              throw new Error("Invalid wallet address");
            }
            
            // Check if we need to switch networks and inform the user
            const currentChain = getChainId(config);
            if (currentChain !== rootstockTestnet.id) {
              setMessages([
                ...newMessages.slice(0, -1),
                {
                  role: "bot",
                  content: `⚠️ Switching to Rootstock Testnet... Please approve the network switch prompt in MetaMask to send tRBTC (not Sepolia ETH).`,
                },
              ]);
            }
            
            const transactionHash = await handleTransfer(
              functionData.arguments
            );
            setMessages([
              ...newMessages.slice(0, -1),
              {
                role: "bot",
                content: (
                  <a
                    href={`${BLOCK_EXPLORER_URL}${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    Transaction:{" "}
                    {`${transactionHash.slice(0, 6)}...${transactionHash.slice(
                      -4
                    )}`}
                    <ExternalLink size={16} />
                  </a>
                ),
              },
            ]);
            break;

          case "balance":
            const balance = await handleBalance(functionData.arguments);
            setMessages([
              ...newMessages.slice(0, -1),
              {
                role: "bot",
                content: (
                  <div className="w-full">
                    <div className="mt-2">
                      Balance: {balance.displayValue} {balance.symbol}
                    </div>
                  </div>
                ),
              },
            ]);
            break;

          case "portfolio":
            const portfolio = await handlePortfolio();
            
            // Show helpful message if portfolio is empty
            if (!portfolio.hasPosition) {
              setMessages([
                ...newMessages.slice(0, -1),
                {
                  role: "bot",
                  content: (
                    <div className="w-full space-y-3">
                      <div className="font-semibold text-lg mb-3">📊 Your Portfolio</div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg border-2 border-dashed">
                        <div className="text-center space-y-2">
                          <div className="text-2xl mb-2">📭</div>
                          <div className="font-semibold">No Active Position</div>
                          <div className="text-sm text-muted-foreground">
                            You don't have any collateral deposited or debt yet.
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Collateral (tRBTC)</div>
                          <div className="text-lg font-semibold">0</div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Debt (USDT0)</div>
                          <div className="text-lg font-semibold">0</div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Collateral Value (USD)</div>
                          <div className="text-lg font-semibold">$0</div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Debt Value (USD)</div>
                          <div className="text-lg font-semibold">$0</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Max Borrowable:</span>
                          <span className="font-semibold">$0</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Health Factor:</span>
                          <span className="font-semibold text-green-500">∞ (No Debt)</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="text-sm font-semibold mb-1">💡 Get Started:</div>
                        <div className="text-xs text-muted-foreground">
                          To start using the lending pool, deposit tRBTC as collateral. Once you have collateral, you can borrow USDT0 against it. Ask me to "deposit tRBTC" when ready!
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]);
            } else {
              setMessages([
                ...newMessages.slice(0, -1),
                {
                  role: "bot",
                  content: (
                    <div className="w-full space-y-2">
                      <div className="font-semibold text-lg mb-3">📊 Your Portfolio</div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Collateral (tRBTC)</div>
                          <div className="text-lg font-semibold">{portfolio.collateralRBTC}</div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Debt (USDT0)</div>
                          <div className="text-lg font-semibold">{portfolio.debtUSDT0}</div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Collateral Value (USD)</div>
                          <div className="text-lg font-semibold">${portfolio.collateralUSD}</div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground">Debt Value (USD)</div>
                          <div className="text-lg font-semibold">${portfolio.debtUSD}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Max Borrowable:</span>
                          <span className="font-semibold">${portfolio.maxBorrowableUSD}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Health Factor:</span>
                          <span className={`font-semibold ${
                            portfolio.healthFactor >= 999999 
                              ? "text-green-500" 
                              : portfolio.isHealthy 
                                ? portfolio.isAtRisk 
                                  ? "text-yellow-500" 
                                  : "text-green-500"
                                : "text-red-500"
                          }`}>
                            {portfolio.healthFactor >= 999999 
                              ? "∞ (No Debt)" 
                              : portfolio.healthFactor.toFixed(2)}
                          </span>
                        </div>
                        
                        {portfolio.healthFactor < 999999 && (
                          <div className={`text-xs p-2 rounded ${
                            portfolio.isHealthy 
                              ? portfolio.isAtRisk 
                                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" 
                                : "bg-green-500/20 text-green-700 dark:text-green-400"
                              : "bg-red-500/20 text-red-700 dark:text-red-400"
                          }`}>
                            {portfolio.isHealthy 
                              ? portfolio.isAtRisk 
                                ? "⚠️ Your position is healthy but at risk. Consider reducing debt or adding collateral."
                                : "✅ Your position is healthy."
                              : "🚨 Your position is at risk! Health factor below 1.0. Add collateral or repay debt immediately."}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
              ]);
            }
            break;

          default:
            setMessages([
              ...newMessages.slice(0, -1),
              {
                role: "bot",
                content: (
                  <div className="markdown-content space-y-4">
                    <ReactMarkdown>
                      {data.analysis ||
                        "No information available for this query."}
                    </ReactMarkdown>
                  </div>
                ),
              },
            ]);
        }
      } else {
        // Regular AI response (strategy or information)
        setMessages([
          ...newMessages.slice(0, -1),
          {
            role: "bot",
            content: (
              <div className="markdown-content space-y-4">
                <ReactMarkdown>
                  {data.analysis || "No information available for this query."}
                </ReactMarkdown>
              </div>
            ),
          },
        ]);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 
                          (error?.response?.data?.error || error?.response?.data?.details) ||
                          "Operation failed";
      
      setMessages([
        ...newMessages.slice(0, -1),
        {
          role: "bot",
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main
      style={{
        backgroundImage: "url(/img/bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="flex min-h-screen flex-col items-center justify-between"
    >
      <div className="w-full max-w-4xl grow flex flex-col items-center justify-around gap-6 px-4">
        <Image
          src={"/img/rsk.png"}
          alt="Rootstock Logo"
          width={300}
          height={100}
          priority
        />
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rootstock AI Agent</CardTitle>
            <ConnectButton />
          </CardHeader>
          <CardContent>
            <div
              className="space-y-4 mb-4 h-[400px] overflow-y-auto p-2 border rounded-md"
              ref={containerRef}
            >
              {messages.map(({ role, content }, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask about Rootstock or perform actions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  );
}
