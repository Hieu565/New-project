// Game Constants
const DICE_COUNT = 3;
const MIN_BET = 10;
const INITIAL_BALANCE = 200;
const MATH_REWARD_RANGE = [50, 200];
const MAX_HISTORY = 10;
const ROLL_DURATION = 20;
const BACKGROUND_OPTIONS = {
  basic: { color: [0, 0, 100], price: 0, label: "Basic (Dark Green)" },
  standard: { color: [0, 100, 0], price: 1000, label: "Standard (Dark Blue)" },
  premier: { color: [184, 134, 11], price: 2000, label: "Premier (Dark Gold)" },
  firstClass: { color: [0, 0, 0], price: 10000, label: "First-class (Black)" },
};

const WIN_COLORS = {
  high: (0, 150, 0),
  low: (150, 0, 0)
};

// Game State
let game = {
	  timer: 10,
  lastTick: 0,
  autoRolling: false,
  balance: INITIAL_BALANCE,
  betAmount: 100,
  diceValues: [1, 1, 1],
  diceSum: 3,
  gameState_1: "waiting",
  betType: "high", // "high" or "high"
  result: "",
  rollCount: 0,
  history: [],
math: {
  question: null,
  choices: [],
  correctIndex: -1,
  selectedIndex: -1,
  showQuestion: false,
  reward: 0
},

  ui: {
    buttonActive: false,
    lastClickTime: 0
  }
	
}
	game.backgroundColor = [0, 100, 0]; // default dark green
	game.ownedBackgrounds = {
  basic: true,
  standard: false,
  premier: false,
  firstClass: false
	};

// Setup
	function setup() {
		createCanvas(windowWidth, windowHeight);
		textAlign(CENTER, CENTER);
		textSize(24);
		noStroke();
		generateMathQuestion();
		game.lastTick = millis(); // Initialize countdown timer
		loadGame();
	}

// Main draw loop
	function draw() {
		drawDiceUI();
	}

function drawDiceUI()	{
	background(...game.backgroundColor);
		
		drawDice();
		drawBalance();
		drawHistory();
		drawResult();
		drawBetButtons();
		drawTimer();
		if (game.showMarket) drawMarket();

		if (game.gameState_1 === "rolling") handleRollingState();

		if (game.math.showQuestion) drawMathQuestion();

		// Auto show math question if balance = 0
		if (game.balance === 0 && !game.math.showQuestion) {
					game.math.showQuestion = true;
}

		drawFeatureButton(); // Always show it
		updateTimer();
}

//automated game functions: dice, balance, bet
	function drawBalance() {
		fill(255);
		textSize(60)
		text(`Balance: $${game.balance}`, width / 2, 50);
	}

//Update timer
	function updateTimer() {
		if (game.gameState_1 !== "waiting") return;

		let now = millis();
		if (now - game.lastTick >= 1000) {
			game.timer--;
			game.lastTick = now;

			if (game.timer <= 0) {
				game.gameState_1 = "rolling";
				game.rollCount = 0;
				game.autoRolling = true;
			}
		}
	}

