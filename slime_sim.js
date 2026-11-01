const canvas = document.getElementById('slimeCanvas');
const ctx = canvas.getContext('2d');
const microCanvas = document.getElementById('microCanvas');
const microCtx = microCanvas ? microCanvas.getContext('2d') : null;
const statusLog = document.getElementById('statusLog');

const btnBorax = document.getElementById('btnBorax');
const btnIron = document.getElementById('btnIron');
const btnMagnet = document.getElementById('btnMagnet');
const btnReset = document.getElementById('btnReset');

let boraxInjected = false;
let clickCount = 0;
let slimeViscosity = 0;

let ironInjected = false;
let ironClickCount = 0;
let ironMixRatio = 0;

let magnetActive = false;
let mouseCanvasX = 0;
let mouseCanvasY = 0;
let mouseInCanvas = false;

const jar = {
  x: 290,
  y: 255,
  width: 380,
  height: 290,
  neckWidth: 230,
  neckHeight: 45,
  get left() { return this.x - this.width / 2; },
  get right() { return this.x + this.width / 2; },
  get top() { return this.y - this.height / 2; },
  get bottom() { return this.y + this.height / 2; }
};

function drawMagicJar(context) {
  context.save();
  
  const left = jar.left;
  const right = jar.right;
  const top = jar.top;
  const bottom = jar.bottom;
  const neckLeft = jar.x - jar.neckWidth / 2;
  const neckRight = jar.x + jar.neckWidth / 2;
  const neckTop = top - jar.neckHeight;

  context.beginPath();
  context.moveTo(neckLeft - 10, neckTop);
  context.lineTo(neckRight + 10, neckTop);
  context.lineTo(neckRight, top);
  context.quadraticCurveTo(right + 18, top + 35, right, bottom - 35);
  context.quadraticCurveTo(right - 25, bottom, jar.x, bottom);
  context.quadraticCurveTo(left + 25, bottom, left, bottom - 35);
  context.quadraticCurveTo(left - 18, top + 35, neckLeft, top);
  context.closePath();

  context.fillStyle = 'rgba(26, 12, 48, 0.4)';
  context.fill();

  context.strokeStyle = 'rgba(179, 136, 255, 0.55)';
  context.lineWidth = 3.5;
  context.shadowColor = '#9c27b0';
  context.shadowBlur = 15;
  context.stroke();

  context.beginPath();
  context.ellipse(jar.x, neckTop, jar.neckWidth / 2 + 10, 12, 0, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(225, 190, 231, 0.7)';
  context.lineWidth = 2.5;
  context.stroke();

  context.restore();
}

class FloatingBoraxMolecules {
  constructor(x, y, index, total) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = 4.5 + Math.random() * 2.5;
    this.radius = 3.0;
    this.absorbed = false;
    this.targetClick = Math.floor((index / total) * 10) + 1;
    this.attractToClick = false;
    this.clickTargetX = jar.x;
    this.clickTargetY = jar.bottom - 70;
  }

  triggerAbsorption(clickNum, targetX, targetY) {
    if (this.targetClick <= clickNum && !this.absorbed) {
      this.attractToClick = true;
      this.clickTargetX = targetX;
      this.clickTargetY = targetY;
    }
  }

  update() {
    if (this.absorbed) return;

    if (this.attractToClick) {
      const dx = this.clickTargetX - this.x;
      const dy = this.clickTargetY - this.y;
      const dist = Math.hypot(dx, dy) || 0.001;

      this.vx += (dx / dist) * 1.8;
      this.vy += (dy / dist) * 1.8;

      if (dist < 32) {
        this.absorbed = true;
      }
    } else {
      if (this.y < jar.bottom - 55) {
        this.vy += 0.15;
      } else {
        this.vy *= 0.75;
        this.vx += (Math.random() - 0.5) * 0.25;
      }
    }

    this.vx *= 0.94;
    this.vy *= 0.94;

    this.x += this.vx;
    this.y += this.vy;

    this.x = Math.max(jar.left + 25, Math.min(jar.right - 25, this.x));
    this.y = Math.min(jar.bottom - 15, this.y);
  }

  draw(context) {
    if (this.absorbed) return;
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = '#69f0ae';
    context.shadowColor = '#00e676';
    context.shadowBlur = 8;
    context.fill();
    context.restore();
  }
}

const jarBoraxList = [];

