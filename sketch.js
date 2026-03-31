/**
 * 【流光旅人】水晶衝突自訂賽看板 V22 - 修正抽選結束卡死 & 獎項優化版
 */

// --- 遊戲核心變數 ---
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

// --- Firebase 與 投票變數 ---
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

let db;
let voteCounts = { A: 0, B: 0, C: 0, total: 0 };
let voteStartTime = 0;
let voteDuration = 600;
let voteActive = false;

let finalTeams = [0, 1];
let finalMatches = [{ winner: -1, score: "" }, { winner: -1, score: "" }, { winner: -1, score: "" }];
let finalWinnerIdx = -1;
let activeInput = { type: null, index: -1 };
let warningFlash = 0;

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
    if (votes) {
      for (let id in votes) {
        let team = votes[id];
        if (counts.hasOwnProperty(team)) { counts[team]++; counts.total++; }
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
  fill(255); textAlign(LEFT, CENTER); textSize(18); textStyle(BOLD);
  text("📊 即時預測比例", x - 120, y - 45);

  let currentTime = Date.now();
  let remaining = 0;
  if (voteActive && voteStartTime > 0) {
    remaining = max(0, voteDuration - floor((currentTime - voteStartTime) / 1000));
    if (remaining <= 0 && voteActive) { db.ref('settings/voteActive').set(false); }
  }

  textSize(13);
  if (remaining > 0) {
    fill("#f1c40f"); text(`⏳ 剩餘: ${floor(remaining / 60)}分${remaining % 60}秒`, x - 120, y - 20);
  } else {
    fill(150); text(voteStartTime > 0 ? "🛑 預測已截止" : "🕒 抽選結束後開啟", x - 120, y - 20);
  }

  drawVoteBar(x, y + 15, "A 隊", voteCounts.A, voteCounts.total, "#2ecc71");
  drawVoteBar(x, y + 40, "B 隊", voteCounts.B, voteCounts.total, "#3498db");
  drawVoteBar(x, y + 65, "C 隊", voteCounts.C, voteCounts.total, "#e74c3c");
}

function drawVoteBar(x, y, label, count, total, clr) {
  let maxW = 160;
  let w = total > 0 ? (count / total) * maxW : 0;
  fill(255, 20); noStroke(); rect(x + 30, y, maxW, 10, 5);
  fill(clr); rect(x + 30 - (maxW - w) / 2, y, w, 10, 5);
  fill(255); textSize(12); textStyle(NORMAL);
  text(`${label}: ${count} 票`, x - 120, y + 2);
}

function drawPrizePanel(x, y) {
  fill(255, 5); rect(x, y, 280, 160, 15);
  fill(255); textAlign(LEFT); textSize(18); textStyle(BOLD); text("🎁 賽事獎勵清單", x - 120, y - 55);

  textSize(13); textStyle(BOLD);
  fill("#f1c40f"); text("🏆 第一名隊伍 (5人)", x - 120, y - 25);
  textStyle(NORMAL); fill(255); text("   • 坐騎 720 × 5", x - 120, y - 5);

  fill("#bdc3c7"); textStyle(BOLD); text("🥈 第二名隊伍 (5人)", x - 120, y + 15);
  textStyle(NORMAL); fill(255); text("   • 服飾 540 × 5", x - 120, y + 35);

  fill("#cd7f32"); textStyle(BOLD); text("🥉 第三名隊伍 (5人)", x - 120, y + 55);
  textStyle(NORMAL); fill(255); text("   • 寵物 150 × 5", x - 120, y + 75);

  if (finalWinnerIdx !== -1) {
    fill(40, 240, 40); rect(x, y + 110, 200, 35, 8);
    fill(0); textAlign(CENTER); textStyle(BOLD); text("🏆 查看賽事大會結算", x, y + 115);
  }
}

function drawRollingOverlay() {
  fill(0, 230); rect(width / 2, height / 2, width, height);
  fill(255); textSize(40); textStyle(BOLD); textAlign(CENTER); text("名單抽選中...", width / 2, height / 2 - 40);
  fill("#e67e22"); textSize(70); text(rollingName, width / 2, height / 2 + 40);
  if (frameCount % 2 === 0) rollingName = playerNames[floor(random(playerNames.length))];
  timer++;
  if (timer > 35) {
    isRolling = false; timer = 0;
    teams[currentIndex % 3].push(shuffledList[currentIndex]);
    currentIndex++;
    if (currentIndex >= 15) {
      gamePhase = 1;
      if (db) {
        db.ref('votes').set(null);
        db.ref('settings').set({ voteActive: true, startTime: Date.now() });
      }
    }
  }
}