//show game hisotry	
	function drawHistory() {
			textSize(24);
			fill(255);
			text("Result history:", 100, 170); // Header stays at the top

			const startX = 70;
			const startY = 200; // Start just below the title
			const lineHeight = 25;

			for (let i = 0; i < game.history.length; i++) {
				const item = game.history[i]; // Oldest first
				const y = startY + i * lineHeight; // Newer goes further down

				if (item.outcome === "win") {
					fill(0, 200, 0); // Green
				} else if (item.outcome === "lose") {
					fill(200, 0, 0); // Red
				} else {
					fill(255); // White (no bet)
				}

				textSize(16);
				text(`${item.sum} (${item.result})`, startX -15, y);
			}
		}

	//game result
		function drawResult() {
			if (game.result) {
				textSize(25)
				fill(game.result === "Win" ? color(0, 200, 0) : color(200, 0, 0));
				text(game.result, width / 2, height - 100);
			}
		}

		function checkResult() {
			const sum = game.diceSum;
			const isHigh = sum >= 11;
			const isLow = sum <= 10;

		let outcome = "no-bet";
		  if (!game.autoRolling) {
					if ((game.betType === "high" && isHigh) || (game.betType === "low" && isLow)) {
				// Determine multiplier based on current background
				let multiplier = 1; // default for basic
				if (game.backgroundColor === BACKGROUND_OPTIONS.basic.color) multiplier = 1;
				if (game.backgroundColor === BACKGROUND_OPTIONS.standard.color) multiplier = 1.5;
				if (game.backgroundColor === BACKGROUND_OPTIONS.premier.color) multiplier = 2;
				if (game.backgroundColor === BACKGROUND_OPTIONS.firstClass.color) multiplier = 3;

				// Apply multiplier to bet amount
				const winAmount = floor(game.betAmount * multiplier);
				game.balance += winAmount;
				game.result = `Win +${winAmount}đ`;
			} else {
				game.balance = max(0, game.balance - game.betAmount);
				game.result = "Lose";
			}
		}
		updateHistory(sum, isHigh ? "High" : "Low", outcome);

		if (game.autoRolling) {
			game.result = "No bet!";
		} else {
			if ((game.betType === "high" && isHigh) || (game.betType === "low" && isLow)) {
				game.balance += game.betAmount;
				game.result = "Win";
			} else {
				game.balance = max(0, game.balance - game.betAmount);
				game.result = "Lose";
			}
		}
			if (game.balance <= 0) {
				game.result = "You are out of money!";
			}

			setTimeout(() => {
				if (game.balance > 0) resetRound();
			}, 2000);
		}

		//update history
			function updateHistory(sum, result, outcome) {
				game.history.unshift({ sum, result, outcome });
				if (game.history.length > MAX_HISTORY) game.history.pop();
			}
		
		//reset round
		function resetRound() {
			game.gameState_1 = "waiting";
			game.result = "";

			// Only allow reset if there's some money to play with
			if (game.balance > 0) {
				game.timer = 20;
				game.lastTick = millis();
				game.autoRolling = false;
				game.rollCount = 0;

				// Ensure betAmount is valid
				if (game.betAmount > game.balance) {
					game.betAmount = game.balance;
				}
			} else {
				game.gameState_1 = "waiting"; // still allow answering math to recover
			}
		}

	//Dice
		function drawDice() {
			fill(255);
			textSize(32);
			text(`Sum: ${game.diceSum}`, width / 2, height/2 - 100);
			textSize(24);
			game.diceValues.forEach((value, i) => drawDie(width / 2 + (i - 1) * 120, height / 2, value));
		}

		// Rolling dice animation
		function handleRollingState() {
			if (game.rollCount < ROLL_DURATION) {
				if (frameCount % 5 === 0) {
					game.diceValues = Array(DICE_COUNT).fill().map(() => floor(random(1, 7)));
					game.diceSum = game.diceValues.reduce((a, b) => a + b, 0);
					game.rollCount++;
				}
			} else {
				game.gameState_1 = "result";
				checkResult();
			}
		}

		function drawDie(x, y, value) {
			fill(255);
			rect(x - 50, y - 50, 100, 100, 10);
			fill(0);
			const dotPositions = {
				1: [[0, 0]],
				2: [[-25, 25], [25, -25]],
				3: [[-25, 25], [0, 0], [25, -25]],
				4: [[-25, -25], [-25, 25], [25, -25], [25, 25]],
				5: [[-25, -25], [-25, 25], [0, 0], [25, -25], [25, 25]],
				6: [[-25, -25], [-25, 0], [-25, 25], [25, -25], [25, 0], [25, 25]]
			};
			dotPositions[value].forEach(pos => ellipse(x + pos[0], y + pos[1], 15, 15));
		}

	//Draw timer
	function drawTimer() {
		fill(255);
		textSize(25);
		text(`Next roll in: ${game.timer}s`, width / 2, 120);
	}