class MacroIronParticle {
  constructor(x, y, index, total) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = 4.0 + Math.random() * 2.5;
    this.radius = 1.8 + Math.random() * 1.5;
    this.inSlime = false;
    this.relX = 0;
    this.relY = 0;
    this.absorbed = false;
    this.targetClick = Math.floor((index / total) * 5) + 1;
    this.attractToClick = false;
    this.clickTargetX = jar.x;
    this.clickTargetY = jar.bottom - 60;
  }

  triggerAbsorption(clickNum, targetX, targetY) {
    if (this.targetClick <= clickNum && !this.absorbed) {
      this.attractToClick = true;
      this.clickTargetX = targetX;
      this.clickTargetY = targetY;
    }
  }

  update(slimeCenterX, slimeCenterY, rx, ry) {
    if (this.absorbed) return;

    if (this.attractToClick) {
      const dx = this.clickTargetX - this.x;
      const dy = this.clickTargetY - this.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      this.x += (dx / dist) * 2.5;
      this.y += (dy / dist) * 2.5;
      if (dist < 22) {
        this.absorbed = true;
      }
    } else if (!this.inSlime) {
      this.vy += 0.12;
      this.x += this.vx;
      this.y += this.vy;

      const dx = (this.x - slimeCenterX) / rx;
      const dy = (this.y - slimeCenterY) / ry;
      if (dx * dx + dy * dy < 0.95 || this.y >= slimeCenterY - 10) {
        this.inSlime = true;
        this.relX = (this.x - slimeCenterX) * (0.55 + Math.random() * 0.35);
        this.relY = (this.y - slimeCenterY) * 0.45 - 10;
      }
    } else {
      this.x = slimeCenterX + this.relX;
      this.y = slimeCenterY + this.relY;
    }

    this.x = Math.max(jar.left + 20, Math.min(jar.right - 20, this.x));
    this.y = Math.min(jar.bottom - 15, this.y);
  }

  draw(context) {
    if (this.absorbed) return;
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = '#263238';
    context.shadowColor = '#90a4ae';
    context.shadowBlur = 3;
    context.fill();
    context.strokeStyle = '#78909c';
    context.lineWidth = 0.6;
    context.stroke();
    context.restore();
  }
}

const macroIronList = [];

class MacroSlimeInsideJar {
  constructor() {
    this.points = 26;
    this.angles = [];
    this.offsets = [];
    this.time = 0;
    this.centerX = jar.x;
    this.centerY = jar.bottom - 45;
    this.baseCenterY = jar.bottom - 45;
    this.shockWave = 0;
    this.stretchX = 0;
    this.stretchY = 0;
    for (let i = 0; i < this.points; i++) {
      this.angles.push((i / this.points) * Math.PI * 2);
      this.offsets.push(0);
    }
  }

  triggerShock() {
    this.shockWave = 8;
  }

  update() {
    const isCompleted = clickCount >= 10;
    this.time += isCompleted ? 0.008 : 0.04;
    const waveAmp = isCompleted ? 1.0 : (1 - slimeViscosity * 0.7) * 16 + 2;

    this.baseCenterY = jar.bottom - (45 + slimeViscosity * 35);

    if (magnetActive && ironMixRatio >= 1 && mouseInCanvas) {
      const dx = mouseCanvasX - jar.x;
      const dy = mouseCanvasY - this.baseCenterY;
      const dist = Math.hypot(dx, dy) || 0.001;

      if (dist < 360) {
        const pull = Math.max(0, (360 - dist) / 360);
        const targetStretchX = (dx / dist) * pull * 140;
        const targetStretchY = Math.min(35, (dy / dist) * pull * 125);

        this.stretchX += (targetStretchX - this.stretchX) * 0.18;
        this.stretchY += (targetStretchY - this.stretchY) * 0.18;
      } else {
        this.stretchX *= 0.88;
        this.stretchY *= 0.88;
      }
    } else {
      this.stretchX *= 0.88;
      this.stretchY *= 0.88;
    }

    this.centerX = jar.x + this.stretchX * 0.55;
    this.centerY = this.baseCenterY + this.stretchY * 0.45;

    if (this.shockWave > 0.05) {
      this.shockWave *= isCompleted ? 0.7 : 0.88;
    } else {
      this.shockWave = 0;
    }

    const damping = isCompleted ? 0.04 : 0.12;

    for (let i = 0; i < this.points; i++) {
      const a = this.angles[i];
      let targetOffset = Math.sin(this.time * 2 + i * 0.8) * waveAmp;

      if (magnetActive && ironMixRatio >= 1 && mouseInCanvas) {
        const pNormX = Math.cos(a);
        const pNormY = Math.sin(a);
        const dot = (pNormX * this.stretchX + pNormY * this.stretchY) / 50;
        if (dot > 0) {
          targetOffset += dot * 32;
        }
      }

      if (this.shockWave > 0) {
        targetOffset += Math.sin(this.time * 8 + i * 2) * this.shockWave;
      }
      if (Math.sin(a) > 0.4 && (!magnetActive || this.stretchY >= 0)) {
        targetOffset *= 0.3;
      }
      this.offsets[i] += (targetOffset - this.offsets[i]) * damping;
    }
  }

