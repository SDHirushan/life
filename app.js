'use strict';
const chapters = [
  { year: 2026, name: 'The beginning', place: 'The starting village', title: 'The journey begins.', desc: 'Every future version of you starts here. Build your foundation, choose your direction, and take the first small step.', tasks: ['Define the life I want to build', 'Choose my first 90-day goal', 'Make a weekly learning routine'], x: 480, y: 2440, type: 'camp' },
  { year: 2027, name: 'Career city', place: 'Company headquarters', title: 'A place in the industry.', desc: 'Walk into a company as a professional. Build useful software, learn from your team, and become someone people can count on.', tasks: ['Build a portfolio I can explain', 'Practise interviews and English', 'Earn my first company role'], x: 720, y: 2080, type: 'office' },
  { year: 2028, name: 'Skills academy', place: 'Academy of mastery', title: 'Turn practice into mastery.', desc: 'Develop the core skills that support my career. Keep learning, build real projects, and prove what I can do.', tasks: ['Define my core technical skills', 'Finish a challenging real project', 'Explain and teach what I learned'], x: 370, y: 1720, type: 'academy' },
  { year: 2029, name: 'Network citadel', place: 'Networking command centre', title: 'Reach the next level.', desc: 'Rise to an advanced level in networking through hands-on labs, troubleshooting, and real-world experience.', tasks: ['Build an advanced networking lab', 'Solve and document network faults', 'Demonstrate my networking expertise'], x: 690, y: 1360, type: 'tower' },
  { year: 2030, name: 'Dream garage', place: 'The reward along the road', title: 'The keys to my dream.', desc: 'Own the vehicle I have imagined. Choose the exact model and make a realistic plan for buying and maintaining it.', tasks: ['Choose my dream vehicle', 'Set my purchase and running budget', 'Reach my vehicle savings target'], x: 340, y: 1000, type: 'garage' },
  { year: 2031, name: 'Family palace', place: 'A home for mum and dad', title: 'Give them a beautiful life.', desc: 'Mum and Dad living in a mansion: a home that feels peaceful, comfortable, and full of the life we have built together.', tasks: ['Define our ideal family home', 'Create a realistic home funding plan', 'Move Mum and Dad into their home'], x: 670, y: 640, type: 'palace' },
  { year: 2032, name: 'Freedom summit', place: 'The debt-free summit', title: 'A future that feels free.', desc: 'All debts paid. Celebrate the freedom to make choices, care for the people I love, and start the next adventure.', tasks: ['List balances and repayment goals', 'Track steady repayment progress', 'Confirm every debt is paid'], x: 490, y: 260, type: 'summit' }
];

const monthChapters = [
  { mIndex: 0, name: 'January', place: 'The Dawn Outpost', title: 'New Dawn & Foundations', desc: 'Set your vision for the year, establish your daily foundation, and build early momentum.', tasks: ['Define primary focus for the year', 'Establish morning routine', 'Set 30-day starter sprint'], x: 480, y: 3100, type: 'camp' },
  { mIndex: 1, name: 'February', place: 'The Focus Forge', title: 'Habit & Consistency', desc: 'Turn initial motivation into disciplined consistency. Lock in your workflow and push through friction.', tasks: ['Maintain daily habit streak', 'Complete first project milestone', 'Conduct mid-quarter check-in'], x: 700, y: 2840, type: 'office' },
  { mIndex: 2, name: 'March', place: 'The Spring Outpost', title: 'Quarter 1 Review & Push', desc: 'Finish Q1 strong. Evaluate what worked, adjust your tactics, and lock in your first major win.', tasks: ['Review Q1 goals and deliverables', 'Ship first quarter milestone', 'Plan Q2 strategic focus'], x: 350, y: 2580, type: 'academy' },
  { mIndex: 3, name: 'April', place: 'The Growth Citadel', title: 'Expansion & Knowledge', desc: 'Spring into accelerated learning. Deepen your technical craft and take on more ambitious challenges.', tasks: ['Start new technical skill track', 'Build an end-to-end prototype', 'Audit system performance'], x: 680, y: 2320, type: 'tower' },
  { mIndex: 4, name: 'May', place: 'The Builder’s Yard', title: 'Deep Work & Craftsmanship', desc: 'Get into flow state. Refine your tools, build robust solutions, and create tangible proof of your abilities.', tasks: ['Refactor core project components', 'Document learnings and architecture', 'Prepare mid-year portfolio update'], x: 340, y: 2060, type: 'garage' },
  { mIndex: 5, name: 'June', place: 'The Mid-Year Sanctuary', title: 'Halfway Reflection & Calibration', desc: 'Celebrate the first six months. Take stock of how far you’ve journeyed and set sights on the second half.', tasks: ['Conduct 6-month retrospective', 'Celebrate wins achieved so far', 'Recalibrate remaining objectives'], x: 670, y: 1800, type: 'palace' },
  { mIndex: 6, name: 'July', place: 'The High Oasis', title: 'Renewed Energy & Ambition', desc: 'Kick off Q3 with high energy. Tackle the hardest challenge on your roadmap while enthusiasm is high.', tasks: ['Initiate major Q3 project sprint', 'Experiment with new techniques', 'Engage with industry community'], x: 360, y: 1540, type: 'camp' },
  { mIndex: 7, name: 'August', place: 'The Endurance Hub', title: 'Tenacity & Execution', desc: 'Stay the course during late summer. Steadfast effort produces extraordinary breakthroughs.', tasks: ['Push through project roadblocks', 'Maintain physical energy and health', 'Test and validate recent work'], x: 690, y: 1280, type: 'office' },
  { mIndex: 8, name: 'September', place: 'The Master’s Academy', title: 'Skills Polish & Demonstration', desc: 'Wrap up Q3 deliverables. Refine your portfolio, showcase results, and demonstrate your level of mastery.', tasks: ['Finalize Q3 milestone deliverables', 'Share knowledge with peers', 'Outline Q4 final push'], x: 350, y: 1020, type: 'academy' },
  { mIndex: 9, name: 'October', place: 'The Autumn Citadel', title: 'Final Sprint Launch', desc: 'Enter the final quarter with sharp focus. Prioritize the highest-impact goals to conclude the year.', tasks: ['Identify must-win goals for Q4', 'Eliminate non-essential distractions', 'Accelerate critical milestones'], x: 680, y: 760, type: 'tower' },
  { mIndex: 10, name: 'November', place: 'The Highland Manor', title: 'Closing the Gaps', desc: 'Tie up loose ends and finish major projects before the holiday season. Leave nothing to chance.', tasks: ['Complete final project submissions', 'Review financial and savings targets', 'Prepare year-end transition'], x: 360, y: 500, type: 'palace' },
  { mIndex: 11, name: 'December', place: 'The Victory Summit', title: 'Celebration & New Horizons', desc: 'Reach the peak of the year. Reflect on 12 months of relentless growth, celebrate, and prepare for next year.', tasks: ['Complete annual review and journal', 'Celebrate all milestone triumphs', 'Set intentions for the upcoming year'], x: 500, y: 240, type: 'summit' }
];

const $ = id => document.getElementById(id);

// State management
let currentMode = 'years'; // 'years' | 'months'
let selectedYear = 2026;
let selectedYearIdx = 0;
let selectedMonthIdx = 0;
let selectedWeekNode = null; // null or { mIndex, weekNum }

let savedYears = {};
try { savedYears = JSON.parse(localStorage.getItem('lifequest-v1') || '{}'); } catch {}
let yearData = chapters.map((c, i) => ({
  tasks: c.tasks.map(t => ({ text: t, done: false })),
  notes: '',
  done: false,
  ...savedYears[i]
}));

let savedAnnual = {};
try { savedAnnual = JSON.parse(localStorage.getItem('lifequest-annual-v1') || '{}'); } catch {}