//all buttons
	// Button drawing helper
	function drawButton(x, y, w, h, label, bgColor, size = 24) {
		fill(bgColor);
		rect(x, y, w, h, 10);
		fill(255);
		textSize(size);
		text(label, x + w / 2, y + h / 2);
	}	

	function drawFeatureButton() {
		drawButton(20, 80, 200, 50, "Solve questions for money", color(255, 215, 0), 16);
		drawButton(20, 20, 200, 50, "Open Background Market", color(70, 70, 200), 16);
		drawButton(width - 90, 20, 70, 50, "Save", color(70, 70, 200), 16);
	}

	function drawBetButtons() {
		drawButton(width / 4 - 100, height - 150, 200, 60, "High", game.betType === "high" ? WIN_COLORS.high : color(0, 100, 0));
		drawButton(3 * width / 4 - 100, height - 150, 200, 60, "Low", game.betType === "low" ? WIN_COLORS.low : color(100, 0, 0));

		if (game.gameState_1 === "waiting") {
			let btnColor = game.balance >= game.betAmount ? color(0, 0, 150) : color(100);
			drawButton(width / 2 - 100, height - 70, 200, 60, `BET $${game.betAmount}`, btnColor);
		}

		drawButton(width / 2 - 150, height - 200, 50, 40, "-", color(100));
		drawButton(width / 2 + 100, height - 200, 50, 40, "+", color(100));
		fill(255);
		text(`$${game.betAmount}`, width / 2, height - 180);
		drawButton(width / 2 - 60, height - 260, 120, 40, "All-in", color(255, 165, 0), 18);
	}