  draw(context) {
    context.save();
    context.beginPath();

    const rx = 100 - (slimeViscosity * 22);
    const ry = 32 + slimeViscosity * 32;

    const firstA = this.angles[0];
    const p0x = this.centerX + Math.cos(firstA) * (rx + this.offsets[0]);
    const p0y = this.centerY + Math.sin(firstA) * (ry + this.offsets[0]);
    context.moveTo(p0x, p0y);

    for (let i = 0; i < this.points; i++) {
      const next = (i + 1) % this.points;
      const a1 = this.angles[i];
      const a2 = this.angles[next];

      let r1x = rx + this.offsets[i];
      let r1y = ry + this.offsets[i];
      let r2x = rx + this.offsets[next];
      let r2y = ry + this.offsets[next];

      let x1 = this.centerX + Math.cos(a1) * r1x;
      let y1 = this.centerY + Math.sin(a1) * r1y;
      let x2 = this.centerX + Math.cos(a2) * r2x;
      let y2 = this.centerY + Math.sin(a2) * r2y;

      x1 = Math.max(jar.left + 16, Math.min(jar.right - 16, x1));
      x2 = Math.max(jar.left + 16, Math.min(jar.right - 16, x2));
      y1 = Math.min(jar.bottom - 10, y1);
      y2 = Math.min(jar.bottom - 10, y2);

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      context.quadraticCurveTo(x1, y1, mx, my);
    }

    context.closePath();

    const grad = context.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, rx + 15);
    if (ironMixRatio > 0.1) {
      grad.addColorStop(0, '#546e7a');
      grad.addColorStop(0.4, '#263238');
      grad.addColorStop(1, '#0d1117');
      context.shadowColor = '#37474f';
      context.shadowBlur = 15;
    } else if (slimeViscosity < 0.25) {
      grad.addColorStop(0, 'rgba(149, 117, 205, 0.55)');
      grad.addColorStop(0.7, 'rgba(103, 58, 183, 0.4)');
      grad.addColorStop(1, 'rgba(49, 27, 146, 0.2)');
      context.shadowColor = '#7e57c2';
      context.shadowBlur = 10;
    } else {
      const glow = slimeViscosity;
      grad.addColorStop(0, '#e1bee7');
      grad.addColorStop(0.4, '#ab47bc');
      grad.addColorStop(1, '#4a148c');
      context.shadowColor = '#ba68c8';
      context.shadowBlur = 20 * glow + 4;
    }

    context.fillStyle = grad;
    context.fill();

    context.strokeStyle = ironMixRatio > 0.1 ? '#90a4ae' : (slimeViscosity < 0.25 ? 'rgba(209, 196, 233, 0.4)' : '#f3e5f5');
    context.lineWidth = slimeViscosity < 0.25 ? 1.5 : 2.5;
    context.stroke();

    if (ironMixRatio >= 1) {
      context.save();
      const faceX = this.centerX + this.stretchX * 0.25;
      const faceY = this.centerY + this.stretchY * 0.25 - 4;

      context.fillStyle = '#e0f7fa';
      context.shadowColor = '#80deea';
      context.shadowBlur = 6;

      context.beginPath();
      context.arc(faceX - 18, faceY - 4, 3.0, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.arc(faceX + 18, faceY - 4, 3.0, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = '#e0f7fa';
      context.lineWidth = 2.0;
      context.lineCap = 'round';
      context.beginPath();
      context.arc(faceX, faceY + 4, 10, Math.PI * 0.15, Math.PI * 0.85, false);
      context.stroke();

      context.restore();
    }

    context.restore();
  }
}

const jarSlime = new MacroSlimeInsideJar();

class MicroNode {
  constructor(x, y, label = '-OH', isOH = true, side = 'down') {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.label = label;
    this.isOH = isOH;
    this.side = side; // 'up', 'down', or 'both'
    this.radius = isOH ? 5.5 : 4.0;
  }

  getOHPos(specificSide) {
    const s = specificSide || (this.side === 'both' ? 'down' : this.side);
    const branchDir = s === 'up' ? -1 : 1;
    return {
      x: this.x,
      y: this.y + branchDir * 20
    };
  }

  update(time, magDx, magDy) {
    const shiftX = magnetActive && ironMixRatio >= 1 ? magDx * 14 : 0;
    const shiftY = magnetActive && ironMixRatio >= 1 ? magDy * 14 : 0;
    this.x = this.baseX + Math.sin(time + this.baseY * 0.1) * 2.0 + shiftX;
    this.y = this.baseY + Math.cos(time + this.baseX * 0.1) * 2.0 + shiftY;
  }
}

class MicroPVAChain {
  constructor(baseY, nodeCount = 15, spacing = 35, startX = 45, mainOHSide = 'down', inverted = false) {
    this.nodes = [];
    this.mainOHSide = mainOHSide; // 'down', 'up', or 'both'
    const zigAmp = 14;

    for (let i = 0; i < nodeCount; i++) {
      const x = startX + i * spacing;
      // Zigzag alternating Y positions (inverted flips the zigzag phase)
      const zigDir = (i % 2 === 0) ? -1 : 1;
      const y = baseY + (inverted ? -zigDir : zigDir) * zigAmp;
      const isCH = (i % 2 === 1); // every other carbon has -OH group
      const label = isCH ? '-OH' : '';
      const node = new MicroNode(x, y, label, isCH, isCH ? mainOHSide : 'none');
      this.nodes.push(node);
    }
  }

  get ohNodes() {
    return this.nodes.filter(n => n.isOH);
  }

  update(time, magDx, magDy) {
    for (const node of this.nodes) {
      node.update(time, magDx, magDy);
    }
  }

