import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import "./Home.css";
import { WalletContext } from "./WalletContext"; // WalletContext'i içe aktar

function WalletInfo() {
  const [balance, setBalance] = useState("");
  const { account, provider } = useContext(WalletContext);

  const loadWalletData = async () => {
    if (window.ethereum) {
      try {
        if (account) {
          const balance = await provider.getBalance(account); // Cüzdan bakiyesini alıyoruz

          setBalance(ethers.utils.formatEther(balance)); // Wei'yi Ether'e çeviriyoruz
        } else {
          setBalance("0.0000");
        }
      } catch (error) {
        console.error("Error loading wallet data:", error);

        setBalance("0.0000");
      }
    }
  };

  useEffect(() => {
    loadWalletData();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setBalance("0.0000");
      } else {
        loadWalletData();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", loadWalletData);

    const balanceInterval = setInterval(() => {
      loadWalletData();
    }, 1000);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", loadWalletData);
      }
      clearInterval(balanceInterval);
    };
  }, []);

  const formattedBalance = balance ? parseFloat(balance).toFixed(4) : "0.0000";

  return (
    <div className={`px-4 py-2 rounded`}>
      <p>Address: {account}</p>
      <p>{formattedBalance} EDU</p>
    </div>
  );
}

export default WalletInfo;
