/**
 * 【流光旅人】水晶衝突自訂賽看板 V23 - 管理監控版
 */

// --- 1. 工具函數 ---
function customShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- 2. 變數設定 ---
let playerNames = ["突擊兔邦妮", "Neil", "哈密瓜牛奶", "Soph1a", "西瓜牛奶", "鑢七椋", "奈莎", "吼哩拎醉", "一包黑芝麻", "戰鎖鎖不住", "無糖珍珠奶茶", "Usachi", "本", "楓紅", "武破子"];
let shuffledList = [];
let teams = [[], [], []];
let currentIndex = 0;
let isRolling = false, rollingName = "", timer = 0;
let gamePhase = 0;
let teamScores = [0, 0, 0];
let matches = [
  { t1: 0, t2: 1, winner: -1, score: "" }, { t1: 1, t2: 2, winner: -1, score: "" }, { t1: 2, t2: 0, winner: -1, score: "" },
  { t1: 0, t2: 1, winner: -1, score: "" }, { t1: 1, t2: 2, winner: -1, score: "" }, { t1: 2, t2: 0, winner: -1, score: "" }
];

// --- Firebase 與 監控變數 ---
const firebaseConfig = {
  apiKey: "AIzaSyA_pq1Z2JRmFNxfz5aTTGMPGUIwtWExOJ8",
  authDomain: "ff14-pvp-poll.firebaseapp.com",
  databaseURL: "https://ff14-pvp-poll-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ff14-pvp-poll",
  storageBucket: "ff14-pvp-poll.firebasestorage.app",
  messagingSenderId: "838002155980",
  appId: "1:838002155980:web:5405c5b702c9a650a8fd69",
  measurementId: "G-9CXM7H9JE2"
};

let db, voteCounts = { A: 0, B: 0, C: 0, total: 0 };
let voteStartTime = 0, voteDuration = 600, voteActive = false;
let allVotes = [];      // 儲存明細
let showVoteList = false; // 是否顯示明細列表
let finalTeams = [0, 1], finalMatches = [{ winner: -1, score: "" }, { winner: -1, score: "" }, { winner: -1, score: "" }];
let finalWinnerIdx = -1, activeInput = { type: null, index: -1 }, warningFlash = 0;

function setup() {
  createCanvas(1000, 950);
  shuffledList = customShuffle([...playerNames]);
  rectMode(CENTER);
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    setupVoteListener();
  }
}

function setupVoteListener() {
  db.ref('votes').on('value', (snapshot) => {
    let votes = snapshot.val();
    let counts = { A: 0, B: 0, C: 0, total: 0 };
    allVotes = [];
    if (votes) {
      for (let id in votes) {
        let team = votes[id];
        if (counts.hasOwnProperty(team)) { counts[team]++; counts.total++; }
        allVotes.push({ id: id, team: team });
      }
    }
    voteCounts = counts;
  });
  db.ref('settings').on('value', (snapshot) => {
    let settings = snapshot.val();
    if (settings) { voteActive = settings.voteActive; voteStartTime = settings.startTime; }
  });
}

function draw() {
  background(15, 22, 35);
  textAlign(CENTER, TOP); fill(255); textSize(30); textStyle(BOLD);
  text("【流光旅人】水晶衝突自訂賽：即時看板系統", width / 2, 25);

  drawPool("隊伍 A", teams[0], 140, 200, "#2ecc71", teamScores[0]);
  drawPool("隊伍 B", teams[1], 140, 425, "#3498db", teamScores[1]);
  drawPool("隊伍 C", teams[2], 140, 650, "#e74c3c", teamScores[2]);

  drawMatchSchedule(475, 475);
  drawFinalBracket(820, 375);
  drawLivePoll(820, 680);
  drawPrizePanel(820, 845);

  if (showVoteList) drawVoteDetailOverlay(); // 畫出明細浮層
  if (gamePhase === 3) drawVictoryScreen();
  if (isRolling) drawRollingOverlay();
  if (gamePhase === 0 && !isRolling) drawStartButton();

  if (warningFlash > 0) {
    fill(255, 255, 0, warningFlash);
    textSize(20); textStyle(BOLD); textAlign(CENTER);
    text("⚠️ 請先填寫比分再選擇勝負", width / 2, height - 120);
    warningFlash -= 5;
  }
}

