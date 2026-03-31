/**
 * 【流光旅人】水晶衝突看板 V24 - 自動同步名單版
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
let currentIndex = 0, isRolling = false, rollingName = "", timer = 0, gamePhase = 0;
let teamScores = [0, 0, 0];
let matches = [
  { t1: 0, t2: 1, winner: -1, score: "" }, { t1: 1, t2: 2, winner: -1, score: "" }, { t1: 2, t2: 0, winner: -1, score: "" },
  { t1: 0, t2: 1, winner: -1, score: "" }, { t1: 1, t2: 2, winner: -1, score: "" }, { t1: 2, t2: 0, winner: -1, score: "" }
];

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
let allVotes = [], showVoteList = false;
let finalTeams = [0, 1], finalWinnerIdx = -1, activeInput = { type: null, index: -1 }, warningFlash = 0;
let finalMatches = [{ winner: -1, score: "" }, { winner: -1, score: "" }, { winner: -1, score: "" }];

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

  if (showVoteList) drawVoteDetailOverlay();
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

function drawLivePoll(x, y) {
  fill(255, 5); rect(x, y, 280, 140, 15);
  fill(255); textAlign(LEFT, CENTER); textSize(18); textStyle(BOLD); text("📊 預測比例", x - 120, y - 45);
  drawVirtualBtn(x + 100, y - 45, 50, 25, "查看", showVoteList, true);
  let remain = 0;
  if (voteActive && voteStartTime > 0) {
    remain = Math.max(0, voteDuration - Math.floor((Date.now() - voteStartTime) / 1000));
    if (remain <= 0) db.ref('settings/voteActive').set(false);
  }
  textSize(13); fill(remain > 0 ? "#f1c40f" : 150); textStyle(NORMAL); textAlign(LEFT, CENTER);
  text(remain > 0 ? `⏳ 剩餘: ${Math.floor(remain / 60)}分${remain % 60}秒` : "🛑 預測已截止", x - 120, y - 20);
  drawVoteBar(x, y + 15, "A 隊", voteCounts.A, voteCounts.total, "#2ecc71");
  drawVoteBar(x, y + 40, "B 隊", voteCounts.B, voteCounts.total, "#3498db");
  drawVoteBar(x, y + 65, "C 隊", voteCounts.C, voteCounts.total, "#e74c3c");
}

function drawVoteDetailOverlay() {
  push();
  fill(0, 248); stroke("#f1c40f"); strokeWeight(2);
  rect(width / 2, height / 2 + 30, 950, 830, 15);
  noStroke(); fill("#f1c40f"); textSize(26); textStyle(BOLD); textAlign(CENTER);
  text("🗳️ 預測名單分組 (點擊外側關閉)", width / 2, 80);
  let colA = [], colB = [], colC = [];
  allVotes.forEach(v => {
    if (v.team === 'A') colA.push(v.id);
    else if (v.team === 'B') colB.push(v.id);
    else if (v.team === 'C') colC.push(v.id);
  });
  drawVoteColumn(50, 140, "🟢 隊伍 A 支持者", colA, "#2ecc71");
  drawVoteColumn(360, 140, "🔵 隊伍 B 支持者", colB, "#3498db");
  drawVoteColumn(670, 140, "🔴 隊伍 C 支持者", colC, "#e74c3c");
  pop();
}

function drawVoteColumn(x, y, title, list, clr) {
  push(); translate(x, y); fill(clr); textSize(20); textAlign(LEFT); textStyle(BOLD);
  text(title + ` (${list.length}人)`, 0, 0);
  fill(255); textSize(13); textStyle(NORMAL);
  let rowHeight = 22, colWidth = 140, maxRows = 34;
  for (let i = 0; i < list.length; i++) {
    let colIndex = Math.floor(i / maxRows), rowIndex = i % maxRows;
    let displayName = list[i], availableW = colWidth - 30;
    if (textWidth(displayName) > availableW) {
      while (textWidth(displayName + "..") > availableW && displayName.length > 0) displayName = displayName.substring(0, displayName.length - 1);
      displayName += "..";
    }
    fill(180); text(`${i + 1}.`, colIndex * colWidth, 35 + (rowIndex * rowHeight));
    fill(255); text(displayName, colIndex * colWidth + 25, 35 + (rowIndex * rowHeight));
  }
  pop();
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
      if (db) {
        db.ref('votes').set(null);
        db.ref('settings').set({ voteActive: true, startTime: Date.now() });
        db.ref('currentTeams').set({ A: teams[0], B: teams[1], C: teams[2] }); // 同步名單
      }
    }
  }
}

// --- 其餘功能模組 ---
function drawPool(n, m, x, y, c, s) {
  fill(c); rect(x, y, 220, 45, 8); fill(0, 100); rect(x + 75, y, 55, 30, 5);
  fill(255); textAlign(LEFT, CENTER); textSize(18); textStyle(BOLD); text(n, x - 100, y);
  textAlign(CENTER, CENTER); textSize(16); text("Pts:" + s, x + 75, y);
  fill(255, 10); rect(x, y + 102, 220, 160, 0, 0, 8, 8);
  for (let i = 0; i < 5; i++) { fill(m[i] ? 255 : 80); textAlign(LEFT); text(`${i + 1}. ${m[i] || "---"}`, x - 95, y + 45 + (i * 28)); }
}

function drawMatchSchedule(x, y) {
  fill(255, 5); rect(x, y, 350, 750, 15);
  fill(255); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD); text("第一階段：輪戰積分賽", x, y - 340);
  if (currentIndex < 15) return;
  for (let i = 0; i < 6; i++) {
    let m = matches[i], ty = 170 + (i * 110);
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
  fill(255, 8); stroke(gamePhase >= 2 ? "#f1c40f" : 50); strokeWeight(2); rect(x, y, 280, 480, 15); noStroke();
  fill(gamePhase >= 2 ? "#f1c40f" : 100); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD); text("第二階段：決賽 (Bo3)", x, y - 205);
  if (gamePhase < 2) return;
  let tN = ["A 隊", "B 隊", "C 隊"];
  drawVirtualBtn(x - 80, 215, 80, 35, tN[finalTeams[0]], true, true);
  fill(255); textSize(14); text("VS", x, 215);
  drawVirtualBtn(x + 80, 215, 80, 35, tN[finalTeams[1]], true, true);
  for (let i = 0; i < 3; i++) {
    let ty = 295 + (i * 105), hasS = finalMatches[i].score !== "", bE = hasS;
    fill(255, 5); rect(x, ty + 30, 250, 90, 10);
    drawVirtualBtn(x - 80, ty + 30, 60, 30, "WIN", finalMatches[i].winner === 0, bE);
    drawVirtualBtn(x + 80, ty + 30, 60, 30, "WIN", finalMatches[i].winner === 1, bE);
    fill(activeInput.type === 'final' && activeInput.index === i ? "#f1c40f" : 100);
    text(finalMatches[i].score === "" ? "填寫比分" : finalMatches[i].score, x, ty + 65);
  }
}

function drawVoteBar(x, y, l, c, t, cl) {
  let mw = 160, w = t > 0 ? (c / t) * mw : 0;
  fill(255, 20); rect(x + 30, y, mw, 10, 5);
  fill(cl); rect(x + 30 - (mw - w) / 2, y, w, 10, 5);
  fill(255); textSize(12); text(`${l}: ${c} 票`, x - 120, y + 2);
}

function drawPrizePanel(x, y) {
  fill(255, 5); rect(x, y, 280, 160, 15);
  fill(255); textAlign(LEFT); textSize(18); textStyle(BOLD); text("🎁 賽事獎項", x - 120, y - 55);
  textSize(13); fill("#f1c40f"); text("🏆 第一名: 坐騎 720 (5人)", x - 120, y - 25);
  fill("#bdc3c7"); text("🥈 第二名: 服飾 540 (5人)", x - 120, y + 5);
  fill("#cd7f32"); text("🥉 第三名: 寵物 150 (5人)", x - 120, y + 35);
}

function drawVictoryScreen() {
  push(); background(10, 15, 25, 250); textAlign(CENTER, CENTER);
  let tN = ["隊伍 A", "隊伍 B", "隊伍 C"], rU = finalTeams.find(t => t !== finalWinnerIdx), th = [0, 1, 2].find(t => !finalTeams.includes(t));
  fill("#f1c40f"); textSize(45); textStyle(BOLD); text("🏆 賽事榮耀結算 🏆", width / 2, 60);
  drawRankBox(width / 2, 260, "🥇 冠軍隊伍", tN[finalWinnerIdx], finalWinnerIdx, "#f1c40f", "坐騎 720", true);
  drawRankBox(width / 2 - 260, 600, "🥈 亞軍隊伍", tN[rU], rU, "#bdc3c7", "服飾 540", false);
  drawRankBox(width / 2 + 260, 600, "🥉 季軍隊伍", tN[th], th, "#cd7f32", "寵物 150", false);
  fill(60); rect(width / 2, height - 60, 180, 40, 8); fill(255); text("返回看板", width / 2, height - 60);
  pop();
}

function drawRankBox(x, y, r, n, i, c, p, w) {
  fill(255, 5); stroke(c); rect(x, y, w ? 540 : 400, w ? 320 : 220, 15); noStroke();
  fill(c); textSize(w ? 32 : 24); textStyle(BOLD); text(r + " - " + n, x, y - (w ? 130 : 80));
  fill(255); textSize(15); textStyle(NORMAL); text("獎品：" + p, x, y - (w ? 100 : 55));
  fill(200); text(teams[i].join(" 、 "), x, y - (w ? 75 : 30), w ? 500 : 360, 50);
}

function setWinner(mIdx, tIdx) {
  if (matches[mIdx].score.trim() === "") { warningFlash = 255; return; }
  matches[mIdx].winner = tIdx; teamScores = [0, 0, 0];
  matches.forEach(m => { if (m.winner !== -1) { let l = (m.winner === m.t1) ? m.t2 : m.t1; teamScores[m.winner] += 3; teamScores[l] += 1; } });
  if (matches.every(m => m.winner !== -1) && gamePhase === 1) {
    gamePhase = 2; let s = [0, 1, 2].sort((a, b) => teamScores[b] - teamScores[a]); finalTeams = [s[0], s[1]];
  }
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
  if (showVoteList) { showVoteList = false; return; }
  if (dist(mouseX, mouseY, 820 + 100, 680 - 45) < 30) { showVoteList = true; return; }
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

function drawVirtualBtn(x, y, w, h, l, a, e) {
  if (!e) fill(40, 150); else if (a) fill("#f1c40f"); else fill(60);
  rect(x, y, w, h, 8); fill(a ? 0 : 255); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD); text(l, x, y);
}

function drawStartButton() { drawVirtualBtn(width / 2, height / 2, 200, 80, "🎲 開始抽人", false, true); }