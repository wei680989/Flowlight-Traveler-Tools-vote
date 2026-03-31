/**
 * 【流光旅人】水晶衝突自訂賽看板 V28 - 終極修正版
 * 修正內容：Bo3 自選隊伍、結算戰績紀錄、鎖定點選功能、排版修正
 */

let playerNames = ["突擊兔邦妮", "Neil", "哈密瓜牛奶", "Soph1a", "西瓜牛奶", "鑢七椋", "奈莎", "吼哩拎醉", "一包黑芝麻", "戰鎖鎖不住", "無糖珍珠奶茶", "Usachi", "本", "楓紅", "武破子"];
let shuffledList = [];
let teams = [[], [], []];
let currentIndex = 0;
let isRolling = false, rollingName = "", timer = 0;

let gamePhase = 0; // 0: 準備, 1: 積分賽, 2: 決賽, 3: 總結算
let teamScores = [0, 0, 0];
let matches = [
  { t1: 0, t2: 1, winner: -1, score: "" }, { t1: 1, t2: 2, winner: -1, score: "" }, { t1: 2, t2: 0, winner: -1, score: "" },
  { t1: 0, t2: 1, winner: -1, score: "" }, { t1: 1, t2: 2, winner: -1, score: "" }, { t1: 2, t2: 0, winner: -1, score: "" }
];

let finalTeams = [0, 1]; // 決賽對戰隊伍
let finalMatches = [{ winner: -1, score: "" }, { winner: -1, score: "" }, { winner: -1, score: "" }];
let finalWinnerIdx = -1;
let activeInput = { type: null, index: -1 };
let warningFlash = 0;

function setup() {
  createCanvas(1000, 1050); // 拉高畫布防止遮擋
  shuffledList = customShuffle([...playerNames]);
  rectMode(CENTER);
}

function draw() {
  background(15, 22, 35);

  // 頂部大標題
  textAlign(CENTER, TOP); fill(255); textSize(30); textStyle(BOLD);
  text("【流光旅人】水晶衝突自訂賽：即時看板系統", width / 2, 25);

  // 隊伍資訊欄
  drawPool("隊伍 A", teams[0], 140, 200, "#2ecc71", teamScores[0]);
  drawPool("隊伍 B", teams[1], 140, 425, "#3498db", teamScores[1]);
  drawPool("隊伍 C", teams[2], 140, 650, "#e74c3c", teamScores[2]);

  // 主要賽程區
  drawMatchSchedule(475, 520);
  drawFinalBracket(820, 420);
  drawPrizePanel(820, 850);

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

function drawMatchSchedule(x, y) {
  fill(255, 5); rect(x, y, 350, 840, 15);
  fill(255); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD);
  text("第一階段：輪戰積分賽", x, y - 380);

  if (currentIndex < 15) return;

  for (let i = 0; i < 6; i++) {
    let m = matches[i];
    let ty = y - 320 + (i * 125);
    fill(255, 8); rect(x, ty + 45, 320, 105, 12);
    fill(180); textSize(12); textStyle(NORMAL); text(`ROUND ${i + 1}`, x, ty + 12);

    let canClick = m.score.trim() !== "";
    drawVirtualBtn(x - 120, ty + 45, 60, 35, ["A 隊", "B 隊", "C 隊"][m.t1], m.winner === m.t1, canClick);
    fill(150); textSize(18); text("VS", x, ty + 45);
    drawVirtualBtn(x + 120, ty + 45, 60, 35, ["A 隊", "B 隊", "C 隊"][m.t2], m.winner === m.t2, canClick);

    fill(activeInput.type === 'match' && activeInput.index === i ? "#f1c40f" : 100);
    textSize(13); text(m.score === "" ? "點擊填寫比分" : m.score, x, ty + 85);
  }
}