  draw(context) {
    context.save();
    
    // 1. Draw Zig-zag Carbon-Carbon Backbone (-CH2-CH-)
    context.strokeStyle = 'rgba(186, 104, 200, 0.85)';
    context.lineWidth = 3.5;
    context.shadowColor = '#ab47bc';
    context.shadowBlur = 10;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(this.nodes[0].x, this.nodes[0].y);
    for (let i = 1; i < this.nodes.length; i++) {
      context.lineTo(this.nodes[i].x, this.nodes[i].y);
    }
    context.stroke();

    // 2. Draw Backbone Carbon Vertices & -OH Branches
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      
      // Carbon backbone vertex
      context.beginPath();
      context.arc(node.x, node.y, 3.8, 0, Math.PI * 2);
      context.fillStyle = '#ba68c8';
      context.fill();

      // -OH group side chain branch
      if (node.isOH) {
        const sides = node.side === 'both' ? ['up', 'down'] : [node.side];
        for (const s of sides) {
          const ohPos = node.getOHPos(s);
          const branchDir = s === 'up' ? -1 : 1;

          // C-O single bond line
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(ohPos.x, ohPos.y);
          context.strokeStyle = 'rgba(225, 190, 231, 0.9)';
          context.lineWidth = 2.2;
          context.stroke();

          // Oxygen / -OH bead
          context.beginPath();
          context.arc(ohPos.x, ohPos.y, node.radius, 0, Math.PI * 2);
          context.fillStyle = '#f3e5f5';
          context.shadowColor = '#ce93d8';
          context.shadowBlur = 8;
          context.fill();
          context.strokeStyle = '#ab47bc';
          context.lineWidth = 1.2;
          context.stroke();
        }
      }
    }
    context.restore();
  }
}

// Micro H2O particle released during PVA-Borate condensation reaction (-OH leaving group + H+ -> H2O)
class MicroH2OParticle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = 1.0;
    this.decay = 0.018;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life -= this.decay;
  }

  draw(context) {
    if (this.life <= 0) return;
    context.save();
    context.globalAlpha = Math.max(0, this.life);

    // Water droplet aura
    context.beginPath();
    context.arc(this.x, this.y, 8, 0, Math.PI * 2);
    context.fillStyle = 'rgba(64, 196, 255, 0.25)';
    context.shadowColor = '#40c4ff';
    context.shadowBlur = 8;
    context.fill();

    // H2O Badge
    context.fillStyle = '#0288d1';
    context.beginPath();
    if (context.roundRect) {
      context.roundRect(this.x - 13, this.y - 7, 26, 14, 6);
    } else {
      context.rect(this.x - 13, this.y - 7, 26, 14);
    }
    context.fill();
    context.strokeStyle = '#b3e5fc';
    context.lineWidth = 1.2;
    context.stroke();

    context.fillStyle = '#ffffff';
    context.font = 'bold 8.5px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('H₂O ↑', this.x, this.y);

    context.restore();
  }
}

// X-shaped Tetrahedral Borate Cross-linking (3-Step Chemical Reaction Mechanism)
// 1) Approach: Borate ion (B⁻) approaches 4 -OH groups
// 2) Condensation: -OH leaves, combining into 4 H₂O water molecules released outward
// 3) Bond Formation: C-O-B⁻-O-C 4-way tetrahedral cross-linked network established
class StaticCrossLink {
  constructor(topNode1, topNode2, btmNode1, btmNode2, topSide = 'down', btmSide = 'up') {
    this.topNode1 = topNode1;
    this.topNode2 = topNode2;
    this.btmNode1 = btmNode1;
    this.btmNode2 = btmNode2;
    this.topSide = topSide;
    this.btmSide = btmSide;
    this.progress = 0;
    this.h2oSpawned = false;

    const t1 = this.topNode1.getOHPos(this.topSide);
    const b2 = this.btmNode2.getOHPos(this.btmSide);
    this.targetCenterX = (t1.x + b2.x) / 2;
    this.incomingStartX = this.targetCenterX + (Math.random() - 0.5) * 50;
    this.incomingStartY = -20;
  }

