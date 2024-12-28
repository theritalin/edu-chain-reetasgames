import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

import Math from "./config/Math.json";
import { providers } from "web3";

// Context oluşturma
export const WalletContext = createContext();

// Provider bileşeni
export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);

  const [mathContract, setMathContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const contractAddressMath = Math.contractAddress;
  const abiMath = Math.contractABI;

  useEffect(() => {
    console.log("WalletContext çalıştı");
    const initialize = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();

          const mathcontractInstance = new ethers.Contract(
            contractAddressMath,
            abiMath,
            signer
          );

          setMathContract(mathcontractInstance);
          setSigner(signer);
          setAccount(userAddress);
          await setIsConnected(true);
          setProvider(provider);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      }
    };

    initialize();
  }, []);

  // Cüzdanı bağlamak için fonksiyon
  const connectWallet = async () => {
    console.log(`Window eth: ${window.ethereum}`);

    try {
      // Check if window.ethereum is available
      if (typeof window.ethereum !== "undefined") {
        // Request account access if necessary
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // Create an instance of Web3Provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // Get the signer
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();

        const mathcontractInstance = new ethers.Contract(
          contractAddressMath,
          abiMath,
          signer
        );

        // Set states

        setMathContract(mathcontractInstance);
        setSigner(signer);
        setAccount(userAddress);
        setIsConnected(true);
        setProvider(provider);
      } else {
        console.error("MetaMask is not installed!");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  // Disconnect wallet function

  return (
    <WalletContext.Provider
      value={{
        account,

        signer,
        isConnected,
        connectWallet,
        provider,
        mathContract,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