let savedWeeks = {};
try { savedWeeks = JSON.parse(localStorage.getItem('lifequest-annual-weeks-v1') || '{}'); } catch {}

function getMonthStorage(year, mIdx) {
  let key = `${year}_${mIdx}`;
  if (!savedAnnual[key]) {
    let c = monthChapters[mIdx];
    savedAnnual[key] = {
      tasks: c.tasks.map(t => ({ text: t, done: false })),
      notes: '',
      done: false
    };
  }
  return savedAnnual[key];
}

function getWeekStorage(year, mIdx, wNum) {
  let key = `${year}_${mIdx}_${wNum}`;
  if (!savedWeeks[key]) {
    savedWeeks[key] = {
      tasks: [
        { text: `Sprint goal ${wNum}A for ${monthChapters[mIdx].name}`, done: false },
        { text: `Habit & execution block ${wNum}`, done: false }
      ],
      notes: '',
      done: false
    };
  }
  return savedWeeks[key];
}


function getYearChapterName(i) {
  return (yearData[i] && yearData[i].customName !== undefined && yearData[i].customName.trim()) ? yearData[i].customName : chapters[i].name;
}
function getYearChapterTitle(i) {
  return (yearData[i] && yearData[i].customTitle !== undefined && yearData[i].customTitle.trim()) ? yearData[i].customTitle : chapters[i].title;
}
function getYearChapterImage(i) {
  return (yearData[i] && yearData[i].image) || '';
}

function getMonthChapterName(year, mIdx) {
  let mData = getMonthStorage(year, mIdx);
  return (mData && mData.customName !== undefined && mData.customName.trim()) ? mData.customName : monthChapters[mIdx].name;
}
function getMonthChapterTitle(year, mIdx) {
  let mData = getMonthStorage(year, mIdx);
  return (mData && mData.customTitle !== undefined && mData.customTitle.trim()) ? mData.customTitle : monthChapters[mIdx].title;
}
function getMonthChapterImage(year, mIdx) {
  let mData = getMonthStorage(year, mIdx);
  return (mData && mData.image) || '';
}

function getWeekTitle(year, mIdx, wNum) {
  let wData = getWeekStorage(year, mIdx, wNum);
  return (wData && wData.customTitle !== undefined && wData.customTitle.trim()) ? wData.customTitle : ('Week ' + wNum + ' Execution');
}
function getWeekImage(year, mIdx, wNum) {
  let wData = getWeekStorage(year, mIdx, wNum);
  return (wData && wData.image) || '';
}

function compressAndSaveImage(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    toast('Please select a valid image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let maxW = 1800, maxH = 1800;
      let w = img.width, h = img.height;
      if (w > maxW || h > maxH) {
        if (w > h) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        } else {
          w = Math.round(w * (maxH / h));
          h = maxH;
        }
      }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx2 = c.getContext('2d');
      ctx2.drawImage(img, 0, 0, w, h);
      const dataUrl = c.toDataURL('image/jpeg', 0.92);
      callback(dataUrl);
    };
    img.onerror = () => toast('Failed to process image');
    img.src = e.target.result;
  };
  reader.onerror = () => toast('Error reading file');
  reader.readAsDataURL(file);
}

function setImageForCurrentPoint(dataUrl) {
  if (currentMode === 'years') {
    yearData[selectedYearIdx].image = dataUrl;
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.image = dataUrl;
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.image = dataUrl;
  }
  saveCurrent();
  updateImageUI(dataUrl);
  renderNav();
}

function updateImageUI(imgUrl) {
  if (imgUrl) {
    $('point-img-element').src = imgUrl;
    $('img-preview-box').style.display = 'block';
    $('img-status-tag').textContent = 'Image Attached';
    $('img-status-tag').classList.add('has-img');
  } else {
    $('point-img-element').src = '';
    $('img-preview-box').style.display = 'none';
    $('img-status-tag').textContent = 'No image';
    $('img-status-tag').classList.remove('has-img');
  }
}

function saveCurrent() {
  try {
    if (currentMode === 'years') {
      localStorage.setItem('lifequest-v1', JSON.stringify(yearData));
    } else {
      localStorage.setItem('lifequest-annual-v1', JSON.stringify(savedAnnual));
      localStorage.setItem('lifequest-annual-weeks-v1', JSON.stringify(savedWeeks));
    }
  } catch {
    $('save-note').textContent = 'Storage unavailable — changes last for this visit.';
  }
  renderNav();
}

// Canvas & Camera
const canvas = $('map');
const ctx = canvas.getContext('2d');
let w = 0, h = 0, scale = 1;
let camX = 480, camY = 2400;
let targetCamX = 480, targetCamY = 2400;
let worldView = false, followingPlayer = true;
let player = { x: 480, y: 2500 };
let last = 0;
const W = 1000;
let H = 2700;
let toastTimer;

let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragCamStartX = 480, dragCamStartY = 2400;
let dragDistance = 0;

function clampCam() {
  let halfW = w / scale / 2, halfH = h / scale / 2;
  if (halfW * 2 >= W) targetCamX = W / 2;
  else targetCamX = Math.max(halfW, Math.min(W - halfW, targetCamX));

  if (halfH * 2 >= H) targetCamY = H / 2;
  else targetCamY = Math.max(halfH, Math.min(H - halfH, targetCamY));
}

// Roads generation
function buildRoadPoints(chList) {
  let pts = [];
  for (let j = 0; j < chList.length - 1; j++) {
    let a = chList[j], b = chList[j + 1];
    for (let t = 0; t < 1; t += 0.025) {
      let ease = t * t * (3 - 2 * t);
      pts.push({ x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * t });
    }
  }
  pts.push(chList[chList.length - 1]);
  return pts;
}

const yearPoints = buildRoadPoints(chapters);
const monthPoints = buildRoadPoints(monthChapters);

// 4 Weeks between each month along the road
const weekStones = [];
for (let j = 0; j < monthChapters.length - 1; j++) {
  let a = monthChapters[j], b = monthChapters[j + 1];
  let pts = [];
  let tot = 0, prev = { x: a.x, y: a.y };
  pts.push({ x: a.x, y: a.y, len: 0 });
  for (let t = 0.005; t <= 1.0001; t += 0.005) {
    let ease = t * t * (3 - 2 * t);
    let x = a.x + (b.x - a.x) * ease;
    let y = a.y + (b.y - a.y) * t;
    tot += Math.hypot(x - prev.x, y - prev.y);
    pts.push({ x, y, len: tot });
    prev = { x, y };
  }
  let marginA = 55, marginB = 55;
  let usable = tot - marginA - marginB;
  let step = usable / 3;
  for (let wNum = 1; wNum <= 4; wNum++) {
    let target = marginA + (wNum - 1) * step;
    let p = pts.find(pt => pt.len >= target) || pts[pts.length - 1];
    weekStones.push({
      mIndex: j,
      weekNum: wNum,
      monthName: a.name,
      x: Math.round(p.x),
      y: Math.round(p.y)
    });
  }
}

