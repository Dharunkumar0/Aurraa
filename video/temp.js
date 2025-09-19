// Coulomb's Law Educational Game
// Single-file React component (Tailwind CSS should be configured in your project)

const { useRef, useState, useEffect } = React;

function CoulombGame() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showHint, setShowHint] = useState(true);
  const [finished, setFinished] = useState(false);
  const [playerCharge, setPlayerCharge] = useState(1); // +1 or -1
  const [kConstant, setKConstant] = useState(800); // visual scaling of force
  const [spawnRate, setSpawnRate] = useState(1200); // ms between falling charges

  // Internal game state kept outside of React rendering for smooth animation
  const stateRef = useRef({ particles: [], lastSpawn: 0, lastTime: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const DPR = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.clientWidth * DPR;
      canvas.height = canvas.clientHeight * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let animationId;
    const loop = (t) => {
      if (!stateRef.current.lastTime) stateRef.current.lastTime = t;
      const dt = (t - stateRef.current.lastTime) / 1000;
      stateRef.current.lastTime = t;

      update(dt);
      render(ctx, canvas);

      if (running && !finished) animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [running, finished, kConstant, spawnRate, level]);

  // Create a new falling charge
  const spawnParticle = () => {
    const width = canvasRef.current.clientWidth;
    const x = Math.random() * (width - 60) + 30;
    const charge = Math.random() < 0.5 ? 1 : -1; // +1 or -1
    const color = charge > 0 ? "#FF6B6B" : "#4D9EF6";
    const radius = 14 + Math.random() * 8;
    stateRef.current.particles.push({
      x,
      y: -30,
      vx: (Math.random() - 0.5) * 40,
      vy: 20 + Math.random() * 30,
      charge,
      color,
      radius,
      attracted: false,
      life: 0,
    });
  };

  // Update all particles (physics + spawn)
  const update = (dt) => {
    const s = stateRef.current;
    s.lastSpawn += dt * 1000;
    if (s.lastSpawn > spawnRate) {
      s.lastSpawn = 0;
      spawnParticle();
    }

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Player charge position (controlled by mouse)
    const player = s.player || { x: width / 2, y: height - 80 };

    // Simple attract/repel physics: apply Coulomb-like force from player to each particle
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      // gravity-like downward pull
      p.vy += 30 * dt;

      // compute vector from particle to player
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const distSq = Math.max(20, dx * dx + dy * dy);
      const dist = Math.sqrt(distSq);

      // Coulomb force magnitude scaled for gameplay
      const force = (kConstant * player.charge * p.charge) / (distSq);

      // Convert to acceleration - divide by mass (mass ~ radius)
      const ax = (force * dx) / (p.radius * dist);
      const ay = (force * dy) / (p.radius * dist);

      // Apply to velocity
      p.vx += ax * dt;
      p.vy += ay * dt;

      // Euler integrate
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.life += dt;

      // collision with player (collect if opposite charge -> attractive capture)
      const pxDist = Math.hypot(p.x - player.x, p.y - player.y);
      if (pxDist < p.radius + 22) {
        // If opposite sign -> collect + points, same sign -> lose points
        if (p.charge * player.charge < 0) {
          setScore((s) => s + Math.round(10 + (20 / (1 + p.life))));
        } else {
          setScore((s) => Math.max(0, s - 5));
        }
        // remove particle
        s.particles.splice(i, 1);
      } else if (p.y > height + 40) {
        // particle fell off screen
        s.particles.splice(i, 1);
      }
    }

    // level progression by score
    if (score > level * 150 && level < 10) {
      setLevel((l) => l + 1);
      setSpawnRate((r) => Math.max(350, r - 120));
      setKConstant((k) => k + 200);
    }
  };

  // Render the scene
  const render = (ctx, canvas) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // background gradient
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#081229");
    g.addColorStop(1, "#0b2a3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // decorative grid / atoms
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc((i + 0.5) * (w / 6), 70 + (i % 2) * 20, 40, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // draw particles
    for (const p of stateRef.current.particles) {
      // glow
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.12;
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // main circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // + or - label
      ctx.fillStyle = "white";
      ctx.font = `${Math.max(10, p.radius)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.charge > 0 ? "+" : "-", p.x, p.y + 1);
    }

    // player
    const player = stateRef.current.player || {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight - 80,
      charge: playerCharge,
    };

    // draw force field halo
    ctx.beginPath();
    ctx.arc(player.x, player.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = player.charge > 0 ? "rgba(255,107,107,0.12)" : "rgba(77,158,246,0.12)";
    ctx.fill();

    // player circle
    ctx.beginPath();
    ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = player.charge > 0 ? "#FF6B6B" : "#4D9EF6";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player.charge > 0 ? "+" : "-", player.x, player.y + 1);

    // HUD (score + level + hint)
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 18, 26);
    ctx.fillText(`Level: ${level}`, 18, 46);

    // bottom help text
    ctx.font = "12px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("Drag the circle to attract/repel charges — collect opposite charges for points.", w - 18, h - 20);
  };

  // Mouse / touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      stateRef.current.player = { x, y, charge: playerCharge };
    };
    const onLeave = () => {
      // keep player centered
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      stateRef.current.player = { x: w / 2, y: h - 80, charge: playerCharge };
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchend", onLeave);

    // initialize player
    onLeave();

    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchend", onLeave);
    };
  }, [playerCharge]);

  const togglePause = () => setRunning((r) => !r);
  const resetGame = () => {
    stateRef.current.particles = [];
    stateRef.current.lastSpawn = 0;
    setScore(0);
    setLevel(1);
    setSpawnRate(1200);
    setKConstant(800);
    setFinished(false);
    setRunning(true);
  };

  const finish = () => {
    setFinished(true);
    setRunning(false);
  };

  // UI controls are below - Tailwind used for layout and styling
  return (
    <div className="w-full h-full min-h-[540px] flex flex-col gap-4">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-white">Coulomb Charge Collector</div>
          <div className="text-sm text-slate-300">Interactive game to visualise attraction & repulsion</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm">Score: {score}</div>
          <div className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm">Level: {level}</div>

          <button
            onClick={() => setPlayerCharge((c) => (c > 0 ? -1 : 1))}
            className="px-3 py-1 rounded-lg border border-white/10 text-white text-sm bg-gradient-to-r from-indigo-600 to-pink-600"
            title="Switch your charge polarity"
          >
            Polarity: {playerCharge > 0 ? "+" : "-"}
          </button>

          <button
            onClick={() => setShowHint((h) => !h)}
            className="px-3 py-1 rounded-lg bg-white/6 text-white text-sm"
          >
            Hint
          </button>

          <button onClick={togglePause} className="px-3 py-1 rounded-lg bg-white/6 text-white text-sm">
            {running ? "Pause" : "Resume"}
          </button>

          <button onClick={finish} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm">
            Finish
          </button>

          <button onClick={resetGame} className="px-3 py-1 rounded-lg bg-white/6 text-white text-sm">
            Restart
          </button>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl border border-white/6 mx-4">
        <canvas ref={canvasRef} className="w-full h-[520px] block" />

        {/* Hint / Tutorial Panel */}
        {showHint && (
          <div className="absolute left-6 top-6 max-w-xs bg-white/6 backdrop-blur-md p-4 rounded-xl text-white border border-white/8">
            <div className="font-semibold">How to play</div>
            <div className="text-sm mt-2">
              Drag the glowing charge around. Opposite charges attract — collect them to gain points. Same-sign charges repel; touching them costs points.
            </div>
            <div className="text-xs mt-2 opacity-80">Tip: change polarity and watch how the field changes. Higher levels spawn faster.</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setShowHint(false)} className="px-3 py-1 bg-white/8 rounded">Got it</button>
              <button onClick={() => {setShowHint(true);}} className="px-3 py-1 bg-white/8 rounded">Keep showing</button>
            </div>
          </div>
        )}

        {/* Finished overlay */}
        {finished && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/8 text-white w-[420px] text-center">
              <div className="text-3xl font-bold">Game Over</div>
              <div className="mt-3 text-xl">Final Score: {score}</div>
              <div className="mt-4 text-sm opacity-80">Level reached: {level}</div>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={resetGame} className="px-4 py-2 rounded bg-indigo-600">Play Again</button>
                <button onClick={() => {setFinished(false); setRunning(true);}} className="px-4 py-2 rounded bg-white/6">Keep Playing</button>
              </div>
            </div>
          </div>
        )}

        {/* Controls panel */}
        <div className="absolute right-6 top-6 w-56 bg-gradient-to-br from-white/3 to-white/6 p-3 rounded-xl border border-white/6 text-white">
          <div className="text-xs opacity-80">K constant (force scale)</div>
          <input
            type="range"
            min="200"
            max="2000"
            value={kConstant}
            onChange={(e) => setKConstant(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[12px] mt-1 opacity-80">
            <span>200</span>
            <span>{kConstant}</span>
            <span>2000</span>
          </div>

          <div className="mt-3 text-xs opacity-80">Spawn rate (ms)</div>
          <input
            type="range"
            min="350"
            max="2200"
            value={spawnRate}
            onChange={(e) => setSpawnRate(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[12px] mt-1 opacity-80">
            <span>350</span>
            <span>{spawnRate}</span>
            <span>2200</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pb-4">
        <div className="text-sm text-slate-400">Physics note: Coulomb's law in the game is scaled for clarity: F = k·q₁·q₂ / r² (visualized)</div>
        <div className="text-sm text-slate-400">Made with ♥ — drag, swap polarity, collect!</div>
      </div>
    </div>
  );
}

// Render the game
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(CoulombGame));