// Mouse click handler
	function mousePressed() {
		if (millis() - game.ui.lastClickTime < 300) return;
		game.ui.lastClickTime = millis();

		// 1️⃣ Math logic first
		if (game.math.showQuestion) {
			if (HandleMathQuestions()) return;
		}

		// 2️⃣ Game click logic
		if (HandleGameClick()) return;

		// 3️⃣ Market logic
		if (HandleMarket()) return;
	}

	// 🎮 Handle main game clicks
		function HandleGameClick() {
			// Show math question (only if broke)
			if (mouseInRect(20, 80, 200, 50) && game.balance <= 500) {
					game.math.showQuestion = true;
					return true;
			}	
			
			if (game.gameState_1 !== "waiting") return false;

				// Bet type
				if (mouseInRect(width / 4 - 100, height - 150, 200, 60)) {
					game.betType = "high";
					return true;
				}
			
				if (mouseInRect(3 * width / 4 - 100, height - 150, 200, 60)) {
					game.betType = "low";
					return true;
				}

				// Adjust bet
				if (mouseInRect(width / 2 - 150, height - 200, 50, 40)) {
					game.betAmount = max(1, game.betAmount - 10);
					return true;
				}
				if (mouseInRect(width / 2 + 100, height - 200, 50, 40)) {
					game.betAmount += 10;
					return true;
				}

				// Confirm roll
				if (mouseInRect(width / 2 - 100, height - 70, 200, 60) && game.balance >= game.betAmount) {
					game.gameState_1 = "rolling";
					game.rollCount = 0;
					return true;
				}

				// All-in
				if (mouseInRect(width / 2 - 60, height - 260, 120, 40)) {
					game.betAmount = game.balance;
					return true;
				}

				// Open market
				if (mouseInRect(20, 20, 180, 50)) {
					game.showMarket = true;
					return true;
				}

				//save game
				if (mouseInRect(width - 90, 20, 70, 50)) {
					saveGame();
					return true;
				}
			
				return false;
			}

	// 🔹 Save current game state
		function saveGame() {
			let saveData = {
				balance: game.balance,
				betAmount: game.betAmount,
				backgroundColor: game.backgroundColor,
				ownedBackgrounds: game.ownedBackgrounds,
				history: game.history
			};
			storeItem("diceGameSave", saveData);
			game.result = "Game saved!";
		}

	// 🔹 Load saved game state
		function loadGame() {
			let saveData = getItem("diceGameSave");
			if (saveData) {
				game.balance = saveData.balance ?? INITIAL_BALANCE;
				game.betAmount = saveData.betAmount ?? MIN_BET;
				game.backgroundColor = saveData.backgroundColor ?? [0, 100, 0];
				game.ownedBackgrounds = saveData.ownedBackgrounds ?? {basic:true,standard:false,premier:false,firstClass:false};
				game.history = saveData.history ?? [];
				game.result = "Game loaded!";
			}
		}

	// 🧮 Handle math questions
			function HandleMathQuestions() {
					// Choices
					for (let i = 0; i < game.math.choices.length; i++) {
						const x = width / 2 - 200;
						const y = height / 2 - 80 + i * 60;
						if (mouseInRect(x, y, 400, 40)) {
							game.math.selectedIndex = i;
							return true;
						}
					}

					// Confirm bet with math
					if (mouseInRect(width / 2 - 100, height - 70, 200, 60)) {
						if (game.balance >= game.betAmount) {
							game.gameState_1 = "rolling";
							game.rollCount = 0;
						} else {
							game.result = "Not enough bet!";
						}
						return true;
					}

					// Check answer
					if (mouseInRect(width / 2 - 80, height / 2 + 160, 160, 50)) {
						checkMathAnswer();
						return true;
					}

					// Cancel question
					if (mouseInRect(width / 2 - 80, height / 2 + 230, 160, 50)) {
						game.math.showQuestion = false;
						return true;
					}

					return false;		//continue in question
				}

	//math questions related
	function drawMathQuestion() {
		fill(0, 0, 0, 200);
		rect(0, 0, width, height);

		fill(255);
		rect(width / 2 - 600, height / 2 - 200, 1200, 550, 20); // Increase height from 500 to 550
		fill(0);
		textSize(20);
		text(game.math.question, width / 2, height / 2 - 130);

		game.math.choices.forEach((choice, i) => {
			const x = width / 2 - 200;
			const y = height / 2 - 80 + i * 60;
			const selected = i === game.math.selectedIndex;
			const bg = selected ? color(0, 150, 0) : color(200);
			drawButton(x, y, 400, 40, choice.toString(), bg, 18);
		});

		drawButton(width / 2 - 80, height / 2 + 160, 160, 50, "Submit", color(0, 120, 200));
		drawButton(width / 2 - 80, height / 2 + 230, 160, 50, "Close", color(200, 0, 0));

	}

	//generate questions:
		function generateMathQuestion() {
			const questions = [
				// Easy: Multiplication
				() => {
					const x = floor(random(2, 10));
					const y = floor(random(2, 10));
					const result = x * y;
					const choices = shuffle([result, result + 2, result - 1, result + 5]);
					return {
						question: `What is ${x} × ${y}?`,
						choices,
						correctIndex: choices.indexOf(result),
						reward: 100
					};
				},

				// Medium: Subtraction
				() => {
					const a = floor(random(10, 30));
					const b = floor(random(1, 10));
					const result = a - b;
					const choices = shuffle([result, result + 1, result - 2, result + 3]);
					return {
						question: `What is ${a} - ${b}?`,
						choices,
						correctIndex: choices.indexOf(result),
						reward: 150
					};
				},

				// Medium: Apples out of total
				() => {
					const apples = floor(random(5, 20));
					const oranges = floor(random(5, 20));
					const total = apples + oranges;
					const choices = shuffle([apples, oranges, total, apples + 1]);
					return {
						question: `You have ${total} fruits. If apples = ${apples}, how many oranges?`,
						choices,
						correctIndex: choices.indexOf(oranges),
						reward: 150
					};
				},

				// Medium: Percentage
				() => {
					const total = floor(random(50, 100));
					const percent = floor(random(10, 90));
					const result = floor((percent / 100) * total);
					const choices = shuffle([result, result + 1, result - 1, result + 5]);
					return {
						question: `What is ${percent}% of ${total}?`,
						choices,
						correctIndex: choices.indexOf(result),
						reward: 150
					};
				},

				// Hard: Circle area
				() => {
					const r = floor(random(5, 15));
					const result = floor(3.14 * r * r);
					const choices = shuffle([result, result - 5, result + 4, result + 8]);
					return {
						question: `Approximate area of a circle with radius ${r}? (π ≈ 3.14)`,
						choices,
						correctIndex: choices.indexOf(result),
						reward: 200
					};
				},

				// Hard: Missing number (algebra-style)
				() => {
					const x = floor(random(3, 12));
					const result = x * 2 + 5;
					const choices = shuffle([result, result + 3, result - 2, result + 7]);
					return {
						question: `If x = ${x}, what is 2x + 5?`,
						choices,
						correctIndex: choices.indexOf(result),
						reward: 200
					};
				},

				// Hard: Fraction to decimal
				() => {
					const numerators = [1, 2, 3, 3, 4];
					const denominators = [2, 4, 5, 10, 5];
					const i = floor(random(numerators.length));
					const result = +(numerators[i] / denominators[i]).toFixed(2);
					const choices = shuffle([
						result,
						+(result + 0.1).toFixed(2),
						+(result - 0.1).toFixed(2),
						+(result + 0.05).toFixed(2)
					]);
					return {
						question: `Convert ${numerators[i]}/${denominators[i]} to decimal (2 decimal places):`,
						choices,
						correctIndex: choices.indexOf(result),
						reward: 200
					};
				}
			];

			const q = random(questions)();
			game.math.question = q.question;
			game.math.choices = q.choices;
			game.math.correctIndex = q.correctIndex;
			game.math.selectedIndex = -1;
			game.math.reward = q.reward;
		}

	//check answers
		function checkMathAnswer() {
			if (game.math.selectedIndex === game.math.correctIndex) {
				game.balance += game.math.reward;
				game.result = `Correct! +${game.math.reward}đ`;

				resetRound(); // ✅ Make game responsive again
			} else {
				const correct = game.math.choices[game.math.correctIndex];
				game.result = `Wrong! Correct answer: ${correct}`;
			}

			if (game.betAmount > game.balance) {
				game.betAmount = game.balance;
			}

			game.math.showQuestion = false;
			generateMathQuestion();
		}


		// 🛒 Handle market
			function HandleMarket() {
				if (!game.showMarket) return false;

				let yStart = height / 2 - 200;
				for (let i = 0; i < Object.keys(BACKGROUND_OPTIONS).length; i++) {
					const key = Object.keys(BACKGROUND_OPTIONS)[i];
					const bg = BACKGROUND_OPTIONS[key];
					const btnX = width / 2 - 300 + 450;
					const btnY = yStart + i * 90 + 20;
					const btnW = 120;
					const btnH = 40;

					if (mouseInRect(btnX, btnY, btnW, btnH)) {
						if (game.ownedBackgrounds[key]) {
							game.backgroundColor = bg.color;
						} else {
							if (game.balance >= bg.price) {
								game.balance -= bg.price;
								game.ownedBackgrounds[key] = true;
								game.backgroundColor = bg.color;
								game.result = `Bought ${bg.label}!`;
							} else {
								game.result = "Not enough balance!";
							}
						}
						return true;
					}
				}

				// Close market
				if (mouseInRect(width / 2 - 80, height / 2 + 175, 160, 50)) {
					game.showMarket = false;
					return true;
				}

				return false;
			}

	//functions handle additional features (market, math questions)
			//market
			function drawMarket() {
				fill(50);
				rect(width / 2 - 400, height / 2 - 320, 800, 580, 20);	//background

				fill(255);
				textSize(32);
				text("Background Market", width / 2, height / 2 - 260);

				let yStart = height / 2 - 200;
				let i = 0;
				for (const key in BACKGROUND_OPTIONS) {
					const bg = BACKGROUND_OPTIONS[key];
					const x = width / 2 - 300;
					const y = yStart + i * 90;

					// Draw color box
					fill(...bg.color);
					rect(x, y, 80, 80, 10);

					// Draw label and price
					fill(255);
					textSize(20);
					text(bg.label, x + 150, y + 30);

					if (bg.price > 0) {
						textSize(16);
						fill(200);
						text(`Price: ${bg.price}đ`, x + 150, y + 60);
					} else {
						textSize(16);
						fill(200);
						text("Free (default)", x + 150, y + 60);
					}

					// Buy/Select Button
					const btnX = x + 450;
					const btnY = y + 20;
					const btnW = 120;
					const btnH = 40;

					let btnLabel = game.ownedBackgrounds[key] ? "Select" : "Buy";
					let btnColor = game.ownedBackgrounds[key] ? color(0, 150, 0) : color(0, 0, 150);

					drawButton(btnX, btnY, btnW, btnH, btnLabel, btnColor, 18);

					i++;
				}

				// Close Market button
					drawButton(width / 2 - 80, height / 2 + 175, 160, 50, "Close Market", color(200, 0, 0));
			}

	
//return position of mouse click
	function mouseInRect(x, y, w, h) {
		return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
	}

	function windowResized() {
		resizeCanvas(windowWidth, windowHeight);
	}