// --- 繪圖組件 ---
function drawPool(name, members, x, y, clr, score) {
  fill(clr); rect(x, y, 220, 45, 8); fill(0, 100); rect(x + 75, y, 55, 30, 5);
  fill(255); textAlign(LEFT, CENTER); textSize(18); textStyle(BOLD); text(name, x - 100, y);
  textAlign(CENTER, CENTER); textSize(16); text("Pts:" + score, x + 75, y);
  fill(255, 10); rect(x, y + 102, 220, 160, 0, 0, 8, 8);
  textStyle(NORMAL);
  for (let i = 0; i < 5; i++) { fill(members[i] ? 255 : 80); textAlign(LEFT); text(`${i + 1}. ${members[i] || "---"}`, x - 95, y + 45 + (i * 28)); }
}

function drawMatchSchedule(x, y) {
  fill(255, 5); rect(x, y, 350, 750, 15);
  fill(255); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD);
  text("第一階段：輪戰積分賽", x, y - 340);
  if (currentIndex < 15) return;
  for (let i = 0; i < 6; i++) {
    let m = matches[i]; let ty = 170 + (i * 110);
    fill(255, 8); rect(x, ty + 45, 320, 95, 12);
    fill(180); textSize(12); textStyle(NORMAL); text(`ROUND ${i + 1}`, x, ty + 12);
    let canClick = m.score.trim() !== "";
    drawVirtualBtn(x - 120, ty + 45, 60, 35, ["A 隊", "B 隊", "C 隊"][m.t1], m.winner === m.t1, canClick);
    fill(150); textSize(18); text("VS", x, ty + 45);
    drawVirtualBtn(x + 120, ty + 45, 60, 35, ["A 隊", "B 隊", "C 隊"][m.t2], m.winner === m.t2, canClick);
    fill(activeInput.type === 'match' && activeInput.index === i ? "#f1c40f" : 100);
    textSize(13); text(m.score === "" ? "點擊填寫比分" : m.score, x, ty + 80);
  }
}

function drawFinalBracket(x, y) {
  fill(255, 8); stroke(gamePhase >= 2 ? "#f1c40f" : 50); strokeWeight(2);
  rect(x, y, 280, 480, 15); noStroke();
  fill(gamePhase >= 2 ? "#f1c40f" : 100); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD);
  text("第二階段：決賽 (Bo3)", x, y - 205);
  if (gamePhase < 2) return;
  let tNames = ["A 隊", "B 隊", "C 隊"];
  drawVirtualBtn(x - 80, 215, 80, 35, tNames[finalTeams[0]], true, true);
  fill(255); textSize(14); textStyle(NORMAL); text("VS", x, 215);
  drawVirtualBtn(x + 80, 215, 80, 35, tNames[finalTeams[1]], true, true);
  let isBo3Done = (finalMatches.filter(m => m.winner === 0).length >= 2 || finalMatches.filter(m => m.winner === 1).length >= 2);
  for (let i = 0; i < 3; i++) {
    let ty = 295 + (i * 105);
    fill(255, 5); rect(x, ty + 30, 250, 90, 10);
    fill(150); textSize(12); text(`Game ${i + 1}`, x, ty - 5);
    let hasScore = finalMatches[i].score.trim() !== "";
    let btnEnabled = (!isBo3Done || finalMatches[i].winner !== -1) && hasScore;
    drawVirtualBtn(x - 80, ty + 30, 60, 30, "WIN", finalMatches[i].winner === 0, btnEnabled);
    drawVirtualBtn(x + 80, ty + 30, 60, 30, "WIN", finalMatches[i].winner === 1, btnEnabled);
    fill(activeInput.type === 'final' && activeInput.index === i ? "#f1c40f" : 100);
    textSize(12); text(finalMatches[i].score === "" ? "填寫比分" : finalMatches[i].score, x, ty + 65);
  }
}

function drawLivePoll(x, y) {
  fill(255, 5); rect(x, y, 280, 140, 15);
  fill(255); textAlign(LEFT, CENTER); textSize(18); textStyle(BOLD); text("📊 預測比例", x - 120, y - 45);

  // 「查看」按鈕
  drawVirtualBtn(x + 95, y - 45, 55, 25, "查看", showVoteList, true);

  let remain = 0;
  if (voteActive && voteStartTime > 0) {
    remain = Math.max(0, voteDuration - Math.floor((Date.now() - voteStartTime) / 1000));
    if (remain <= 0) db.ref('settings/voteActive').set(false);
  }
  textSize(13); fill(remain > 0 ? "#f1c40f" : 150); textStyle(NORMAL);
  text(remain > 0 ? `⏳ 剩餘: ${Math.floor(remain / 60)}分${remain % 60}秒` : "🛑 預測已截止", x - 120, y - 20);

  drawVoteBar(x, y + 15, "A 隊", voteCounts.A, voteCounts.total, "#2ecc71");
  drawVoteBar(x, y + 40, "B 隊", voteCounts.B, voteCounts.total, "#3498db");
  drawVoteBar(x, y + 65, "C 隊", voteCounts.C, voteCounts.total, "#e74c3c");
}

