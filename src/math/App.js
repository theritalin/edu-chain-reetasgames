import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Heading, VStack } from "@chakra-ui/react";
import { Progress } from "@chakra-ui/react";
import { Sparkles, Clock, Target } from "lucide-react";
import { WalletContext } from "../WalletContext";
import { ethers } from "ethers";

const OPERATIONS = ["+", "-", "×", "÷"];

export default function MathGame() {
  const [targetNumber, setTargetNumber] = useState(0);
  const [initialNumbers, setInitialNumbers] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [currentCalculation, setCurrentCalculation] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [timer, setTimer] = useState(120);
  const [gameOver, setGameOver] = useState(true);
  const [payout, setPayout] = useState(0);
  const { account, mathContract } = useContext(WalletContext);
  const [verified, setVerified] = useState([]);
  const [won, setGamewon] = useState(false);

  useEffect(() => {
    let interval;
    if (!gameOver && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setGameOver(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameOver, timer]);

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
    if (currentCalculation.length === 0) {
      console.log("Current calculation is empty, skipping update.");
      return;
    }
    if (true) {
      const calculation = currentCalculation
        .join(" ")
        .replace("×", "*")
        .replace("÷", "/");

      try {
        const result = eval(calculation);

        // İşlem geçmişine kaydet
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

        // Sayılar ve geçerli işlem sıfırlama
        setNumbers([...numbers, result]);
        const formatted = [];
        for (let i = 0; i < currentCalculation.length - 1; i += 2) {
          const num1 = currentCalculation[i];
          const op = currentCalculation[i + 1];
          const num2 = currentCalculation[i + 2];

          if (typeof num1 !== "number" || typeof num2 !== "number" || !op) {
            continue; // Geçersiz elemanları atla
          }

          let operationValue;
          switch (op) {
            case "+":
              operationValue = 0;
              break;
            case "-":
              operationValue = 1;
              break;
            case "×":
              operationValue = 2;
              break;
            case "÷":
              operationValue = 3;
              break;
            default:
              console.warn(`Invalid operator: ${op}`);
              continue; // Geçersiz operatorleri atla
          }

          formatted.push(num1, operationValue, num2);
        }

        // Yeni verified array'ini önce oluştur
        const updatedVerified = [...verified, formatted];

        // State'i güncelle ve yeni array'i sakla
        setVerified(updatedVerified);

        console.log("Verified array :", JSON.stringify(updatedVerified));

        if (result === targetNumber) {
          setGamewon(true);
          console.log(
            "Verified array before contract call:",
            JSON.stringify(updatedVerified)
          );

          if (
            updatedVerified.length === 0 ||
            !updatedVerified.every((item) => Array.isArray(item))
          ) {
            console.error("Invalid verified array:", updatedVerified);
            return;
          }

          // Güncel array'i kullanarak kontrat çağrısı yap
          const tx = await mathContract.checkResult(updatedVerified);
          await tx.wait();

          if (tx) {
            // Transaction loglarını almak için
            const receipt = await tx.wait();
            receipt.logs.forEach((log) => {
              // Log'ları işlemek için
              const parsedLog = mathContract.interface.parseLog(log);
              if (parsedLog.name === "DebugLog") {
                console.log(
                  `Debug Log - Message: ${parsedLog.args.message}, Value1: ${parsedLog.args.value1}, Value2: ${parsedLog.args.value2}, Value3: ${parsedLog.args.value3}`
                );
              } else if (parsedLog.name === "GameWon") {
                console.log(
                  `Game Won - Player : ${parsedLog.args.player}, Payout: ${parsedLog.args.payout}`
                );

                setPayout(0.00002);
                setGameOver(true);
              } else if (parsedLog.name === "GameLost") {
                console.log(`Game Lost - Player : ${parsedLog.args.player}`);
                setPayout(0);
                setGameOver(true);
              }

              //add a control the logs here. if gamewon exists then set here
            });
          }
        }

        setCurrentCalculation([]);

        //Invalid calculation or contract error: Objectcode: -32603message: "Internal JSON-RPC error."stack: "{\n  \"code\": -32603,\n  \"message\": \"Internal JSON-RPC error.\",\n  \"stack\": \"Error: Internal JSON-RPC error.\\n    at new o (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:1:162455)\\n    at i (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:1:165546)\\n    at Object.internal (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:1:166155)\\n    at Ie.processApproval (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:5:419433)\\n    at async n.addDappTransaction (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-0.js:1:89096)\\n    at async chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-1.js:1:300127\\n    at async chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:1:21552\"\n}\n  at new o (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:1:162455)\n  at i (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:1:165546)\n  at Object.internal (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:1:166155)\n  at Ie.processApproval (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-2.js:5:419433)\n  at async n.addDappTransaction (chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-0.js:1:89096)\n  at async chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background-1.js:1:300127\n  at async chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/common-1.js:1:21552"[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()
        //yukarıdaki hata alınıyor. gas yada gönderilen format kontrol et
        //kontrat tempi değiştir. ve yeniden dağıt
      } catch (error) {
        console.error("Invalid calculation or contract error:", error);
        setCurrentCalculation([]);
      }
    }
  };

  // //for testing purposes
  // const demo = async () => {
  //   const solution = [
  //     [2, 2, 4], // 2 * 4 = 8
  //     [8, 0, 7], // 8 + 7 = 15
  //     [15, 2, 6], // 15 * 6 = 90
  //     [90, 0, 10], // 90 + 10 = 100
  //   ];
  //   const tx = await mathContract.checkResult(solution, {
  //     //gas: 6721975, // Increased gas limit
  //   });
  //   await tx.wait();

  //   if (tx) {
  //     setPayout(0.00002);
  //     setGameOver(true);

  //     // Transaction loglarını almak için
  //     const receipt = await tx.wait();
  //     receipt.logs.forEach((log) => {
  //       // Log'ları işlemek için
  //       const parsedLog = mathContract.interface.parseLog(log);
  //       if (parsedLog.name === "DebugLog") {
  //         console.log(
  //           `Debug Log - Message: ${parsedLog.args.message}, Value1: ${parsedLog.args.value1}, Value2: ${parsedLog.args.value2}, Value3: ${parsedLog.args.value3}`
  //         );
  //       }
  //     });
  //   }

  //   console.log("Check result completed");
  // };

  const startGame = async () => {
    if (!account) {
      console.error("Contract or user address not available");
      return;
    }

    try {
      // First play the game (send fee)
      const tx = await mathContract.play({
        value: ethers.utils.parseEther("0.00001"),
      });
      await tx.wait();

      // Get numbers and target from contract
      const generatedNumbers = await mathContract.generateNumbers();
      const target = await mathContract.getTargetNumber();

      console.log(`Target : ${target}`);
      console.log(`generted Numbers : ${generatedNumbers}`);

      setTargetNumber(target.toNumber());
      const newNumbers = generatedNumbers.map((n) => n.toNumber());
      
      setInitialNumbers(newNumbers);
      setNumbers(newNumbers);
      setCurrentCalculation([]);
      setCalculations([]);
      setVerified([]);
      setTimer(120);
      setGameOver(false);
      setPayout(0);
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  const resetGame = () => {
    setNumbers([...initialNumbers]);
    setCurrentCalculation([]);
    setCalculations([]);
    setVerified([]);
  };

  const withdraw = async () => {
    try {
      await mathContract.withdraw();
    } catch (error) {
      console.error("Error withdrawing:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 p-4">
      <Box className="w-full max-w-md bg-white/10 backdrop-blur-md border-none text-white">
        <VStack className="space-y-1">
          <div className="flex justify-between mt-4">
            <Heading className="text-2xl font-bold text-center">
              Math Challenge
            </Heading>
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
            <div className="flex flex-wrap items-start content-start">
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
              {"New Game "}
            </Button>
          </div>
          <div className="flex justify-between mt-4">
            <Button
              onClick={withdraw}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {"Withdraw"}
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
                  ? `You won ${payout} EDU!`
                  : "Better luck next time!"}
              </p>
            </div>
          )}
        </VStack>
      </Box>
    </div>
  );
}
