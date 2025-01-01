// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MathGame is ReentrancyGuard {
    uint256 public gameFee;
    uint256 public timeLimit;

    struct GameState {
        uint256 targetNumber;
        uint256[] numbers;
        uint256 startTime;
        bool isActive;
    }

    mapping(address => GameState) public playerGames;
    mapping(address => uint256) public playerBalances;
    address owner;

    event GameStarted(address player, uint256 targetNumber, uint256[] numbers);
    event GameWon(address player, uint256 payout);
    event GameLost(address player);
    event FeeChanged(uint256 newFee);
    event Withdrawal(address player, uint256 amount);
    event DebugLog(
        string message,
        uint256 value1,
        uint256 value2,
        uint256 value3
    );

    constructor() {
        owner = payable(msg.sender);
        gameFee = 0.00001 ether;
        timeLimit = 120;
    }

    function generateRandomNumbers(
        uint256 seed
    ) internal view returns (uint256[] memory) {
        uint256[] memory numbers = new uint256[](6);
         uint256 hash = uint256(keccak256(abi.encodePacked(block.timestamp, seed, msg.sender)));

         for (uint i = 0; i < 5; i++) {

          hash = uint256(keccak256(abi.encodePacked(hash)));
         numbers[i] = (hash % 9) + 1;
        }

        // Last number is larger (10-99)
        hash = uint256(keccak256(abi.encodePacked(hash)));
        numbers[5] = (hash % 90) + 10;
  
        return numbers;
    }

    function generateTargetNumber(
        uint256 seed
    ) internal view returns (uint256) {
        uint256 hash = uint256(keccak256(abi.encodePacked(block.timestamp, seed, msg.sender)));
        return (hash % 900) + 100;
        
    }

    function generateNumbers() public view returns (uint256[] memory) {
        require(playerGames[msg.sender].isActive, "No active game");
        return playerGames[msg.sender].numbers;
    }

    function getTargetNumber() public view returns (uint256) {
        require(playerGames[msg.sender].isActive, "No active game");
        return playerGames[msg.sender].targetNumber;
    }

    function play() external payable nonReentrant{
        require(msg.value == gameFee, "Incorrect game fee");
        emit DebugLog("play", 0, 0, 0);
        GameState storage game = playerGames[msg.sender];

        if (game.isActive) {
            // Eğer oyun aktifse, zaman kontrolü yap
            if (block.timestamp > game.startTime + 2 minutes) {
                // 2 dakika geçmişse, oyunu pasife çevir
                game.isActive = false;
            } else {
                revert("Game already in progress");
            }
        }
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)
            )
        );
        uint256[] memory numbers = generateRandomNumbers(seed);
        uint256 targetNumber = generateTargetNumber(seed);

        playerGames[msg.sender] = GameState({
            targetNumber: targetNumber,
            numbers: numbers,
            startTime: block.timestamp,
            isActive: true
        });

        emit GameStarted(msg.sender, targetNumber, numbers);
    }

    

    function verifyCalculation(
        uint256 targetNumber,
        uint256[] memory numbers,
        uint256[][] memory steps
    ) public returns (bool) {
        emit DebugLog("Starting Verification", targetNumber, 0, 0);

        // Create arrays to track number usage
        uint256[] memory availableNumbers = new uint256[](100); // Yeterince büyük bir array
        uint256 numbersCount;

        // Initialize available numbers
        for (uint256 i = 0; i < numbers.length; i++) {
            availableNumbers[numbers[i]]++;
            numbersCount++;
        }

        // Process each calculation step
        for (uint256 i = 0; i < steps.length; i++ ) {
            uint256 num1 = steps[i][0];
            uint256 operator = steps[i][1];
            uint256 num2 = steps[i][2];

            emit DebugLog("Processing Step", num1, operator, num2);

            // Check if numbers are available
            if (availableNumbers[num1] == 0 || availableNumbers[num2] == 0) {
                emit DebugLog("Numbers not available", num1, num2, 0);
                return false;
            }

            // Use the numbers
            availableNumbers[num1]--;
            availableNumbers[num2]--;
            numbersCount -= 2;

            // Calculate result
            uint256 result;
            if (operator == 0) {
                // Addition
                result = num1 + num2;
            } else if (operator == 1) {
                // Subtraction
                if (num1 < num2) return false; // Negative sonuç istemiyoruz
                result = num1 - num2;
            } else if (operator == 2) {
                // Multiplication
                result = num1 * num2;
            } else if (operator == 3) {
                // Division
                if (num2 == 0 || num1 % num2 != 0) return false;
                result = num1 / num2;
            } else {
                return false;
            }

            emit DebugLog("Step Result", i, result, 0);

            // For the last step, check if we reached the target
            if (i == steps.length - 1) {
                return result == targetNumber;
            }

            // Add result to available numbers for next step
            //
            // Array sınırlarını kontrol et
            availableNumbers[result]++;
            numbersCount++;

            
        }

        return false;
    }

    function checkResult(uint256[][] memory incoming_results) external nonReentrant{
        emit DebugLog("Starting checkResult", 0, 0, 0);

        GameState storage game = playerGames[msg.sender];
        emit DebugLog("Game Active Status", game.isActive ? 1 : 0, 0, 0);
        emit DebugLog("Current Time", block.timestamp, 0, 0);
        emit DebugLog("Start Time", game.startTime, 0, 0);
        emit DebugLog("Time Limit", timeLimit, 0, 0);

        require(game.isActive, "No active game");
        require(block.timestamp <= game.startTime + timeLimit, "Time expired");

        emit DebugLog("Incoming Results Length", incoming_results.length, 0, 0);
        bool isValid = verifyCalculation(
            game.targetNumber,
            game.numbers,
            incoming_results
        );

        if (isValid) {
            uint256 payout = gameFee * 2;
            playerBalances[msg.sender] += payout;
            emit GameWon(msg.sender, payout);
        } else {
            emit GameLost(msg.sender);
        }

        game.isActive = false;
    }

    function withdraw() external nonReentrant{
        uint256 amount = playerBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        playerBalances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    function changeFee(uint256 _newFee) external {
        require(msg.sender == owner, "Only owner can perform");
        gameFee = _newFee;
        emit FeeChanged(_newFee);
    }

    function changeTimeLimit(uint256 _newLimit) external {
        require(msg.sender == owner, "Only owner can perform");
        timeLimit = _newLimit;
    }


    // Function to withdraw the balance from the contract
    function withdrawContractBalance() public  {
        require(msg.sender == owner, "Only owner can perform");
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}