function drawFinalBracket(x, y) {
  fill(255, 8); stroke(gamePhase >= 2 ? "#f1c40f" : 50); strokeWeight(2); rect(x, y, 280, 640, 15); noStroke();
  fill(gamePhase >= 2 ? "#f1c40f" : 100); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD); text("第二階段：決賽 (Bo3)", x, y - 280);

  if (gamePhase < 2) return;

  let tN = ["A 隊", "B 隊", "C 隊"];
  let isBo3Done = (finalMatches.filter(m => m.winner === 0).length >= 2 || finalMatches.filter(m => m.winner === 1).length >= 2);

  // 隊伍選擇按鈕
  drawVirtualBtn(x - 80, y - 220, 80, 40, tN[finalTeams[0]], true, !isBo3Done);
  fill(255); textSize(14); text("VS", x, y - 220);
  drawVirtualBtn(x + 80, y - 220, 80, 40, tN[finalTeams[1]], true, !isBo3Done);
  fill(255, 120); textSize(11); textStyle(NORMAL); text("(點擊名稱切換隊伍)", x, y - 190);

  for (let i = 0; i < 3; i++) {
    let ty = y - 150 + (i * 140);
    fill(255, 5); rect(x, ty + 40, 250, 110, 10);
    fill(150); text(`Game ${i + 1}`, x, ty + 10);
    let hasS = finalMatches[i].score.trim() !== "";
    // 如果比賽結束，鎖定點選
    drawVirtualBtn(x - 80, ty + 45, 60, 35, "WIN", finalMatches[i].winner === 0, hasS && !isBo3Done);
    drawVirtualBtn(x + 80, ty + 45, 60, 35, "WIN", finalMatches[i].winner === 1, hasS && !isBo3Done);
    fill(activeInput.type === 'final' && activeInput.index === i ? "#f1c40f" : 100);
    text(finalMatches[i].score === "" ? "填寫比分" : finalMatches[i].score, x, ty + 90);
  }
}

function drawPrizePanel(x, y) {
  fill(255, 5); rect(x, y, 280, 180, 15);
  fill(255); textAlign(LEFT); textSize(18); textStyle(BOLD); text("🎁 賽事獎項", x - 120, y - 60);
  textSize(14); fill("#f1c40f"); text("🥇 第一名: 坐騎 720 (5人)", x - 120, y - 25);
  fill("#bdc3c7"); text("🥈 第二名: 服飾 540 (5人)", x - 120, y + 5);
  fill("#cd7f32"); text("🥉 第三名: 寵物 150 (5人)", x - 120, y + 35);
  if (finalWinnerIdx !== -1) {
    drawVirtualBtn(x, y + 65, 220, 40, "🏆 查看大會結算", true, true);
  }
}

function drawVictoryScreen() {
  push(); background(10, 15, 25, 252); textAlign(CENTER, CENTER);
  let tN = ["隊伍 A", "隊伍 B", "隊伍 C"];
  let rU = finalTeams.find(t => t !== finalWinnerIdx);
  let th = [0, 1, 2].find(t => !finalTeams.includes(t));

  fill("#f1c40f"); textSize(45); textStyle(BOLD); text("🏆 賽事榮耀結算 🏆", width / 2, 60);

  drawRankBox(width / 2, 300, "🥇 冠軍隊伍", tN[finalWinnerIdx], finalWinnerIdx, "#f1c40f", "坐騎 720", true);
  drawRankBox(width / 2 - 260, 680, "🥈 亞軍隊伍", tN[rU], rU, "#bdc3c7", "服飾 540", false);
  drawRankBox(width / 2 + 260, 680, "🥉 季軍隊伍", tN[th], th, "#cd7f32", "寵物 150", false);

  fill(255, 180); textSize(17); textStyle(BOLD);
  text("✨ 特別感謝贊助：罐裝五穀米 ✨", width / 2, height - 130);

  fill(60); rect(width / 2, height - 60, 180, 45, 8);
  fill(255); textSize(18); text("返回看板", width / 2, height - 60);
  pop();
}