// 12 Months alongside the road between every year (72 roadside milestones)
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const monthMarkers = [];
for (let j = 0; j < chapters.length - 1; j++) {
  let a = chapters[j], b = chapters[j + 1];
  let pts = [], tot = 0, prev = { x: a.x, y: a.y };
  pts.push({ x: a.x, y: a.y, len: 0, t: 0 });
  for (let t = 0.002; t <= 1.0001; t += 0.002) {
    let ease = t * t * (3 - 2 * t);
    let x = a.x + (b.x - a.x) * ease, y = a.y + (b.y - a.y) * t;
    tot += Math.hypot(x - prev.x, y - prev.y);
    pts.push({ x, y, len: tot, t });
    prev = { x, y };
  }
  let marginA = 65, marginB = 75;
  let usable = tot - marginA - marginB;
  let step = usable / 11;
  for (let m = 0; m < 12; m++) {
    let targetLen = marginA + m * step;
    let pt = pts.find(p => p.len >= targetLen) || pts[pts.length - 1];
    let t = pt.t;
    let dxdt = (b.x - a.x) * 6 * t * (1 - t), dydt = (b.y - a.y);
    let len = Math.hypot(dxdt, dydt) || 1;
    let nx = -dydt / len, ny = dxdt / len;
    let offset = 38;
    monthMarkers.push({
      seg: j,
      mIndex: m,
      year: a.year,
      name: MONTH_NAMES[m],
      fullName: MONTH_FULL[m],
      isQuarter: (m % 3 === 0),
      x: Math.round(pt.x + nx * offset),
      y: Math.round(pt.y + ny * offset),
      roadX: Math.round(pt.x),
      roadY: Math.round(pt.y)
    });
  }
}


// Procedural environment
function roadDist(pts, x, y) {
  let m = 1e9;
  for (let p of pts) m = Math.min(m, Math.hypot(x - p.x, y - p.y));
  return m;
}

let seed = 184;
function rnd() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const yearTrees = [], yearRocks = [];
for (let i = 0; i < 1600; i++) {
  let x = rnd() * W, y = rnd() * 2700;
  if (roadDist(yearPoints, x, y) > 75 && chapters.every(c => Math.hypot(x - c.x, y - c.y) > 120)) {
    yearTrees.push({ x, y, s: 12 + rnd() * 19, t: rnd() });
  }
}
for (let i = 0; i < 120; i++) yearRocks.push({ x: rnd() * W, y: rnd() * 2700, s: 20 + rnd() * 50 });

const monthTrees = [], monthRocks = [];
for (let i = 0; i < 2000; i++) {
  let x = rnd() * W, y = rnd() * 3400;
  if (roadDist(monthPoints, x, y) > 75 && monthChapters.every(c => Math.hypot(x - c.x, y - c.y) > 120)) {
    monthTrees.push({ x, y, s: 12 + rnd() * 19, t: rnd() });
  }
}
for (let i = 0; i < 150; i++) monthRocks.push({ x: rnd() * W, y: rnd() * 3400, s: 20 + rnd() * 50 });

// Drawing Helpers
function poly(ps, color) {
  ctx.beginPath();
  ps.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tree(t) {
  let { x, y, s } = t;
  ellipse(x + 7, y + 4, s * .7, s * .28, '#0c211c55');
  ctx.fillStyle = '#3c3b25';
  ctx.fillRect(x - 2, y - 12, 4, 16);
  poly([[x - s * .65, y - 7], [x, y - s * 1.9], [x + s * .65, y - 7]], t.t > .6 ? '#4d6650' : '#365943');
  poly([[x, y - s * 1.9], [x + s * .65, y - 7], [x + 2, y - 13]], '#203e32');
  poly([[x - s * .48, y - s * .65], [x, y - s * 2.2], [x + s * .48, y - s * .65]], t.t > .6 ? '#587355' : '#3f644b');
}

function box(x, y, ww, hh, depth, color) {
  poly([[x - ww / 2, y], [x, y + depth], [x + ww / 2, y], [x, y - depth]], '#556b50');
  poly([[x - ww / 2, y], [x, y + depth], [x, y + depth - hh], [x - ww / 2, y - hh]], color);
  poly([[x, y + depth], [x + ww / 2, y], [x + ww / 2, y - hh], [x, y + depth - hh]], '#263d35');
  poly([[x - ww / 2, y - hh], [x, y - hh + depth], [x + ww / 2, y - hh], [x, y - hh - depth]], '#839381');
  for (let j = 12; j < hh - 3; j += 15) {
    ctx.fillStyle = '#d3bc75';
    ctx.fillRect(x - ww * .32, y - j, 5, 6);
    ctx.fillRect(x - ww * .15, y - j + 5, 5, 6);
  }
}


function drawRoadsideMonth(m, now) {
  let { x, y, roadX, roadY, name, year, seg, mIndex, isQuarter } = m;
  let isDone = yearData[seg] && yearData[seg].done;
  let cur = new Date(), curYear = cur.getFullYear(), curMonth = cur.getMonth();
  let isNow = (year === curYear && mIndex === curMonth);

  ctx.save();
  // Dashed connector peg to road
  ctx.strokeStyle = isNow ? '#f3d78baa' : (isDone ? '#eed18988' : (isQuarter ? '#cbb87c77' : '#5f796688'));
  ctx.lineWidth = isNow ? 2 : 1.5;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(roadX, roadY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Road anchor dot on road surface
  ctx.fillStyle = isNow ? '#f3d78b' : (isDone ? '#eed189' : (isQuarter ? '#d8c288' : '#88a38e'));
  ctx.beginPath();
  ctx.arc(roadX, roadY, isNow ? 3.5 : 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b1d16';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ground shadow
  ellipse(x, y + 7, 16, 6, '#0c211c88');

  // Pill badge dimension (larger, crisper, high visibility)
  let pw = 34, ph = 16;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 4);
  } else {
    ctx.rect(x - pw / 2, y - ph / 2, pw, ph);
  }
  ctx.fillStyle = isNow ? '#2e3f26' : (isDone ? '#1b3827' : (isQuarter ? '#1b3024' : '#13251d'));
  ctx.fill();
  ctx.strokeStyle = isNow ? '#f6de96' : (isDone ? '#eed189' : (isQuarter ? '#d4be80' : '#45614e'));
  ctx.lineWidth = isNow ? 2 : (isDone || isQuarter ? 1.4 : 1.1);
  ctx.stroke();

  // Text label
  ctx.font = isNow ? 'bold 9.5px sans-serif' : ((isQuarter || isDone) ? 'bold 9px sans-serif' : '600 8.5px sans-serif');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isNow ? '#fff0ba' : (isDone ? '#eed189' : (isQuarter ? '#f3dd9f' : '#c8d9c6'));
  ctx.fillText(name.toUpperCase(), x, y + 0.5);
  ctx.textBaseline = 'alphabetic';

  // Real-world NOW beacon with pulsing outer ring
  if (isNow) {
    let pulse = 2 + Math.sin((now || 0) / 220) * 2;
    ctx.strokeStyle = '#f3d78baa';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - pw / 2 - pulse, y - ph / 2 - pulse, pw + pulse * 2, ph + pulse * 2, 6);
    }
    ctx.stroke();

    ctx.fillStyle = '#f3d78b';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText('NOW ✧', x, y - 11);
  }

  ctx.restore();
}