function drawVoteBar(x, y, label, count, total, clr) {
  let maxW = 160; let w = total > 0 ? (count / total) * maxW : 0;
  fill(255, 20); noStroke(); rect(x + 30, y, maxW, 10, 5);
  fill(clr); rect(x + 30 - (maxW - w) / 2, y, w, 10, 5);
  fill(255); textSize(12); text(`${label}: ${count} 票`, x - 120, y + 2);
}

function drawVoteDetailOverlay() {
  push();
  fill(0, 240); stroke("#f1c40f"); strokeWeight(2);
  rect(width / 2, height / 2, 450, 750, 15);
  noStroke(); fill("#f1c40f"); textSize(24); textStyle(BOLD); textAlign(CENTER);
  text("🗳️ 預測明細 (點擊外側關閉)", width / 2, height / 2 - 340);

  textSize(15); textAlign(LEFT);
  for (let i = 0; i < allVotes.length && i < 28; i++) {
    let v = allVotes[i];
    let ty = height / 2 - 300 + (i * 24);
    let clr = v.team === 'A' ? "#2ecc71" : (v.team === 'B' ? "#3498db" : "#e74c3c");
    fill(200); text(`${i + 1}. ${v.id}`, width / 2 - 180, ty);
    fill(clr); text(`[${v.team} 隊贏]`, width / 2 + 80, ty);
  }
  if (allVotes.length > 28) { fill(150); text("... 僅顯示前 28 筆", width / 2 - 50, height / 2 + 350); }
  pop();
}

function drawPrizePanel(x, y) {
  fill(255, 5); rect(x, y, 280, 160, 15);
  fill(255); textAlign(LEFT); textSize(18); textStyle(BOLD); text("🎁 賽事獎項", x - 120, y - 55);
  textSize(13); fill("#f1c40f"); text("🏆 第一名: 坐騎 720 (5人)", x - 120, y - 25);
  fill("#bdc3c7"); text("🥈 第二名: 服飾 540 (5人)", x - 120, y + 5);
  fill("#cd7f32"); text("🥉 第三名: 寵物 150 (5人)", x - 120, y + 35);
  if (finalWinnerIdx !== -1) {
    fill(40, 240, 40); rect(x, y + 110, 200, 35, 8); fill(0); textAlign(CENTER); text("🏆 查看大會結算", x, y + 115);
  }
}

function drawRollingOverlay() {
  fill(0, 230); rect(width / 2, height / 2, width, height);
  fill(255); textSize(40); textStyle(BOLD); textAlign(CENTER); text("名單抽選中...", width / 2, height / 2 - 40);
  fill("#e67e22"); textSize(70); text(rollingName, width / 2, height / 2 + 40);
  if (frameCount % 2 === 0) rollingName = playerNames[Math.floor(Math.random() * playerNames.length)];
  timer++;
  if (timer > 35) {
    isRolling = false; timer = 0; teams[currentIndex % 3].push(shuffledList[currentIndex]); currentIndex++;
    if (currentIndex >= 15) {
      gamePhase = 1;
      if (db) { db.ref('votes').set(null); db.ref('settings').set({ voteActive: true, startTime: Date.now() }); }
    }
  }
}

function drawVictoryScreen() {
  push(); background(10, 15, 25, 250); textAlign(CENTER, CENTER);
  let tNames = ["隊伍 A", "隊伍 B", "隊伍 C"], runnerUp = finalTeams.find(t => t !== finalWinnerIdx), third = [0, 1, 2].find(t => !finalTeams.includes(t));
  fill("#f1c40f"); textSize(45); textStyle(BOLD); text("🏆 賽事榮耀結算 🏆", width / 2, 60);
  drawRankBox(width / 2, 260, "🥇 冠軍隊伍", tNames[finalWinnerIdx], finalWinnerIdx, "#f1c40f", "坐騎 720", true);
  drawRankBox(width / 2 - 260, 600, "🥈 亞軍隊伍", tNames[runnerUp], runnerUp, "#bdc3c7", "服飾 540", false);
  drawRankBox(width / 2 + 260, 600, "🥉 季軍隊伍", tNames[third], third, "#cd7f32", "寵物 150", false);
  fill(255, 200); textSize(16); text("✨ 特別感謝贊助：罐裝五穀米 ✨", width / 2, height - 130);
  fill(60); rect(width / 2, height - 60, 180, 40, 8); fill(255); text("返回看板", width / 2, height - 60);
  pop();
}