function drawRankBox(x, y, r, n, i, c, p, w) {
  fill(255, 5); stroke(c); strokeWeight(2); rect(x, y, w ? 580 : 420, w ? 400 : 250, 15); noStroke();
  fill(c); textSize(w ? 32 : 24); textStyle(BOLD); text(r + " - " + n, x, y - (w ? 160 : 90));
  fill(255); textSize(15); textStyle(NORMAL); text("獎品：" + p, x, y - (w ? 130 : 65));
  fill(200); text(teams[i].join(" 、 "), x, y - (w ? 100 : 35), w ? 540 : 380, 60);

  if (w) {
    fill(c); textSize(18); textStyle(BOLD); text("— 冠軍之路戰績紀錄 —", x, y - 20);
    let logs = [];
    matches.forEach((m, idx) => {
      if (m.t1 === i || m.t2 === i) {
        let opp = (m.t1 === i) ? m.t2 : m.t1;
        logs.push({ lab: `積分 R${idx + 1}`, vs: ["A", "B", "C"][opp], sc: m.score, win: m.winner === i });
      }
    });
    finalMatches.forEach((m, idx) => {
      if (m.winner !== -1) {
        let winT = finalTeams[m.winner];
        logs.push({ lab: `決賽 G${idx + 1}`, vs: (winT === i) ? ["A", "B", "C"][finalTeams[m.winner == 0 ? 1 : 0]] : ["A", "B", "C"][finalTeams[m.winner]], sc: m.score, win: winT === i });
      }
    });

    textSize(14); textStyle(NORMAL);
    for (let k = 0; k < logs.length; k++) {
      let lx = (k < 5) ? x - 140 : x + 140;
      let ly = y + 15 + (k % 5) * 25;
      let log = logs[k];
      fill(log.win ? c : 150); textAlign(LEFT); text(`${log.lab} vs ${log.vs}隊`, lx - 100, ly);
      textAlign(RIGHT); text(`${log.sc} (${log.win ? '勝' : '敗'})`, lx + 110, ly);
    }
    textAlign(CENTER);
  }
}

// --- 邏輯函數 ---

function setWinner(mIdx, tIdx) {
  if (matches[mIdx].score.trim() === "") { warningFlash = 255; return; }
  matches[mIdx].winner = tIdx;
  teamScores = [0, 0, 0];
  matches.forEach(m => {
    if (m.winner !== -1) {
      let l = (m.winner === m.t1) ? m.t2 : m.t1;
      teamScores[m.winner] += 3; teamScores[l] += 1;
    }
  });
  if (matches.every(m => m.winner !== -1) && gamePhase === 1) {
    gamePhase = 2;
    let s = [0, 1, 2].sort((a, b) => teamScores[b] - teamScores[a]);
    finalTeams = [s[0], s[1]];
  }
}

function checkBo3Winner(mIdx, winIdx) {
  if (finalMatches[mIdx].score.trim() === "") { warningFlash = 255; return; }
  finalMatches[mIdx].winner = winIdx;
  let t0W = finalMatches.filter(m => m.winner === 0).length;
  let t1W = finalMatches.filter(m => m.winner === 1).length;
  if (t0W >= 2) { finalWinnerIdx = finalTeams[0]; gamePhase = 3; }
  else if (t1W >= 2) { finalWinnerIdx = finalTeams[1]; gamePhase = 3; }
}

