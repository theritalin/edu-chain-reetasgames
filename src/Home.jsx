import React, { useState, useEffect, Suspense, useContext } from "react";
import { ChevronRight, Coins, Dice5, LayoutGrid, Wallet } from "lucide-react";
import "./Home.css";
import WalletInfo from "./WalletInfo";
import MathGame from "./math/App";
import { WalletContext } from "./WalletContext"; // WalletContext'i içe aktar
import Game3 from "./game3/App";
import Game2 from "./game2/App";

//************************METAMASK
window.onunhandledrejection = function (event) {
  console.error("Yakalanmamış bir Promise reddi:", event.reason);

  return true;
};
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Bir hata yakalandı:", message, source, lineno, colno, error);

  return true;
};

const networks = {
  REETA: {
    chainId: "656476",
    chainName: "EDU Chain Testnet",
    nativeCurrency: {
      name: "EDU",
      symbol: "EDU",
      decimals: 18,
    },
    rpcUrls: ["https://open-campus-codex-sepolia.drpc.org"],
    blockExplorerUrls: [""],
  },
};

//************************BUTTON
const Button = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded ${className}`}>
    {children}
  </button>
);

const Card = ({ children, className }) => (
  <div className={`rounded-lg shadow-lg ${className}`}>{children}</div>
);

const CardContent = ({ children, className }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Home = () => {
  const [notification, setNotification] = useState("");
  const [selectedGame, setSelectedGame] = useState(null); // Add this line
  const { account, isConnected, connectWallet, provider } =
    useContext(WalletContext);
  //************************METAMASK

  const switchNetwork = async () => {
    if (account.length > 0) {
      try {
        await changeNetwork("EDU Chain Testnet");
        setNotification("Network switched successfully.");
      } catch (error) {
        console.error("Failed to switch network:", error);
        setNotification("Failed to switch network: " + error.message);
      }
    } else {
      console.log("Wallet not connected.");
      setNotification("Please connect your wallet first.");
    }
  };
  const changeNetwork = async (networkName) => {
    if (!window.ethereum) throw new Error("No crypto wallet found");
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{ ...networks[networkName] }],
    });
  };
  const clearNotification = () => {
    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const getNetworkName = async () => {
    if (account) {
      try {
        const network = await provider.getNetwork(); // Get network using ethers.js

        if (network.chainId === 97) {
          // Check if connected to REETA Testnet (chainId 97 is BSC Testnet)
          setNotification("Connected to REETA Testnet");
        } else {
          setNotification(
            "Not connected to REETA Testnet. Switching network..."
          );
          await switchNetwork(); // Call your function to switch network
        }
      } catch (error) {
        console.error("Error getting network:", error);
        setNotification("Error getting network: " + error.message);
      }
    } else {
      setNotification("Ethers not initialized. Please connect your wallet.");
    }
  };

  useEffect(() => {
    if (isConnected) {
      getNetworkName();
    }
  }, [isConnected]);

  useEffect(() => {
    if (notification) {
      clearNotification();
    }
  }, [notification]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-6">Reeta's Games v1.1</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="flex items-center p-2 rounded-lg hover:bg-gray-700"
                onClick={() => setSelectedGame("math")} // Add this line
              >
                <LayoutGrid className="mr-3" />
                Math Challenge
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center p-2 rounded-lg hover:bg-gray-700"
                onClick={() => setSelectedGame("game2")} // Add this line
              >
                <Dice5 className="mr-3" />
                Game 2
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center p-2 rounded-lg hover:bg-gray-700"
                onClick={() => setSelectedGame("game3")} // Add this line
              >
                <Coins className="mr-3" />
                Game 3
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reeta's Crypto Games</h1>
 

          <Button
            onClick={isConnected ? null : connectWallet}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 transform hover:scale-105 transition-all duration-200"
          >
            {isConnected ? (
              ((
                <span className="flex items-center">
                  <Wallet className="mr-2" />
                  Connected
                </span>
              ),
              (<WalletInfo />))
            ) : (
              <span className="flex items-center">
                <Wallet className="mr-2" />
                Connect MetaMask
              </span>
            )}
          </Button>
        </header>

        {/* Game Content */}
        <div className="flex-1 p-6 bg-opacity-50 bg-gray-800 bg-pattern">
          {selectedGame ? (
            <Card className="bg-green-800 h-full">
              <CardContent className="h-full">
                <Suspense fallback={<div>Loading...</div>}>
                  {selectedGame === "game2" && <Game2 />}
                  {selectedGame === "math" && <MathGame />}
                  {selectedGame === "game3" && <Game3 />}
                </Suspense>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-green-80 h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Welcome to Reeta's Games!
                  </h2>
                  <p className="text-xl mb-6">
                    Math Game Rules
                    <ul>
                      <li>
                        1. Find target number with given numbers and operations
                      </li>
                      <li>
                        2. When done,approve transaction and get 0.2 REETA
                      </li>
                    </ul>
                    Dice Game Rules
                    <ul>
                      <li>1. Roll the dice and get 0.2 REETA if win</li>
                    </ul>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Game Table */}
      </div>
    </div>
  );
};

export default Home;