  update() {
    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + 0.022);
    }

    // Step 2 Trigger: Release 4 H2O water molecules when condensation begins
    if (this.progress >= 0.42 && !this.h2oSpawned) {
      this.h2oSpawned = true;
      const t1 = this.topNode1.getOHPos(this.topSide);
      const t2 = this.topNode2.getOHPos(this.topSide);
      const b1 = this.btmNode1.getOHPos(this.btmSide);
      const b2 = this.btmNode2.getOHPos(this.btmSide);

      const targets = [
        { pt: t1, vx: -1.4, vy: -1.6 },
        { pt: t2, vx: 1.4, vy: -1.6 },
        { pt: b1, vx: -1.4, vy: 1.6 },
        { pt: b2, vx: 1.4, vy: 1.6 }
      ];

      for (const item of targets) {
        microH2OList.push(new MicroH2OParticle(item.pt.x, item.pt.y, item.vx, item.vy));
      }
    }
  }

  draw(context) {
    if (this.progress <= 0) return;
    context.save();

    const t1 = this.topNode1.getOHPos(this.topSide);
    const t2 = this.topNode2.getOHPos(this.topSide);
    const b1 = this.btmNode1.getOHPos(this.btmSide);
    const b2 = this.btmNode2.getOHPos(this.btmSide);

    const centerX = (t1.x + t2.x + b1.x + b2.x) / 4;
    const centerY = (t1.y + t2.y + b1.y + b2.y) / 4;

    const arms = [
      { pt: t1, parent: this.topNode1 },
      { pt: t2, parent: this.topNode2 },
      { pt: b1, parent: this.btmNode1 },
      { pt: b2, parent: this.btmNode2 }
    ];

    // Step 1: Borate Ion Approaching (0 <= progress < 0.42)
    if (this.progress < 0.42) {
      const pRatio = this.progress / 0.42;
      const curBoronX = this.incomingStartX + (centerX - this.incomingStartX) * pRatio;
      const curBoronY = this.incomingStartY + (centerY - this.incomingStartY) * pRatio;

      // Approaching Borate Ion Sphere
      context.beginPath();
      context.arc(curBoronX, curBoronY, 8.0, 0, Math.PI * 2);
      context.fillStyle = '#00e676';
      context.shadowColor = '#69f0ae';
      context.shadowBlur = 14;
      context.fill();
      context.strokeStyle = '#b9f6ca';
      context.lineWidth = 1.6;
      context.stroke();

      context.fillStyle = '#0a1d12';
      context.font = 'bold 9px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('B⁻', curBoronX, curBoronY);

      // Chemical notation
      context.fillStyle = '#69f0ae';
      context.font = 'bold 8px sans-serif';
      context.fillText('[B(OH)₄]⁻ 접근', curBoronX, curBoronY - 14);

      // Dotted targeting guide lines
      context.strokeStyle = 'rgba(105, 240, 174, 0.4)';
      context.setLineDash([4, 3]);
      context.lineWidth = 1.2;
      for (const arm of arms) {
        context.beginPath();
        context.moveTo(curBoronX, curBoronY);
        context.lineTo(arm.pt.x, arm.pt.y);
        context.stroke();
      }
      context.setLineDash([]);
    } else {
      // Step 2 & 3: Condensation & C-O-B⁻-O-C Tetrahedral Network (0.42 <= progress <= 1.0)
      const bondProgress = (this.progress - 0.42) / 0.58;

      context.strokeStyle = 'rgba(0, 230, 118, 0.95)';
      context.lineWidth = 2.8;
      context.shadowColor = '#00e676';
      context.shadowBlur = 14;

      // Draw C-O single bond line from parent carbon to oxygen branch point
      for (const arm of arms) {
        context.beginPath();
        context.moveTo(arm.parent.x, arm.parent.y);
        context.lineTo(arm.pt.x, arm.pt.y);
        context.strokeStyle = 'rgba(225, 190, 231, 0.9)';
        context.lineWidth = 2.2;
        context.stroke();
      }

      // Draw 4 arms of covalent/coordination bonds connecting Oxygen (O) to Boron (B⁻)
      for (const arm of arms) {
        const curX = arm.pt.x + (centerX - arm.pt.x) * bondProgress;
        const curY = arm.pt.y + (centerY - arm.pt.y) * bondProgress;
        context.beginPath();
        context.moveTo(arm.pt.x, arm.pt.y);
        context.lineTo(curX, curY);
        context.stroke();
      }

      // Oxygen (O) beads at the 4 junction points with clear label 'O'
      for (const arm of arms) {
        context.beginPath();
        context.arc(arm.pt.x, arm.pt.y, 6.2, 0, Math.PI * 2);
        context.fillStyle = '#e8f5e9';
        context.shadowColor = '#00e676';
        context.shadowBlur = 8;
        context.fill();
        context.strokeStyle = '#00e676';
        context.lineWidth = 1.6;
        context.stroke();

        context.fillStyle = '#1b5e20';
        context.font = 'bold 9px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('O', arm.pt.x, arm.pt.y);
      }

      // Central Tetrahedral Borate Ion B⁻
      context.beginPath();
      context.arc(centerX, centerY, 8.5, 0, Math.PI * 2);
      context.fillStyle = '#00e676';
      context.shadowColor = '#69f0ae';
      context.shadowBlur = 18;
      context.fill();
      context.strokeStyle = '#b9f6ca';
      context.lineWidth = 1.8;
      context.stroke();

      context.fillStyle = '#0a1d12';
      context.font = 'bold 9.5px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('B⁻', centerX, centerY);

      // Structure Formula Label (C-O-B⁻-O-C)
      context.fillStyle = '#b9f6ca';
      context.font = 'bold 8.5px sans-serif';
      context.fillText('C-O-B⁻-O-C', centerX, centerY + 18);
    }

    context.restore();
  }
}

class MicroIronParticle {
  constructor(x, y, targetSlotX, targetSlotY) {
    this.x = x;
    this.y = y;
    this.baseSlotX = targetSlotX;
    this.baseSlotY = targetSlotY;
    this.radius = 5.0;
    this.trapped = false;
    this.angle = 0;
  }

