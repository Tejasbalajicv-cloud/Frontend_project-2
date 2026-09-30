
/* ============================================================
   KeyPop — a typing speed test in plain JavaScript
   ============================================================ */

/* ---------- 1. The sentences, sorted by difficulty ---------- */
const QUOTES = {
  easy: [
    "The cat sat on the mat.",
    "I like to read books.",
    "The sun is hot today.",
    "We go to school by bus.",
    "She has a red ball."
  ],
  medium: [
    "Practice makes perfect, so keep typing every single day.",
    "The quick brown fox jumps over the lazy dog near the river.",
    "A journey of a thousand miles begins with a single step.",
    "Good things come to those who wait, but better things come to those who work."
  ],
  hard: [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "In the middle of every difficulty lies opportunity, waiting for those brave enough to find it.",
    "The only way to do great work is to love what you do, and never stop learning."
  ]
};

/* ---------- 2. Game state (variables that change while playing) ---------- */
let timeLimit = 15;        // how many seconds the round lasts
let difficulty = "easy";   // which sentence list to use
let quote = "";            // the sentence shown right now
let started = false;       // has the user typed the first letter?
let finished = false;      // is the round over?
let timeLeft = timeLimit;  // seconds remaining
let timerId = null;        // the ticking clock (so we can stop it)
let totalCorrect = 0;      // correct letters from finished sentences
let totalTyped = 0;        // all letters from finished sentences

/* ---------- 3. Grab the page elements we need ---------- */
const quoteBox = document.getElementById("quoteBox");
const input = document.getElementById("input");
const timeLeftEl = document.getElementById("timeLeft");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const resultEl = document.getElementById("result");

/* ---------- 4. Pick a random sentence ---------- */
function pickQuote() {
  const list = QUOTES[difficulty];
  const index = Math.floor(Math.random() * list.length);
  quote = list[index];
}

/* ---------- 5. Draw the sentence with colors ---------- */
/* Green = typed correctly, pink = typed wrong, plain = not typed yet */
function drawQuote() {
  const typed = input.value;
  let html = "";

  for (let i = 0; i < quote.length; i++) {
    let letter = quote[i];
    let cssClass = "";

    if (i < typed.length) {
      cssClass = typed[i] === quote[i] ? "correct" : "wrong";
    }

    // Show a blinking line at the letter you are about to type
    if (i === typed.length && started && !finished) {
      cssClass += " cursor";
    }

    html += '<span class="' + cssClass + '">' + letter + "</span>";
  }

  quoteBox.innerHTML = html;
}

/* ---------- 6. Calculate and show live stats ---------- */
function updateStats() {
  const typed = input.value;

  // Count correct letters in the current sentence
  let correctNow = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === quote[i]) correctNow++;
  }

  const correct = totalCorrect + correctNow;
  const typedAll = totalTyped + typed.length;

  // WPM = (correct letters / 5) divided by minutes spent
  const secondsUsed = timeLimit - timeLeft;
  let wpm = 0;
  if (secondsUsed > 0) {
    wpm = Math.round((correct / 5) / (secondsUsed / 60));
  }

  // Accuracy = correct letters / all typed letters × 100
  let accuracy = 100;
  if (typedAll > 0) {
    accuracy = Math.round((correct / typedAll) * 100);
  }

  wpmEl.textContent = wpm;
  accuracyEl.textContent = accuracy + "%";
  timeLeftEl.textContent = timeLeft;
}

/* ---------- 7. The ticking clock ---------- */
function startTimer() {
  timerId = setInterval(function () {
    timeLeft--;
    updateStats();

    if (timeLeft <= 0) {
      finishTest();
    }
  }, 1000); // runs once every second
}

/* ---------- 8. What happens on every key press ---------- */
input.addEventListener("input", function () {
  if (finished) return;

  // First letter typed → start the clock
  if (!started) {
    started = true;
    startTimer();
  }

  // Finished the whole sentence? Save its letters and load the next one
  if (input.value.length >= quote.length) {
    for (let i = 0; i < quote.length; i++) {
      if (input.value[i] === quote[i]) totalCorrect++;
    }
    totalTyped += quote.length;
    input.value = "";
    pickQuote();
  }

  drawQuote();
  updateStats();
});

/* ---------- 9. Time is up: show the result ---------- */
function finishTest() {
  clearInterval(timerId);
  finished = true;
  input.disabled = true;
  updateStats();

  const finalWpm = parseInt(wpmEl.textContent, 10);
  const finalAcc = accuracyEl.textContent;

  document.getElementById("finalWpm").textContent = finalWpm;
  document.getElementById("finalAcc").textContent = finalAcc;

  // Save the best score ever
  const best = parseInt(localStorage.getItem("keypop-best") || "0", 10);
  if (finalWpm > best) {
    localStorage.setItem("keypop-best", finalWpm);
    document.getElementById("bestLine").textContent = "🎉 New best score!";
  } else {
    document.getElementById("bestLine").textContent = "Your best: " + best + " WPM";
  }

  // Add this score to the leaderboard (keep only the top 5)
  const board = JSON.parse(localStorage.getItem("keypop-leaderboard") || "[]");
  board.push({ wpm: finalWpm, acc: finalAcc });
  board.sort(function (a, b) { return b.wpm - a.wpm; });
  localStorage.setItem("keypop-leaderboard", JSON.stringify(board.slice(0, 5)));
  drawBoard();

  playBeep(); // little sound to say "time's up!"
  resultEl.style.display = "block";
}

/* ---------- 10. Restart button: reset everything ---------- */
function restart() {
  clearInterval(timerId);
  started = false;
  finished = false;
  timeLeft = timeLimit;
  totalCorrect = 0;
  totalTyped = 0;
  input.value = "";
  input.disabled = false;
  resultEl.style.display = "none";
  pickQuote();
  drawQuote();
  updateStats();
  input.focus();
}
document.getElementById("restartBtn").addEventListener("click", restart);
document.getElementById("restartTopBtn").addEventListener("click", restart);

/* ---------- 11. Time and difficulty buttons ---------- */
document.querySelectorAll(".time-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".time-btn").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    timeLimit = parseInt(btn.dataset.time, 10);
    restart();
  });
});

document.querySelectorAll(".diff-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".diff-btn").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    difficulty = btn.dataset.diff;
    restart();
  });
});

/* ---------- 12. Dark mode ---------- */
document.getElementById("darkBtn").addEventListener("click", function () {
  document.body.classList.toggle("dark");
  this.textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
});

/* ---------- 13. Leaderboard ---------- */
function drawBoard() {
  const board = JSON.parse(localStorage.getItem("keypop-leaderboard") || "[]");
  const list = document.getElementById("boardList");

  if (board.length === 0) {
    list.innerHTML = "<li>No scores yet — play a round!</li>";
    return;
  }

  let html = "";
  board.forEach(function (entry) {
    html += "<li>" + entry.wpm + " WPM (" + entry.acc + " accurate)</li>";
  });
  list.innerHTML = html;
}

/* ---------- 14. A small beep when time runs out ---------- */
function playBeep() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    const note = audio.createOscillator();
    const volume = audio.createGain();
    note.connect(volume);
    volume.connect(audio.destination);
    note.frequency.value = 660;        // pitch of the beep
    volume.gain.value = 0.1;           // keep it quiet
    note.start();
    note.stop(audio.currentTime + 0.4); // beep lasts 0.4 seconds
  } catch (e) {
    // If sound is not allowed, just skip it
  }
}

/* ---------- 15. Start the game when the page opens ---------- */
pickQuote();
drawQuote();
drawBoard();
updateStats();
