import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Heading, VStack } from "@chakra-ui/react";
import { Progress } from "@chakra-ui/react";
import { Sparkles, Clock, Target } from "lucide-react";
import { WalletContext } from "../WalletContext"; // WalletContext'i içe aktar
import { ethers } from "ethers";

const generateRandomNumbers = () => {
  const smallNumbers = Array.from(
    { length: 5 },
    () => Math.floor(Math.random() * 9) + 1
  );
  const largeNumber = Math.floor(Math.random() * 90) + 10;
  return [...smallNumbers, largeNumber];
};

const generateTargetNumber = () => Math.floor(Math.random() * 900) + 100;

const OPERATIONS = ["+", "-", "×", "÷"];

export default function MathGame() {
  const [targetNumber, setTargetNumber] = useState(generateTargetNumber());
  const [initialNumbers, setInitialNumbers] = useState(generateRandomNumbers());
  const [numbers, setNumbers] = useState([...initialNumbers]);
  const [currentCalculation, setCurrentCalculation] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [timer, setTimer] = useState(120); // 3 minutes
  const [gameOver, setGameOver] = useState(true);
  const [payout, setPayout] = useState(0);
  const { account, mathContract } = useContext(WalletContext);
  const [gameState, setGameState] = useState({
    targetNumber: 0,
    numbers: [],
    currentCalculation: [],
    timer: 180,
    gameOver: true,
    payout: 0,
    error: "",
    isLoading: false,
  });

  useEffect(() => {
    let interval;
    if (!gameState.gameOver && gameState.timer > 0) {
      interval = setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          timer: prev.timer - 1,
          gameOver: prev.timer <= 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.gameOver, gameState.timer]);

  const handleNumberClick = (num, index) => {
    setCurrentCalculation([...currentCalculation, num]);
    setNumbers(numbers.filter((_, i) => i !== index));
  };

  const handleOperationClick = (op) => {
    setCurrentCalculation([...currentCalculation, op]);
  };

  const handleCalculationItemClick = (index) => {
    const item = currentCalculation[index];
    setCurrentCalculation(currentCalculation.filter((_, i) => i !== index));
    if (typeof item === "number") {
      setNumbers([...numbers, item]);
    }
  };

  const calculateResult = async () => {
    if (!gameOver) {
      const calculation = currentCalculation
        .join(" ")
        .replace("×", "*")
        .replace("÷", "/");
      try {
        const result = eval(calculation);
        if (result === targetNumber) {
          // Player wins, payout is double the bet
          setPayout(0.002);

          await mathContract.checkResult(result, targetNumber, {
            from: account,
          });

          setGameOver(true);
        }

        setCalculations([
          ...calculations,
          {
            expression: currentCalculation.join(" "),
            result,
            numbers: currentCalculation.filter(
              (item) => typeof item === "number"
            ),
            usedCalculations: calculations.length,
          },
        ]);
        setNumbers([...numbers, result]);
        setCurrentCalculation([]);
      } catch (error) {
        console.error("Invalid calculation");
      }
    }
  };

  /*  const startGame = async () => {
    if (!account) {
      console.error("Contract or user address not available");
      return;
    }

    try {
      const tx = await mathContract.play({
        from: account,
        value: ethers.utils.parseEther("0.001", "ether"),
      });

      const result = await tx.wait();

      if (result) {
        const newInitialNumbers = generateRandomNumbers();
        setTargetNumber(generateTargetNumber());
        setInitialNumbers(newInitialNumbers);
        setNumbers(newInitialNumbers);
        setCurrentCalculation([]);
        setCalculations([]);
        setTimer(120);
        setGameOver(false);
        setPayout(0);

      }
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  }; */

  const startGame = async () => {
    if (!mathContract || gameState.isLoading) return;

    try {
      setGameState((prev) => ({ ...prev, isLoading: true, error: "" }));
      const tx = await mathContract.play({
        value: ethers.utils.parseEther("0.00001"),
      });
      await tx.wait();
    } catch (error) {
      setGameState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to start game",
      }));
    }
  };

  const resetGame = () => {
    setNumbers([...initialNumbers]);
    setCurrentCalculation([]);
    setCalculations([]);
  };

  const forceEndGame = async () => {
    try {
      await mathContract.forceEndGame(account, { from: account });
    } catch (error) {}
  };

  const withdraw = async () => {
    try {
      await mathContract.withdraw({ from: account });
    } catch (error) {}
  };

  const Faucet = async () => {
    try {
      await mathContract.useFaucet({ from: account });
    } catch (error) {}
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 p-4">
      <Box className="w-full max-w-md bg-white/10 backdrop-blur-md border-none text-white">
        <VStack className="space-y-1">
          <div className="flex justify-between mt-4">
            <Heading className="text-2xl font-bold text-center">
              Math Challenge
            </Heading>
            <Button onClick={Faucet}>Faucet</Button>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-yellow-400" />
              <span className="text-xl font-semibold">{targetNumber}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-400" />
              <span className="text-xl font-semibold">
                {Math.floor(timer / 60)}:
                {(timer % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
          <Progress value={(timer / 180) * 100} className="h-2 bg-gray-600" />
        </VStack>

        <VStack className="space-y-4">
          <div className="bg-white/20 p-4 rounded-lg h-[200px] w-[400px] overflow-y-auto">
            <div className="flex flex-wrap items-start content-start ">
              {currentCalculation.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="m-1 p-1 text-lg bg-white/30 hover:bg-white/40 text-white"
                  onClick={() => handleCalculationItemClick(index)}
                >
                  {item}
                </Button>
              ))}
            </div>
            {calculations.map((calc, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm text-gray-300 mt-2"
              >
                <span>
                  {calc.expression} = {calc.result}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {numbers.map((num, index) => (
              <Button
                key={`${num}-${index}`}
                onClick={() => handleNumberClick(num, index)}
                disabled={gameOver}
                className="text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
              >
                {num}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {OPERATIONS.map((op) => (
              <Button
                key={op}
                onClick={() => handleOperationClick(op)}
                disabled={gameOver}
                className="text-lg font-bold bg-purple-600 hover:bg-purple-700"
              >
                {op}
              </Button>
            ))}
          </div>
          <div>
            <Button
              onClick={calculateResult}
              disabled={gameOver || currentCalculation.length < 3}
              className="bg-green-600 hover:bg-green-700"
            >
              {"........=........"}
            </Button>
            <Button
              onClick={resetGame}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {"Reset"}
            </Button>
          </div>
          <div className="flex justify-between mt-4">
            <Button
              onClick={startGame}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {"New Game (0.001 EDU)"}
            </Button>
          </div>
          <div className="flex justify-between mt-4">
            <Button
              onClick={withdraw}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {"Withdraw"}
            </Button>
            <Button
              onClick={forceEndGame}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {"Force End Game"}
            </Button>
          </div>

          {gameOver && (
            <div className="mt-4 text-center bg-white/20 p-4 rounded-lg">
              <h2 className="text-2xl font-bold flex items-center justify-center">
                <Sparkles className="mr-2 h-6 w-6 text-yellow-400" />
                {payout > 0 ? "Congratulations!" : "Game Over!"}
              </h2>
              <p className="text-lg mt-2">
                {payout > 0
                  ? `You won ${payout} REEETA!`
                  : "Better luck next time!"}
              </p>
            </div>
          )}
        </VStack>
      </Box>
    </div>
  );
}