  update(magDx, magDy) {
    const shiftX = magnetActive && ironMixRatio >= 1 ? magDx * 16 : 0;
    const shiftY = magnetActive && ironMixRatio >= 1 ? magDy * 16 : 0;
    const targetX = this.baseSlotX + shiftX;
    const targetY = this.baseSlotY + shiftY;

    if (!this.trapped) {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      this.x += dx * 0.08;
      this.y += dy * 0.08;
      if (Math.hypot(dx, dy) < 2) {
        this.trapped = true;
      }
    } else {
      this.x += (targetX - this.x) * 0.15;
      this.y += (targetY - this.y) * 0.15;
    }

    if (magnetActive && ironMixRatio >= 1) {
      this.angle = Math.atan2(magDy, magDx);
    } else {
      this.angle = 0;
    }
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);

    context.beginPath();
    context.ellipse(0, 0, this.radius + 2.0, this.radius - 0.8, 0, 0, Math.PI * 2);
    context.fillStyle = '#263238';
    context.shadowColor = magnetActive ? '#ef5350' : '#90a4ae';
    context.shadowBlur = magnetActive ? 9 : 5;
    context.fill();
    context.strokeStyle = magnetActive ? '#ff8a80' : '#b0bec5';
    context.lineWidth = 1.2;
    context.stroke();

    context.fillStyle = '#cfd8dc';
    context.font = 'bold 9px sans-serif';
    context.textAlign = 'center';
    context.fillText('Fe', 0, 3.5);

    context.restore();
  }
}

const microChains = [];
const staticLinks = [];
const microIronList = [];
const microH2OList = [];
let microTime = 0;

function initMicroChains() {
  microChains.length = 0;
  staticLinks.length = 0;
  microIronList.length = 0;
  microH2OList.length = 0;
  // 2 PVA Zig-zag Chains (Top & Bottom, balanced Y spacing)
  microChains.push(new MicroPVAChain(120, 15, 35, 45, 'down', false));
  microChains.push(new MicroPVAChain(280, 15, 35, 45, 'up', true));
}

function updateLog(msg) {
  statusLog.textContent = `[의식] ${msg}`;
}

class MagicBurstParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 2.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 1.6 + Math.random() * 2.0;
    this.life = 1.0;
    this.decay = 0.045 + Math.random() * 0.025;
    const rand = Math.random();
    if (rand < 0.45) {
      this.color = '#d4af37';
      this.glow = 'rgba(212, 175, 55, 0.4)';
    } else if (rand < 0.8) {
      this.color = '#9575cd';
      this.glow = 'rgba(149, 117, 205, 0.4)';
    } else {
      this.color = '#e0e0e0';
      this.glow = 'rgba(224, 224, 224, 0.3)';
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.life -= this.decay;
  }

  draw(context) {
    if (this.life <= 0) return;
    context.save();
    context.globalAlpha = Math.max(0, this.life * 0.85);
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.shadowColor = this.glow;
    context.shadowBlur = 5;
    context.fill();
    context.restore();
  }
}

const magicBurstParticles = [];

function spawnMagicBurst(x, y) {
  for (let i = 0; i < 14; i++) {
    magicBurstParticles.push(new MagicBurstParticle(x, y));
  }
}

btnBorax.addEventListener('click', () => {
  boraxInjected = true;
  clickCount = 0;
  slimeViscosity = 0;
  staticLinks.length = 0;
  jarBoraxList.length = 0;
  magicBurstParticles.length = 0;
  magnetActive = false;

  canvas.classList.remove('magnet-cursor');
  canvas.classList.add('magic-wand-cursor');

  const count = 16;
  for (let i = 0; i < count; i++) {
    const startX = jar.x - jar.neckWidth / 2 + 15 + Math.random() * (jar.neckWidth - 30);
    const startY = jar.top - jar.neckHeight + Math.random() * 18;
    jarBoraxList.push(new FloatingBoraxMolecules(startX, startY, i, count));
  }

  updateLog('붕소 시약 투입 완료. 마법봉으로 슬라임을 자극하여 가교결합을 유도하세요.');
});

btnIron.addEventListener('click', () => {
  if (clickCount < 10) {
    updateLog('먼저 1단계 붕소 가교결합을 완성해야 철가루를 균일하게 흡수할 수 있습니다.');
    return;
  }

  ironInjected = true;
  ironClickCount = 0;
  ironMixRatio = 0;
  macroIronList.length = 0;
  microIronList.length = 0;
  magnetActive = false;

  canvas.classList.remove('magnet-cursor');
  canvas.classList.add('magic-wand-cursor');

  const count = 35;
  for (let i = 0; i < count; i++) {
    const startX = jar.x - jar.neckWidth / 2 + 10 + Math.random() * (jar.neckWidth - 20);
    const startY = jar.top - jar.neckHeight + Math.random() * 15;
    macroIronList.push(new MacroIronParticle(startX, startY, i, count));
  }

  updateLog('암흑 철가루 투입 완료. 슬라임을 클릭하여 분자 구조 속으로 혼합 흡수시키세요.');
});

btnMagnet.addEventListener('click', () => {
  if (ironMixRatio < 1) {
    updateLog('철가루가 완전히 흡수되어 자성이 부여된 후 자석으로 조종할 수 있습니다.');
    return;
  }

  magnetActive = true;
  canvas.classList.remove('magic-wand-cursor');
  canvas.classList.add('magnet-cursor');

  updateLog('마력 자석 활성화됨: 마우스를 슬라임 주변으로 가져가 형태를 당기거나 조종하세요.');
});