function mouseClicked() {
  if (isRolling) return;
  if (gamePhase === 3 && dist(mouseX, mouseY, width / 2, height - 60) < 60) { gamePhase = 2; return; }
  if (finalWinnerIdx !== -1 && dist(mouseX, mouseY, 820, 915) < 100) { gamePhase = 3; return; }
  if (gamePhase === 0 && dist(mouseX, mouseY, width / 2, height / 2) < 100) isRolling = true;

  if (gamePhase === 1) {
    for (let i = 0; i < 6; i++) {
      let ty = 520 - 320 + (i * 125);
      if (dist(mouseX, mouseY, 475 - 120, ty + 45) < 35) setWinner(i, matches[i].t1);
      if (dist(mouseX, mouseY, 475 + 120, ty + 45) < 35) setWinner(i, matches[i].t2);
      if (dist(mouseX, mouseY, 475, ty + 85) < 40) activeInput = { type: 'match', index: i };
    }
  }

  if (gamePhase === 2) {
    // 隊伍手動更換邏輯
    if (dist(mouseX, mouseY, 820 - 80, 200) < 40) {
      finalTeams[0] = (finalTeams[0] + 1) % 3;
      if (finalTeams[0] === finalTeams[1]) finalTeams[0] = (finalTeams[0] + 1) % 3;
      finalMatches = [{ winner: -1, score: "" }, { winner: -1, score: "" }, { winner: -1, score: "" }];
    }
    if (dist(mouseX, mouseY, 820 + 80, 200) < 40) {
      finalTeams[1] = (finalTeams[1] + 1) % 3;
      if (finalTeams[1] === finalTeams[0]) finalTeams[1] = (finalTeams[1] + 1) % 3;
      finalMatches = [{ winner: -1, score: "" }, { winner: -1, score: "" }, { winner: -1, score: "" }];
    }

    for (let i = 0; i < 3; i++) {
      let ty = 420 - 150 + (i * 140);
      if (dist(mouseX, mouseY, 820 - 80, ty + 45) < 30) checkBo3Winner(i, 0);
      if (dist(mouseX, mouseY, 820 + 80, ty + 45) < 30) checkBo3Winner(i, 1);
      if (dist(mouseX, mouseY, 820, ty + 90) < 40) activeInput = { type: 'final', index: i };
    }
  }
}

// 其餘鍵盤輸入與工具函數保持不變...
function keyPressed() {
  if (activeInput.index === -1) return;
  let target = (activeInput.type === 'match') ? matches[activeInput.index] : finalMatches[activeInput.index];
  if (keyCode === BACKSPACE) target.score = target.score.slice(0, -1);
  else if (keyCode === ENTER || keyCode === ESCAPE) activeInput = { type: null, index: -1 };
  else if (key.length === 1) target.score += key;
}
function customShuffle(a) { for (let i = a.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function drawVirtualBtn(x, y, w, h, l, a, e) {
  if (!e) fill(40, 150); else if (a) fill("#f1c40f"); else fill(60);
  rect(x, y, w, h, 8); fill(a ? 0 : 255); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD); text(l, x, y);
}
function drawPool(n, m, x, y, c, s) {
  fill(c); rect(x, y, 220, 45, 8); fill(0, 100); rect(x + 75, y, 55, 30, 5);
  fill(255); textAlign(LEFT, CENTER); textSize(18); textStyle(BOLD); text(n, x - 100, y);
  textAlign(CENTER, CENTER); textSize(16); text("Pts:" + s, x + 75, y);
  fill(255, 10); rect(x, y + 102, 220, 160, 0, 0, 8, 8);
  for (let i = 0; i < 5; i++) { fill(m[i] ? 255 : 80); textAlign(LEFT); text(`${i + 1}. ${m[i] || "---"}`, x - 95, y + 45 + (i * 28)); }
}
function drawRollingOverlay() {
  fill(0, 230); rect(width / 2, height / 2, width, height);
  fill(255); textSize(40); textStyle(BOLD); textAlign(CENTER); text("名單抽選中...", width / 2, height / 2 - 40);
  fill("#e67e22"); textSize(70); text(rollingName, width / 2, height / 2 + 40);
  if (frameCount % 2 === 0) rollingName = playerNames[Math.floor(Math.random() * playerNames.length)];
  timer++;
  if (timer > 35) { isRolling = false; timer = 0; teams[currentIndex % 3].push(shuffledList[currentIndex]); currentIndex++; if (currentIndex >= 15) gamePhase = 1; }
}
function drawStartButton() { drawVirtualBtn(width / 2, height / 2, 200, 80, "🎲 開始抽人", false, true); }