function drawLandmark(c, i, isSelected, isDone, labelTop, labelBottom, hasImage = false) {
  let { x, y } = c;
  ellipse(x, y + 12, 83, 43, '#112b2490');
  ellipse(x, y + 5, 76, 37, '#536948');
  ellipse(x, y, 68, 31, '#6b7953');
  ctx.strokeStyle = isSelected ? '#e8cc83' : '#8b9d6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 80, 39, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (c.type === 'office') {
    box(x - 19, y - 1, 51, 93, 15, '#587577');
    box(x + 24, y + 9, 45, 64, 14, '#6b7b70');
  } else if (c.type === 'camp') {
    poly([[x - 43, y + 5], [x - 8, y - 52], [x + 28, y + 6]], '#dbb976');
    poly([[x - 8, y - 52], [x + 49, y - 8], [x + 28, y + 6]], '#8e794d');
    poly([[x - 15, y + 5], [x - 8, y - 25], [x + 7, y + 5]], '#393e2b');
    ellipse(x + 43, y + 20, 11, 5, '#ffc477');
    poly([[x + 36, y + 18], [x + 43, y - 5], [x + 50, y + 18]], '#ffb35c');
  } else if (c.type === 'tower') {
    box(x, y, 70, 29, 20, '#596f65');
    ctx.strokeStyle = '#b5c2ae';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 23, y - 15);
    ctx.lineTo(x, y - 110);
    ctx.lineTo(x + 23, y - 15);
    ctx.moveTo(x - 15, y - 50);
    ctx.lineTo(x + 15, y - 50);
    ctx.moveTo(x - 8, y - 80);
    ctx.lineTo(x + 8, y - 80);
    ctx.stroke();
    ellipse(x, y - 110, 5, 5, '#e9ca7e');
    for (let j = 0; j < 2; j++) {
      ctx.strokeStyle = '#cfcc8b88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 110, 15 + j * 12, -.9, .9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 110, 15 + j * 12, Math.PI - .9, Math.PI + .9);
      ctx.stroke();
    }
  } else if (c.type === 'garage') {
    box(x, y - 12, 105, 37, 25, '#887e5d');
    ctx.fillStyle = '#24382f';
    ctx.fillRect(x - 30, y - 40, 30, 25);
    ellipse(x + 20, y + 25, 30, 10, '#1d322a');
    poly([[x - 10, y + 17], [x + 8, y + 3], [x + 44, y + 7], [x + 53, y + 21], [x + 32, y + 30]], '#d6b569');
    poly([[x + 5, y + 12], [x + 15, y + 5], [x + 33, y + 8], [x + 37, y + 17]], '#3f645e');
    ellipse(x + 3, y + 23, 5, 7, '#18251e');
    ellipse(x + 40, y + 25, 5, 7, '#18251e');
  } else if (c.type === 'summit') {
    poly([[x - 65, y], [x - 20, y - 75], [x + 8, y - 117], [x + 60, y + 4]], '#7f8b76');
    poly([[x + 8, y - 117], [x + 60, y + 4], [x + 6, y - 10]], '#4b6355');
    poly([[x - 10, y - 90], [x + 8, y - 117], [x + 26, y - 78], [x + 6, y - 89], [x - 1, y - 80]], '#d5dcc7');
    ctx.strokeStyle = '#e3d8aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 115);
    ctx.lineTo(x + 8, y - 155);
    ctx.stroke();
    poly([[x + 9, y - 155], [x + 40, y - 146], [x + 9, y - 133]], '#edcc77');
  } else {
    box(x, y, 85, 48, 24, c.type === 'palace' ? '#b6af89' : '#78867b');
    box(x - 42, y - 8, 28, 65, 12, '#879580');
    box(x + 42, y - 8, 28, 65, 12, '#879580');
    poly([[x - 59, y - 73], [x - 42, y - 98], [x - 24, y - 73]], '#425f58');
    poly([[x + 25, y - 73], [x + 42, y - 98], [x + 59, y - 73]], '#425f58');
    poly([[x - 45, y - 48], [x, y - 84], [x + 45, y - 48], [x, y - 25]], c.type === 'palace' ? '#617c70' : '#536e66');
    ctx.fillStyle = '#d3bb7d';
    ctx.fillRect(x - 7, y - 14, 14, 22);
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#142b23';
  ctx.fillRect(x - 30, y + 48, 60, 22);
  ctx.fillStyle = '#ebd49c';
  ctx.fillText(labelTop, x, y + 63);
  ctx.font = '600 13px sans-serif';
  ctx.shadowColor = '#10241e';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#e5e7c9';
  ctx.fillText(labelBottom.toUpperCase(), x, y + 89);
  ctx.shadowBlur = 0;

  
  if (hasImage) {
    ctx.font = '14px sans-serif';
    ctx.fillText('🖼️', x - 72, y - 28);
  }

  if (isDone) {
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#eed189';
    ctx.fillText('⚑', x + 80, y - 35);
  }
}