function resetSimulation() {
  boraxInjected = false;
  clickCount = 0;
  slimeViscosity = 0;

  ironInjected = false;
  ironClickCount = 0;
  ironMixRatio = 0;

  magnetActive = false;
  mouseInCanvas = false;

  canvas.classList.remove('magic-wand-cursor');
  canvas.classList.remove('magnet-cursor');

  jarBoraxList.length = 0;
  macroIronList.length = 0;
  magicBurstParticles.length = 0;

  jarSlime.centerX = jar.x;
  jarSlime.centerY = jar.bottom - 45;
  jarSlime.baseCenterY = jar.bottom - 45;
  jarSlime.stretchX = 0;
  jarSlime.stretchY = 0;
  jarSlime.shockWave = 0;
  for (let i = 0; i < jarSlime.offsets.length; i++) {
    jarSlime.offsets[i] = 0;
  }

  if (microCanvas) {
    initMicroChains();
  }

  updateLog('시뮬레이션이 초기화되었습니다. 기본 액체 슬라임 상태로 돌아갔습니다.');
}

if (btnReset) {
  btnReset.addEventListener('click', resetSimulation);
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseCanvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  mouseCanvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;
  mouseInCanvas = true;
});

canvas.addEventListener('mouseleave', () => {
  mouseInCanvas = false;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

  const inSlimeArea = mouseX >= jar.left + 20 && mouseX <= jar.right - 20 && mouseY >= jar.top && mouseY <= jar.bottom;

  if (!inSlimeArea) return;

  if (boraxInjected && clickCount < 10) {
    clickCount++;
    slimeViscosity = clickCount * 0.1;
    jarSlime.triggerShock();
    spawnMagicBurst(mouseX, mouseY);

    for (const b of jarBoraxList) {
      b.triggerAbsorption(clickCount, mouseX, mouseY);
    }

    const targetLinks = Math.min(3, Math.floor((clickCount / 10) * 3 + 0.4));
    const c0 = microChains[0].nodes;
    const c1 = microChains[1].nodes;

    while (staticLinks.length < targetLinks && staticLinks.length < 3) {
      const idx = staticLinks.length;
      if (idx === 0) staticLinks.push(new StaticCrossLink(c0[1], c0[3], c1[1], c1[3], 'down', 'up'));
      else if (idx === 1) staticLinks.push(new StaticCrossLink(c0[5], c0[7], c1[5], c1[7], 'down', 'up'));
      else if (idx === 2) staticLinks.push(new StaticCrossLink(c0[9], c0[11], c1[9], c1[11], 'down', 'up'));
    }

    if (clickCount >= 10) {
      if (!ironInjected) canvas.classList.remove('magic-wand-cursor');
      updateLog('붕소 반응 완료: 고분자 사슬의 가교결합망과 점성 슬라임이 완성되었습니다.');
    } else {
      updateLog('마법 충격 흡수 중... 슬라임 내부 망상 구조가 형성되고 있습니다.');
    }
    return;
  }

  if (ironInjected && ironClickCount < 5) {
    ironClickCount++;
    ironMixRatio = ironClickCount / 5;
    jarSlime.triggerShock();
    spawnMagicBurst(mouseX, mouseY);

    for (const p of macroIronList) {
      p.triggerAbsorption(ironClickCount, mouseX, mouseY);
    }

    const microSlots = [
      { x: 185, y: 200 },
      { x: 325, y: 200 },
      { x: 465, y: 200 },
      { x: 50,  y: 200 },
      { x: 115, y: 55 },
      { x: 255, y: 55 },
      { x: 395, y: 55 },
      { x: 115, y: 345 },
      { x: 255, y: 345 },
      { x: 395, y: 345 }
    ];

    const targetMicroCount = Math.floor(ironMixRatio * microSlots.length);
    while (microIronList.length < targetMicroCount && microIronList.length < microSlots.length) {
      const slot = microSlots[microIronList.length];
      microIronList.push(new MicroIronParticle(slot.x, -20, slot.x, slot.y));
    }

    if (ironClickCount >= 5) {
      canvas.classList.remove('magic-wand-cursor');
      updateLog('철가루 완전 침투: 자성 미립자가 분자 구조에 100% 흡수되어 자성 슬라임이 완성되었습니다. 이제 3단계 자석을 발동하세요!');
    } else {
      updateLog('철가루 침투 진행 중... 자성 미립자가 분자 격자 사이로 스며들고 있습니다.');
    }
  }
});