function drawRankBox(x, y, rank, tName, tIdx, clr, prize, isWinner) {
  fill(255, 5); stroke(clr); rect(x, y, isWinner ? 540 : 400, isWinner ? 320 : 220, 15); noStroke();
  fill(clr); textSize(isWinner ? 32 : 24); textStyle(BOLD); text(rank + " - " + tName, x, y - (isWinner ? 130 : 80));
  fill(255); textSize(15); textStyle(NORMAL); text("獎品：" + prize, x, y - (isWinner ? 100 : 55));
  fill(200); textSize(14); text(teams[tIdx].join(" 、 "), x, y - (isWinner ? 75 : 30), isWinner ? 500 : 360, 50);
}

function setWinner(mIdx, tIdx) {
  if (matches[mIdx].score.trim() === "") { warningFlash = 255; return; }
  matches[mIdx].winner = tIdx; calculateTotalScores();
  if (matches.every(m => m.winner !== -1) && gamePhase === 1) {
    gamePhase = 2; let sorted = [0, 1, 2].sort((a, b) => teamScores[b] - teamScores[a]); finalTeams = [sorted[0], sorted[1]];
  }
}

function calculateTotalScores() {
  teamScores = [0, 0, 0];
  matches.forEach(m => { if (m.winner !== -1) { let loser = (m.winner === m.t1) ? m.t2 : m.t1; teamScores[m.winner] += 3; teamScores[loser] += 1; } });
}

function checkBo3Winner(mIdx, winIdx) {
  if (finalMatches[mIdx].score.trim() === "") { warningFlash = 255; return; }
  finalMatches[mIdx].winner = winIdx;
  let t0W = finalMatches.filter(m => m.winner === 0).length, t1W = finalMatches.filter(m => m.winner === 1).length;
  if (t0W >= 2) { finalWinnerIdx = finalTeams[0]; gamePhase = 3; }
  else if (t1W >= 2) { finalWinnerIdx = finalTeams[1]; gamePhase = 3; }
}

function mouseClicked() {
  if (isRolling) return;
  // 如果明細開著，點擊任何地方關閉
  if (showVoteList) { showVoteList = false; return; }

  // 點擊「查看」按鈕
  if (dist(mouseX, mouseY, 820 + 95, 680 - 45) < 30) { showVoteList = true; return; }

  if (gamePhase === 3 && dist(mouseX, mouseY, width / 2, height - 60) < 60) { gamePhase = 2; return; }
  if (finalWinnerIdx !== -1 && dist(mouseX, mouseY, 820, 955) < 100) { gamePhase = 3; return; }
  if (gamePhase === 0 && dist(mouseX, mouseY, width / 2, height / 2) < 100) isRolling = true;
  if (gamePhase === 1) {
    for (let i = 0; i < 6; i++) {
      let ty = 170 + (i * 110);
      if (dist(mouseX, mouseY, 475 - 120, ty + 45) < 35) setWinner(i, matches[i].t1);
      if (dist(mouseX, mouseY, 475 + 120, ty + 45) < 35) setWinner(i, matches[i].t2);
      if (dist(mouseX, mouseY, 475, ty + 80) < 40) activeInput = { type: 'match', index: i };
    }
  }
  if (gamePhase === 2) {
    for (let i = 0; i < 3; i++) {
      let ty = 295 + (i * 105);
      if (dist(mouseX, mouseY, 820 - 80, ty + 30) < 30) checkBo3Winner(i, 0);
      if (dist(mouseX, mouseY, 820 + 80, ty + 30) < 30) checkBo3Winner(i, 1);
      if (dist(mouseX, mouseY, 820, ty + 65) < 40) activeInput = { type: 'final', index: i };
    }
  }
}

function keyPressed() {
  if (activeInput.index === -1) return;
  let target = (activeInput.type === 'match') ? matches[activeInput.index] : finalMatches[activeInput.index];
  if (keyCode === BACKSPACE) target.score = target.score.slice(0, -1);
  else if (keyCode === ENTER || keyCode === ESCAPE) activeInput = { type: null, index: -1 };
  else if (key.length === 1) target.score += key;
}

function drawVirtualBtn(x, y, w, h, label, isActive, enabled) {
  if (!enabled) fill(40, 150); else if (isActive) fill("#f1c40f"); else fill(60);
  rect(x, y, w, h, 8); fill(isActive ? 0 : 255); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD); text(label, x, y);
}

function drawStartButton() { drawVirtualBtn(width / 2, height / 2, 200, 80, "🎲 開始抽人", false, true); }