// Week Stepping Stone Drawing
function drawWeekStone(w, now) {
  let isSelected = selectedWeekNode && selectedWeekNode.mIndex === w.mIndex && selectedWeekNode.weekNum === w.weekNum;
  let wData = getWeekStorage(selectedYear, w.mIndex, w.weekNum);
  let isDone = wData.done;

  // Ground shadow
  ellipse(w.x, w.y + 4, 15, 6, '#0c211c66');

  // Stepping stone platform
  ctx.beginPath();
  ctx.arc(w.x, w.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = isDone ? '#21462d' : (isSelected ? '#2f4436' : '#152b20');
  ctx.fill();

  ctx.strokeStyle = isSelected ? '#f3d78b' : (isDone ? '#eed189' : '#476251');
  ctx.lineWidth = isSelected ? 2.5 : 1.5;
  ctx.stroke();

  // Text label "W1", "W2", etc.
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#fff' : (isDone ? '#f2dba4' : '#b2c5b3');
  ctx.fillText('W' + w.weekNum, w.x, w.y);
  let hasStoneImg = Boolean(getWeekImage(selectedYear, w.mIndex, w.weekNum));
  if (hasStoneImg) {
    ctx.font = '8px sans-serif';
    ctx.fillText('🖼️', w.x + 13, w.y - 10);
  }
  ctx.textBaseline = 'alphabetic';

  if (isSelected) {
    let pulse = 2 + Math.sin(now / 200) * 1.5;
    ctx.strokeStyle = '#f3d78baa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 17 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Terrain Renderer
function drawTerrain(now) {
  let isYear = currentMode === 'years';
  let curPts = isYear ? yearPoints : monthPoints;
  let curTrees = isYear ? yearTrees : monthTrees;
  let curRocks = isYear ? yearRocks : monthRocks;

  ctx.fillStyle = '#294b3b';
  ctx.fillRect(0, 0, W, H);

  // Ambient rocks
  for (let r of curRocks) {
    ellipse(r.x, r.y, r.s * 2, r.s, '#3a574022');
    if (r.x < 120 || r.x > 880) {
      poly([[r.x - r.s, r.y], [r.x, r.y - r.s * 1.2], [r.x + r.s * .8, r.y + 10]], '#4a6455');
      poly([[r.x, r.y - r.s * 1.2], [r.x + r.s * .8, r.y + 10], [r.x + 4, r.y]], '#304c40');
    }
  }

  // Natural River
  ctx.strokeStyle = '#315c59';
  ctx.lineWidth = 56;
  ctx.beginPath();
  ctx.moveTo(0, 1900);
  ctx.bezierCurveTo(300, 1940, 110, 1530, 40, 1200);
  ctx.bezierCurveTo(-40, 900, 190, 650, 110, 0);
  ctx.stroke();
  ctx.strokeStyle = '#477a7077';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Winding Road (3 layers)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let [color, width] of [['#142e26', 52], ['#77795a', 39], ['#a0a075', 27]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    curPts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  }

  // Chevrons
  for (let i = 10; i < curPts.length - 4; i += 11) {
    let p = curPts[i], q = curPts[i + 1], a = Math.atan2(q.y - p.y, q.x - p.x);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    ctx.strokeStyle = '#dfd49a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(1, 0);
    ctx.lineTo(-5, 5);
    ctx.stroke();
    ctx.restore();
  }

  // Trees
  curTrees.forEach(tree);

  if (isYear) {
    // 12 Months alongside the road between every year (72 roadside milestones)
    monthMarkers.forEach(m => drawRoadsideMonth(m, now));

    // 7 Year Landmarks
    chapters.forEach((c, i) => {
      let dispName = getYearChapterName(i);
      let hasImg = Boolean(getYearChapterImage(i));
      drawLandmark(c, i, i === selectedYearIdx, yearData[i].done, String(c.year), dispName, hasImg);
    });

    ctx.font = 'italic 25px Georgia';
    ctx.fillStyle = '#c4d6b124';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(180, 2230);
    ctx.rotate(-.3);
    ctx.fillText('Whispering woods', 0, 0);
    ctx.restore();
    ctx.fillText('THE HIGHLANDS', 480, 460);
  } else {
    // 44 Week Stepping Stones
    weekStones.forEach(w => drawWeekStone(w, now));

    // 12 Month Landmarks
    monthChapters.forEach((c, i) => {
      let isDone = getMonthStorage(selectedYear, i).done;
      let isSel = (!selectedWeekNode && i === selectedMonthIdx);
      let dispName = getMonthChapterName(selectedYear, i);
      let hasImg = Boolean(getMonthChapterImage(selectedYear, i));
      drawLandmark(c, i, isSel, isDone, "MONTH " + String(i + 1).padStart(2, '0'), dispName, hasImg);
    });

    ctx.font = 'italic 25px Georgia';
    ctx.fillStyle = '#c4d6b124';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(180, 2900);
    ctx.rotate(-.3);
    ctx.fillText('The Season Woods', 0, 0);
    ctx.restore();
    ctx.fillText('YEAR-END ASCENT', 480, 420);
  }
}

// Resizing
function resize() {
  let r = canvas.getBoundingClientRect();
  w = r.width;
  h = r.height;
  let d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = w * d;
  canvas.height = h * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

// Navigation UI rendering
function renderNav() {
  $('chapters').innerHTML = '';
  if (currentMode === 'years') {
    chapters.forEach((c, i) => {
      let b = document.createElement('button');
      b.className = 'chapter' + (i === selectedYearIdx ? ' active' : '');
      b.innerHTML = `<span class="num">${yearData[i].done ? '✓' : String(i + 1).padStart(2, '0')}</span><span><small>${c.year}</small><strong>${c.name}</strong></span>`;
      
b.onclick = () => {
    selectYearChapter(i, true);
    openDreamScene(i);
};

      $('chapters').appendChild(b);
    });
    let n = yearData.filter(d => d.done).length;
    $('count').textContent = n + ' / 7';
    $('bar').style.width = (n / 7 * 100) + '%';
  } else {
    monthChapters.forEach((c, i) => {
      let mData = getMonthStorage(selectedYear, i);
      let isSel = (!selectedWeekNode && i === selectedMonthIdx);
      let b = document.createElement('button');
      b.className = 'chapter' + (isSel ? ' active' : '');
      b.innerHTML = `<span class="num">${mData.done ? '✓' : String(i + 1).padStart(2, '0')}</span><span><small>MONTH ${i + 1}</small><strong>${c.name}</strong></span>`;
      b.onclick = () => selectMonthChapter(i, true);
      $('chapters').appendChild(b);
    });
    let n = monthChapters.filter((c, i) => getMonthStorage(selectedYear, i).done).length;
    $('count').textContent = n + ' / 12';
    $('bar').style.width = (n / 12 * 100) + '%';
  }
}

function renderTasks(tasks) {
  $('tasks').innerHTML = '';
  tasks.forEach((t, i) => {
    let row = document.createElement('div');
    row.className = 'task';
    let cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.setAttribute('aria-label', 'Complete quest ' + (i + 1));
    cb.onchange = () => {
      t.done = cb.checked;
      saveCurrent();
      renderNav();
    };
    let input = document.createElement('input');
    input.type = 'text';
    input.value = t.text;
    input.setAttribute('aria-label', 'Quest ' + (i + 1));
    input.oninput = () => {
      t.text = input.value;
      saveCurrent();
    };
    let del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remove quest ' + (i + 1));
    del.onclick = () => {
      tasks.splice(i, 1);
      saveCurrent();
      renderTasks(tasks);
    };
    row.append(cb, input, del);
    $('tasks').appendChild(row);
  });
}

// Select in 7-Year Campaign
function selectYearChapter(i, move = false) {
  selectedYearIdx = i;
  let c = chapters[i];
  let curData = yearData[i];
  let name = getYearChapterName(i);
  let title = getYearChapterTitle(i);
  let image = getYearChapterImage(i);

  $('detail-eyebrow').textContent = 'MISSION BRIEFING';
  $('chapter-number').textContent = String(i + 1).padStart(2, '0') + ' / 07';
  $('badge').textContent = c.year;
  $('biome').textContent = c.place.toUpperCase();
  $('point-name-input').value = (curData.customName !== undefined) ? curData.customName : c.name;
  $('point-title-input').value = (curData.customTitle !== undefined) ? curData.customTitle : c.title;
  $('goal').textContent = title;
  $('maptitle').textContent = title;
  $('description').textContent = c.desc;
  $('location').textContent = 'CHAPTER ' + String(i + 1).padStart(2, '0') + ' · ' + name.toUpperCase();
  $('notes').value = curData.notes;
  $('complete').textContent = curData.done ? '✓ Achieved · click to undo' : '⚑ Mark milestone achieved';
  $('cal-link').style.display = 'none';

  updateImageUI(image);
  renderTasks(curData.tasks);
  renderNav();

  if (move) {
    worldView = false;
    player.x = c.x;
    player.y = c.y + 70;
    targetCamX = c.x;
    targetCamY = c.y;
    clampCam();
    followingPlayer = true;
    updateViewButton();
  }
}

// Select Month Landmark in 12-Month Road
function selectMonthChapter(i, move = false) {
  selectedMonthIdx = i;
  selectedWeekNode = null;
  let c = monthChapters[i];
  let curData = getMonthStorage(selectedYear, i);
  let name = getMonthChapterName(selectedYear, i);
  let title = getMonthChapterTitle(selectedYear, i);
  let image = getMonthChapterImage(selectedYear, i);

  $('detail-eyebrow').textContent = 'MONTHLY BRIEFING';
  $('chapter-number').textContent = String(i + 1).padStart(2, '0') + ' / 12';
  $('badge').textContent = selectedYear + ' · ' + name.toUpperCase();
  $('biome').textContent = c.place.toUpperCase();
  $('point-name-input').value = (curData.customName !== undefined) ? curData.customName : c.name;
  $('point-title-input').value = (curData.customTitle !== undefined) ? curData.customTitle : c.title;
  $('goal').textContent = title;
  $('maptitle').textContent = name + ' · ' + title;
  $('description').textContent = c.desc;
  $('location').textContent = 'MONTH ' + String(i + 1).padStart(2, '0') + ' · ' + name.toUpperCase();
  $('notes').value = curData.notes;
  $('complete').textContent = curData.done ? '✓ Month achieved · click to undo' : '⚑ Mark month achieved';

  let mm = String(i + 1).padStart(2, '0');
  $('cal-link').style.display = 'flex';
  $('cal-link').href = 'https://calendar.google.com/calendar/r/month/' + selectedYear + '/' + mm + '/01';
  $('cal-link-text').textContent = 'Open ' + name + ' ' + selectedYear + ' in Google Calendar ↗';

  updateImageUI(image);
  renderTasks(curData.tasks);
  renderNav();

  if (move) {
    worldView = false;
    player.x = c.x;
    player.y = c.y + 70;
    targetCamX = c.x;
    targetCamY = c.y;
    clampCam();
    followingPlayer = true;
    updateViewButton();
  }
}

// Hop Week by Week in 12-Month Road
function selectWeekNode(w) {
  selectedWeekNode = w;
  selectedMonthIdx = w.mIndex;
  let m = monthChapters[w.mIndex];
  let curData = getWeekStorage(selectedYear, w.mIndex, w.weekNum);
  let defaultName = w.monthName + ' Week ' + w.weekNum;
  let name = (curData.customName !== undefined) ? curData.customName : defaultName;
  let title = getWeekTitle(selectedYear, w.mIndex, w.weekNum);
  let image = getWeekImage(selectedYear, w.mIndex, w.weekNum);

  $('detail-eyebrow').textContent = 'WEEKLY HOP SPRINT';
  $('chapter-number').textContent = 'WEEK 0' + w.weekNum + ' / 04';
  $('badge').textContent = 'WEEK 0' + w.weekNum;
  $('biome').textContent = w.monthName.toUpperCase() + ' · WEEK 0' + w.weekNum + ' SPRINT';
  $('point-name-input').value = name;
  $('point-title-input').value = (curData.customTitle !== undefined) ? curData.customTitle : title;
  $('goal').textContent = title;
  $('maptitle').textContent = w.monthName + ' · ' + title;
  $('description').textContent = 'Focus on your week ' + w.weekNum + ' deliverables for ' + w.monthName + ' ' + selectedYear + '. Hop from milestone to milestone along the road!';
  $('location').textContent = w.monthName.toUpperCase() + ' · WEEK 0' + w.weekNum;
  $('notes').value = curData.notes;
  $('complete').textContent = curData.done ? '✓ Week completed · click to undo' : '⚑ Mark week completed';

  let mm = String(w.mIndex + 1).padStart(2, '0');
  $('cal-link').style.display = 'flex';
  $('cal-link').href = 'https://calendar.google.com/calendar/r/month/' + selectedYear + '/' + mm + '/01';
  $('cal-link-text').textContent = 'Open ' + w.monthName + ' ' + selectedYear + ' in Google Calendar ↗';

  updateImageUI(image);
  renderTasks(curData.tasks);
  renderNav();

  // Hop avatar to stepping stone!
  worldView = false;
  player.x = w.x;
  player.y = w.y;
  targetCamX = w.x;
  targetCamY = w.y;
  clampCam();
  followingPlayer = true;
  updateViewButton();

  toast('Hopped to ' + w.monthName + ' Week ' + w.weekNum + '!');
}

// Mode Switcher (Years vs Months)
function switchMode(mode) {
  currentMode = mode;
  $('switch-years').classList.toggle('active', mode === 'years');
  $('switch-months').classList.toggle('active', mode === 'months');
  $('switch-years').setAttribute('aria-selected', mode === 'years');
  $('switch-months').setAttribute('aria-selected', mode === 'months');
  $('year-select').style.display = (mode === 'months') ? 'inline-block' : 'none';

  if (mode === 'years') {
    H = 2700;
    $('region-tag').innerHTML = 'THE EMERALD FRONTIER<small id="location">CHAPTER 01 · THE BEGINNING</small>';
    selectYearChapter(selectedYearIdx, true);
    toast('Switched to 7-Year Campaign (2026–2032)');
  } else {
    H = 3400;
    $('region-tag').innerHTML = `${selectedYear} EXPEDITION ROAD<small id="location">MONTH 01 · JANUARY</small>`;
    selectMonthChapter(selectedMonthIdx, true);
    toast(`Switched to ${selectedYear} 12-Month Road · Hop Week by Week!`);
  }
  resize();
}

$('switch-years').onclick = () => switchMode('years');
$('switch-months').onclick = () => switchMode('months');
$('year-select').onchange = e => {
  selectedYear = parseInt(e.target.value, 10);
  switchMode('months');
};

// Notes & Tasks Actions
$('notes').oninput = () => {
  if (currentMode === 'years') {
    yearData[selectedYearIdx].notes = $('notes').value;
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.notes = $('notes').value;
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.notes = $('notes').value;
  }
  saveCurrent();
};

$('add').onclick = () => {
  if (currentMode === 'years') {
    yearData[selectedYearIdx].tasks.push({ text: 'My next step', done: false });
    renderTasks(yearData[selectedYearIdx].tasks);
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.tasks.push({ text: `Week ${selectedWeekNode.weekNum} task`, done: false });
    renderTasks(wData.tasks);
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.tasks.push({ text: 'My next monthly step', done: false });
    renderTasks(mData.tasks);
  }
  saveCurrent();
  let lastInp = $('tasks').lastChild && $('tasks').lastChild.querySelector('input[type=text]');
  if (lastInp) lastInp.focus();
};

$('complete').onclick = () => {
  if (currentMode === 'years') {
    yearData[selectedYearIdx].done = !yearData[selectedYearIdx].done;
    saveCurrent();
    selectYearChapter(selectedYearIdx);
    toast(yearData[selectedYearIdx].done ? 'Achievement unlocked! Milestone achieved.' : 'Milestone reopened.');
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.done = !wData.done;
    saveCurrent();
    selectWeekNode(selectedWeekNode);
    toast(wData.done ? 'Week completed! Great momentum.' : 'Week reopened.');
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.done = !mData.done;
    saveCurrent();
    selectMonthChapter(selectedMonthIdx);
    toast(mData.done ? 'Month achieved! Outstanding progress.' : 'Month reopened.');
  }
};

function toast(s) {
  $('toast').textContent = s;
  $('toast').style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').style.display = 'none', 3200);
}


// Live Editing of Milestone Names & Objectives
$('point-name-input').oninput = () => {
  let val = $('point-name-input').value;
  if (currentMode === 'years') {
    yearData[selectedYearIdx].customName = val;
    let effective = val.trim() || chapters[selectedYearIdx].name;
    $('location').textContent = 'CHAPTER ' + String(selectedYearIdx + 1).padStart(2, '0') + ' · ' + effective.toUpperCase();
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.customName = val;
    let effective = val.trim() || (selectedWeekNode.monthName + ' Week ' + selectedWeekNode.weekNum);
    $('location').textContent = effective.toUpperCase();
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.customName = val;
    let effective = val.trim() || monthChapters[selectedMonthIdx].name;
    $('location').textContent = 'MONTH ' + String(selectedMonthIdx + 1).padStart(2, '0') + ' · ' + effective.toUpperCase();
    let mm = String(selectedMonthIdx + 1).padStart(2, '0');
    $('cal-link-text').textContent = 'Open ' + effective + ' ' + selectedYear + ' in Google Calendar ↗';
  }
  saveCurrent();
  renderNav();
};

$('point-title-input').oninput = () => {
  let val = $('point-title-input').value;
  if (currentMode === 'years') {
    yearData[selectedYearIdx].customTitle = val;
    let effective = val.trim() || chapters[selectedYearIdx].title;
    $('goal').textContent = effective;
    $('maptitle').textContent = effective;
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.customTitle = val;
    let effective = val.trim() || ('Week ' + selectedWeekNode.weekNum + ' Execution');
    $('goal').textContent = effective;
    $('maptitle').textContent = selectedWeekNode.monthName + ' · ' + effective;
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.customTitle = val;
    let effective = val.trim() || monthChapters[selectedMonthIdx].title;
    let mName = getMonthChapterName(selectedYear, selectedMonthIdx);
    $('goal').textContent = effective;
    $('maptitle').textContent = mName + ' · ' + effective;
  }
  saveCurrent();
};

// Vision Image Handlers
$('image-file-input').onchange = e => {
  let file = e.target.files && e.target.files[0];
  if (!file) return;
  compressAndSaveImage(file, dataUrl => {
    setImageForCurrentPoint(dataUrl);
    toast('Milestone vision image uploaded!');
  });
  e.target.value = '';
};

$('toggle-url-btn').onclick = () => {
  let open = $('url-drawer').style.display !== 'none';
  $('url-drawer').style.display = open ? 'none' : 'block';
  if (!open) {
    $('img-url-input').value = '';
    $('img-url-input').focus();
  }
};

$('save-url-btn').onclick = () => {
  let url = $('img-url-input').value.trim();
  if (!url) {
    toast('Please enter an image link');
    return;
  }
  setImageForCurrentPoint(url);
  $('url-drawer').style.display = 'none';
  toast('Vision image link applied!');
};

$('cancel-url-btn').onclick = () => {
  $('url-drawer').style.display = 'none';
};

$('remove-img-btn').onclick = () => {
  setImageForCurrentPoint('');
  toast('Vision image removed');
};

$('view-full-img-btn').onclick = $('point-img-element').onclick = () => {
  let src = $('point-img-element').src;
  if (!src) return;
  $('modal-img-display').src = src;
  $('image-modal').showModal();
};

$('close-image-modal').onclick = () => $('image-modal').close();
$('image-modal').onclick = e => {
  if (e.target === $('image-modal')) $('image-modal').close();
};

// Help & Controls
$('help').onclick = () => $('help-dialog').showModal();
$('close-help').onclick = $('start').onclick = () => $('help-dialog').close();

function updateViewButton() {
  $('overview').innerHTML = worldView ? 'âŒ– <span>Follow player</span>' : 'âŒ– <span>World view</span>';
}
$('overview').onclick = () => {
  worldView = !worldView;
  followingPlayer = !worldView;
  if (worldView) {
    targetCamX = W / 2;
    targetCamY = H / 2;
  } else {
    targetCamX = player.x;
    targetCamY = player.y - 80;
    clampCam();
  }
  updateViewButton();
};
$('recenter').onclick = () => {
  worldView = false;
  followingPlayer = true;
  targetCamX = player.x;
  targetCamY = player.y - 80;
  clampCam();
  updateViewButton();
  toast('Focused on your explorer');
  canvas.focus();
};

function typing(e) {
  return /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || $('help-dialog').open;
}

// Touch & Drag-to-Navigate Map
canvas.onpointerdown = e => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragCamStartX = camX;
  dragCamStartY = camY;
  dragDistance = 0;
  followingPlayer = false;
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  canvas.style.cursor = 'grabbing';
};

canvas.onpointermove = e => {
  let rect = canvas.getBoundingClientRect();
  let wx = (e.clientX - rect.left - w / 2) / scale + camX;
  let wy = (e.clientY - rect.top - h / 2) / scale + camY;

  if (isDragging) {
    let dx = (e.clientX - dragStartX) / scale;
    let dy = (e.clientY - dragStartY) / scale;
    dragDistance = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    if (dragDistance > 4) {
      worldView = false;
      updateViewButton();
      targetCamX = dragCamStartX - dx;
      targetCamY = dragCamStartY - dy;
      clampCam();
      camX = targetCamX;
      camY = targetCamY;
    }
    canvas.style.cursor = 'grabbing';
  } else {
    let overItem = false;
    if (currentMode === 'years') {
      let overLandmark = chapters.some(c => Math.hypot(wx - c.x, (wy - c.y + 15) * .8) < 115);
      let overMonth = monthMarkers.some(m => Math.hypot(wx - m.x, wy - m.y) < 18);
      overItem = overLandmark || overMonth;
    } else {
      let overM = monthChapters.some(c => Math.hypot(wx - c.x, (wy - c.y + 15) * .8) < 115);
      let overW = weekStones.some(ws => Math.hypot(wx - ws.x, wy - ws.y) < 18);
      overItem = overM || overW;
    }
    canvas.style.cursor = overItem ? 'pointer' : 'grab';
  }
};

/* ===== MAP CLICK HANDLING ===== */

canvas.onpointerup = canvas.onpointercancel = e => {

    if (!isDragging) return;

    try {
        canvas.releasePointerCapture(e.pointerId);
    } catch (error) {}

    isDragging = false;
    canvas.style.cursor = 'grab';

    // Ignore dragging, handle only clicks
    if (dragDistance > 6) return;

    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left - w / 2) / scale + camX;
    const y = (e.clientY - rect.top - h / 2) / scale + camY;

    if (currentMode === 'years') {

        // Click a month marker to open Google Calendar
        const clickedMonth = monthMarkers.find(m =>
            Math.hypot(x - m.x, y - m.y) < 22
        );

        if (clickedMonth) {

            player.x = clickedMonth.roadX;
            player.y = clickedMonth.roadY;

            targetCamX = clickedMonth.roadX;
            targetCamY = clickedMonth.roadY;

            clampCam();
            followingPlayer = true;
            updateViewButton();

            const mm = String(clickedMonth.mIndex + 1).padStart(2, '0');

            const url = 'https://calendar.google.com/calendar/r/month/' +
                clickedMonth.year + '/' + mm + '/01';

            window.open(url, '_blank', 'noopener,noreferrer');

            return;
        }

        // Click yearly landmark to open Dream Mode
        const near = chapters.findIndex(c =>
            Math.hypot(x - c.x, (y - c.y + 15) * 0.8) < 115
        );

        if (near >= 0) {

            selectYearChapter(near, true);

            if (typeof openDreamScene === 'function') {
                openDreamScene(near);
            }
        }

    } else {

        // Click weekly stepping stone
        const nearWeek = weekStones.find(ws =>
            Math.hypot(x - ws.x, y - ws.y) < 20
        );

        if (nearWeek) {
            selectWeekNode(nearWeek);
            return;
        }

        // Click monthly landmark
        const nearMonth = monthChapters.findIndex(c =>
            Math.hypot(x - c.x, (y - c.y + 15) * 0.8) < 115
        );

        if (nearMonth >= 0) {
            selectMonthChapter(nearMonth, true);
        }
    }
};

canvas.onwheel = e => {
  e.preventDefault();
  worldView = false;
  followingPlayer = false;
  updateViewButton();
  targetCamY += e.deltaY / scale;
  clampCam();
  camY = targetCamY;
};

// Main Game Loop
function loop(now) {
  let dt = Math.min((now - last) / 1000 || 0, .035);
  last = now;

  scale = worldView ? Math.min(w / W, h / (H + 80)) : Math.max(.56, Math.min(.95, w / 690));

  if (worldView) {
    targetCamX = W / 2;
    targetCamY = H / 2;
  } else if (followingPlayer) {
    targetCamX = player.x;
    targetCamY = player.y - 80;
    clampCam();
  }

  if (!camY) {
    camX = targetCamX;
    camY = targetCamY;
  }

  if (!isDragging) {
    camX += (targetCamX - camX) * Math.min(1, dt * 8);
    camY += (targetCamY - camY) * Math.min(1, dt * 8);
  }

  // Adaptive HUD location based on center of view
  let viewX = isDragging ? camX : (followingPlayer ? player.x : camX);
  let viewY = isDragging ? camY : (followingPlayer ? player.y : camY);

  if (currentMode === 'years') {
    let nearCh = chapters.findIndex(c => Math.hypot(c.x - viewX, (c.y - viewY) * .8) < 130);
    if (nearCh >= 0) {
      $('location').textContent = 'CHAPTER ' + String(nearCh + 1).padStart(2, '0') + ' · ' + getYearChapterName(nearCh).toUpperCase();
    } else {
      let nearMonth = monthMarkers.find(m => Math.hypot(m.roadX - viewX, m.roadY - viewY) < 45);
      if (nearMonth) {
        $('location').textContent = 'CHAPTER ' + String(nearMonth.seg + 1).padStart(2, '0') + ' · ' + nearMonth.name.toUpperCase() + ' ' + nearMonth.year;
      }
    }
  } else {
    let nearM = monthChapters.findIndex(c => Math.hypot(c.x - viewX, (c.y - viewY) * .8) < 120);
    if (nearM >= 0) {
      $('location').textContent = 'MONTH ' + String(nearM + 1).padStart(2, '0') + ' · ' + monthChapters[nearM].name.toUpperCase();
    } else {
      let nearW = weekStones.find(ws => Math.hypot(ws.x - viewX, ws.y - viewY) < 55);
      if (nearW) {
        $('location').textContent = `${nearW.monthName.toUpperCase()} · WEEK 0${nearW.weekNum}`;
      }
    }
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#172f26';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);

  drawTerrain(now);

  // Avatar
  let p = player;
  ellipse(p.x, p.y + 8, 17, 7, '#0a211c88');
  ctx.strokeStyle = '#f3d78b88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 6, 25 + Math.sin(now / 300) * 3, 13, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#27392e';
  ctx.fillRect(p.x - 7, p.y - 3, 5, 12);
  ctx.fillRect(p.x + 3, p.y - 3, 5, 12);
  poly([[p.x - 10, p.y - 20], [p.x + 10, p.y - 20], [p.x + 12, p.y], [p.x - 12, p.y]], '#dcba72');
  ellipse(p.x, p.y - 27, 8, 9, '#e4bf8e');
  ellipse(p.x, p.y - 32, 10, 4, '#465943');
  ctx.fillStyle = '#746040';
  ctx.fillRect(p.x - 8, p.y - 16, 11, 14);

  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4dfaa';
  ctx.fillText('YOU', p.x, p.y - 48);

  ctx.restore();

  // Edge Vignette
  let grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#10251c88');
  grad.addColorStop(.2, '#10251c00');
  grad.addColorStop(.72, '#10251c00');
  grad.addColorStop(1, '#10251c88');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  requestAnimationFrame(loop);
}

// Initial Launch
selectYearChapter(0);
resize();
requestAnimationFrame(loop);



/* Daily Review Journal */
(() => {
  const storageKey = 'lifequest-daily-reviews-v1';

  const dialog = document.getElementById('daily-review-dialog');
  const dateInput = document.getElementById('review-date');
  const status = document.getElementById('review-status');

  const fieldIds = [
    'review-wins',
    'review-challenges',
    'review-lessons',
    'review-tomorrow'
  ];

  // Load previously saved reviews
  let reviews = {};

  try {
    reviews = JSON.parse(
      localStorage.getItem(storageKey) || '{}'
    ) || {};
  } catch {
    reviews = {};
  }

  // Format a date as YYYY-MM-DD
  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Display the review for the selected date
  function showReview() {
    const entry = reviews[dateInput.value] || {};

    fieldIds.forEach(id => {
      document.getElementById(id).value = entry[id] || '';
    });

    status.textContent = reviews[dateInput.value]
      ? 'Review loaded. Changes save automatically.'
      : 'No review for this date yet. Changes save automatically.';
  }

  // Automatically save the review
  function saveReview() {
    const entry = {};

    fieldIds.forEach(id => {
      entry[id] = document.getElementById(id).value;
    });

    if (fieldIds.every(id => entry[id].trim() === '')) {
      delete reviews[dateInput.value];
    } else {
      reviews[dateInput.value] = entry;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(reviews)
      );

      status.textContent = `Saved for ${dateInput.value} ✓`;
    } catch {
      status.textContent =
        'Could not save: browser storage is unavailable or full.';
    }
  }

  // Move to another day
  function changeDay(amount) {
    const [year, month, day] = dateInput.value
      .split('-')
      .map(Number);

    const date = new Date(year, month - 1, day, 12);

    date.setDate(date.getDate() + amount);
    dateInput.value = localDate(date);

    showReview();
  }

  // Open journal at today's date
  document.getElementById('review-open')
    .addEventListener('click', () => {
      dateInput.value = localDate(new Date());
      showReview();
      dialog.showModal();
    });

  // Close journal
  document.getElementById('review-close')
    .addEventListener('click', () => dialog.close());

  // Previous day
  document.getElementById('review-prev')
    .addEventListener('click', () => changeDay(-1));

  // Next day
  document.getElementById('review-next')
    .addEventListener('click', () => changeDay(1));

  // Select a date from the calendar
  dateInput.addEventListener('change', showReview);

  // Save whenever you type
  fieldIds.forEach(id => {
    document.getElementById(id)
      .addEventListener('input', saveReview);
  });
})();

/* =====================================
   MAP DAY / NIGHT MODE
   Keep this after the original Life Quest
   map and Daily Review code.
===================================== */
(() => {
    const game = document.querySelector('.game');
    const toggle = document.getElementById('theme-toggle');

    // If the optional button is not in HTML, the map still works.
    if (!game || !toggle) return;

    let mode = 'day';

    try {
        if (localStorage.getItem('lifequest-map-mode') === 'night') {
            mode = 'night';
        }
    } catch (error) {
        // Storage may be disabled; day mode still works.
    }

    function updateLighting() {
        const isNight = mode === 'night';
        game.classList.toggle('night-mode', isNight);
        toggle.textContent = isNight ? '☀️ Day' : '🌙 Night';
        toggle.setAttribute('aria-pressed', String(isNight));
        toggle.title = isNight ? 'Switch to day mode' : 'Switch to night mode';
    }


    

    toggle.addEventListener('click', () => {
        mode = mode === 'day' ? 'night' : 'day';
        updateLighting();

        try {
            localStorage.setItem('lifequest-map-mode', mode);
        } catch (error) {
            // The toggle continues to work without permanent storage.
        }
    });

    updateLighting();
})();



/* ===== FULL-SCREEN DREAM MODE ===== */

let activeDreamIndex = 0;

// Imagination text for each milestone
const dreamCaptions = {
    2027: "I walk into my company feeling confident and capable.",
    2028: "I have built the skills to create the future I imagined.",
    2029: "My work and knowledge have made me an expert in networking.",
    2030: "I am finally behind the wheel of my dream car.",
    2031: "I pull up in my Lamborghini outside our beautiful mansion. Mum and Dad are home.",
    2032: "I am debt-free and ready for the next adventure."
};


// Open a dream in full-screen mode
function openDreamScene(index) {

    activeDreamIndex = (index + chapters.length) % chapters.length;

    if (currentMode === 'years' &&
        selectedYearIdx !== activeDreamIndex) {
        selectYearChapter(activeDreamIndex, true);
    }

    const milestone = chapters[activeDreamIndex];
    const photo = getYearChapterImage(activeDreamIndex);
    const image = $('dream-photo');

    // Display saved image or placeholder
    image.hidden = !photo;
    $('dream-empty').hidden = Boolean(photo);

    if (photo) {
        image.src = photo;
    } else {
        image.removeAttribute('src');
    }

    
// Use the same image for the blurred background
const dreamStage = document.querySelector('.dream-stage');

if (dreamStage) {
    dreamStage.style.setProperty(
        '--dream-background',
        photo ? `url("${photo}")` : 'none'
    );
}


    // Update text
    $('dream-year').textContent = milestone.year;

    $('dream-title').textContent =
        getYearChapterName(activeDreamIndex);

    $('dream-caption').textContent =
        dreamCaptions[milestone.year] || milestone.desc;

    // Open full-screen dialog
    if (!$('dream-dialog').open) {
        $('dream-dialog').showModal();
    }
}


// Close dream
$('dream-close').onclick = () => {
    $('dream-dialog').close();
};


// Previous milestone
$('dream-prev').onclick = () => {
    openDreamScene(activeDreamIndex - 1);
};


// Next milestone
$('dream-next').onclick = () => {
    openDreamScene(activeDreamIndex + 1);
};


// Open file picker
$('dream-add-photo').onclick = () => {
    $('dream-file').click();
};


// Upload and save a dream image
$('dream-file').onchange = event => {

    const file = event.target.files &&
                 event.target.files[0];

    if (!file) return;

    const index = activeDreamIndex;

    compressAndSaveImage(file, dataUrl => {

        const previous = yearData[index].image;
        yearData[index].image = dataUrl;

        try {
            localStorage.setItem(
                'lifequest-v1',
                JSON.stringify(yearData)
            );
        } catch (error) {
            yearData[index].image = previous;
            alert("Could not save image. Browser storage may be full.");
            return;
        }

        if (currentMode === 'years' &&
            selectedYearIdx === index) {
            updateImageUI(dataUrl);
        }

        openDreamScene(index);
    });

    event.target.value = '';
};