function drawSpiderWeb(context, x, y, size, flipX = false) {
  context.save();
  context.translate(x, y);
  if (flipX) context.scale(-1, 1);
  context.strokeStyle = 'rgba(186, 104, 200, 0.22)';
  context.lineWidth = 0.9;

  const rays = 5;
  for (let i = 0; i <= rays; i++) {
    const angle = (i / rays) * (Math.PI / 2);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    context.stroke();
  }

  const rings = 4;
  for (let r = 1; r <= rings; r++) {
    const rad = (r / rings) * size;
    context.beginPath();
    for (let i = 0; i <= rays; i++) {
      const angle = (i / rays) * (Math.PI / 2);
      const px = Math.cos(angle) * rad;
      const py = Math.sin(angle) * rad;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
  }
  context.restore();
}

function drawJackOLantern(context, x, y, scale = 1.0, time = 0) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);

  // Pumpkin Body (3 overlapping segments)
  context.fillStyle = '#e65100';
  context.shadowColor = '#ff6d00';
  context.shadowBlur = 8;

  context.beginPath();
  context.ellipse(-14, 0, 12, 18, -0.15, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(14, 0, 12, 18, 0.15, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(0, 0, 15, 19, 0, 0, Math.PI * 2);
  context.fill();

  // Stem
  context.fillStyle = '#2e7d32';
  context.beginPath();
  context.moveTo(-3, -17);
  context.quadraticCurveTo(0, -26, 6, -24);
  context.quadraticCurveTo(2, -22, 2, -17);
  context.closePath();
  context.fill();

  // Soft Flickering Candle Glow for Eyes & Mouth
  const flicker = 0.82 + Math.sin(time * 5 + x) * 0.14;
  context.fillStyle = `rgba(255, 235, 59, ${flicker})`;
  context.shadowColor = '#ffeb3b';
  context.shadowBlur = 12 * flicker;

  // Left Eye (triangle)
  context.beginPath();
  context.moveTo(-9, -6);
  context.lineTo(-4, -1);
  context.lineTo(-11, -1);
  context.closePath();
  context.fill();

  // Right Eye (triangle)
  context.beginPath();
  context.moveTo(9, -6);
  context.lineTo(11, -1);
  context.lineTo(4, -1);
  context.closePath();
  context.fill();

  // Nose (small triangle)
  context.beginPath();
  context.moveTo(0, -2);
  context.lineTo(2.5, 2);
  context.lineTo(-2.5, 2);
  context.closePath();
  context.fill();

  // Jagged Carved Smile
  context.beginPath();
  context.moveTo(-11, 6);
  context.lineTo(-7, 10);
  context.lineTo(-4, 6);
  context.lineTo(0, 10);
  context.lineTo(4, 6);
  context.lineTo(7, 10);
  context.lineTo(11, 6);
  context.lineTo(8, 12);
  context.lineTo(3, 11);
  context.lineTo(0, 13);
  context.lineTo(-3, 11);
  context.lineTo(-8, 12);
  context.closePath();
  context.fill();

  context.restore();
}

function animateMacro() {
  ctx.fillStyle = '#08030e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Background Halloween Decor (Spiderweb on top corners, Jack-o'-lanterns at bottom corners)
  drawSpiderWeb(ctx, 0, 0, 60, false);
  drawSpiderWeb(ctx, canvas.width, 0, 60, true);
  drawJackOLantern(ctx, 38, canvas.height - 30, 0.9, microTime);
  drawJackOLantern(ctx, canvas.width - 38, canvas.height - 30, 0.9, microTime + 1.6);

  drawMagicJar(ctx);

  jarSlime.update();
  jarSlime.draw(ctx);

  const rx = 100 - (slimeViscosity * 22);
  const ry = 32 + slimeViscosity * 32;
  for (const iron of macroIronList) {
    iron.update(jarSlime.centerX, jarSlime.centerY, rx, ry);
    iron.draw(ctx);
  }

  for (let i = magicBurstParticles.length - 1; i >= 0; i--) {
    const p = magicBurstParticles[i];
    p.update();
    p.draw(ctx);
    if (p.life <= 0) {
      magicBurstParticles.splice(i, 1);
    }
  }

  for (const b of jarBoraxList) {
    b.update();
    b.draw(ctx);
  }
}

function animateMicro() {
  if (!microCtx) return;
  microCtx.fillStyle = '#090312';
  microCtx.fillRect(0, 0, microCanvas.width, microCanvas.height);

  microTime += 0.02;

  let magDx = 0;
  let magDy = 0;
  if (magnetActive && mouseInCanvas) {
    const mdx = mouseCanvasX - jar.x;
    const mdy = mouseCanvasY - (jar.bottom - 50);
    const mdist = Math.hypot(mdx, mdy) || 0.001;
    if (mdist < 300) {
      magDx = mdx / mdist;
      magDy = mdy / mdist;
    }
  }

  for (const chain of microChains) {
    chain.update(microTime, magDx, magDy);
    chain.draw(microCtx);
  }

  for (const link of staticLinks) {
    link.update();
    link.draw(microCtx);
  }

  for (let i = microH2OList.length - 1; i >= 0; i--) {
    const h2o = microH2OList[i];
    h2o.update();
    h2o.draw(microCtx);
    if (h2o.life <= 0) {
      microH2OList.splice(i, 1);
    }
  }

  for (const fe of microIronList) {
    fe.update(magDx, magDy);
    fe.draw(microCtx);
  }
}

function loop() {
  animateMacro();
  animateMicro();
  requestAnimationFrame(loop);
}

if (microCanvas) {
  initMicroChains();
}
loop();
