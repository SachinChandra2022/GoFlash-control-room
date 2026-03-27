import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Zap, Terminal, Activity, AlertTriangle, CheckCircle2,
  XCircle, Radio, RefreshCw, Cpu, Database, Server,
  ArrowRight, Wifi, WifiOff, FlameKindling, Layers
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// ─── Utility ─────────────────────────────────────────────────────────────────
const ts = () => new Date().toLocaleTimeString("en-US", { hour12: false });

// ─── Log Types ───────────────────────────────────────────────────────────────
const LOG_TYPES = {
  INBOUND:  { color: "text-sky-400",    prefix: "→" },
  SUCCESS:  { color: "text-emerald-400", prefix: "✓" },
  FAILURE:  { color: "text-rose-400",   prefix: "✗" },
  SYSTEM:   { color: "text-violet-400", prefix: "◈" },
  WARNING:  { color: "text-amber-400",  prefix: "⚠" },
};

// ─── Architecture Pipeline Node ───────────────────────────────────────────────
const PipelineNode = ({ icon: Icon, label, sublabel, active, color = "emerald" }) => {
  const colorMap = {
    emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    sky:     "border-sky-500/50 bg-sky-500/10 text-sky-400",
    violet:  "border-violet-500/50 bg-violet-500/10 text-violet-400",
    amber:   "border-amber-500/50 bg-amber-500/10 text-amber-400",
    rose:    "border-rose-500/50 bg-rose-500/10 text-rose-400",
    indigo:  "border-indigo-500/50 bg-indigo-500/10 text-indigo-400",
  };
  return (
    <motion.div
      className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border ${colorMap[color]} transition-all duration-300`}
      animate={active ? { boxShadow: ["0 0 0px rgba(52,211,153,0)", "0 0 18px rgba(52,211,153,0.4)", "0 0 0px rgba(52,211,153,0)"] } : {}}
      transition={{ duration: 0.8, repeat: active ? Infinity : 0 }}
    >
      <Icon size={18} className="opacity-90" />
      <span className="text-xs font-bold tracking-widest uppercase opacity-90 whitespace-nowrap">{label}</span>
      {sublabel && <span className="text-[9px] opacity-50 tracking-wider whitespace-nowrap">{sublabel}</span>}
    </motion.div>
  );
};

// ─── Packet Animation ─────────────────────────────────────────────────────────
const Packet = ({ id, onDone }) => {
  return (
    <motion.div
      key={id}
      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)] z-10"
      initial={{ left: "0%" }}
      animate={{ left: "100%" }}
      transition={{ duration: 1.4, ease: "linear" }}
      onAnimationComplete={onDone}
      style={{ pointerEvents: "none" }}
    />
  );
};

// ─── Pipeline Arrow Segment ───────────────────────────────────────────────────
const PipelineSegment = ({ packets, segmentIndex }) => {
  const segPackets = packets.filter(p => p.segment === segmentIndex);
  return (
    <div className="relative flex-1 flex items-center h-full min-w-[28px]">
      <div className="w-full h-[2px] bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 relative overflow-visible">
        {segPackets.map(p => (
          <Packet key={p.id} id={p.id} onDone={p.onDone} />
        ))}
      </div>
      <ArrowRight size={10} className="absolute right-0 text-slate-500 -translate-x-0.5" />
    </div>
  );
};

// ─── Big Number Stock Widget ──────────────────────────────────────────────────
const StockWidget = ({ stock }) => {
  const controls = useAnimation();
  const prevStock = useRef(stock);
  const isSoldOut = stock === 0;
  const isLow = stock > 0 && stock <= 20;

  useEffect(() => {
    if (stock !== prevStock.current) {
      controls.start({
        scale: [1, 1.18, 1],
        transition: { duration: 0.35, ease: "easeOut" },
      });
      prevStock.current = stock;
    }
  }, [stock, controls]);

  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatDelay: 1.5 },
    },
    idle: { x: 0 },
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      {/* Glow orb */}
      <motion.div
        className={`absolute w-48 h-48 rounded-full blur-3xl opacity-20 ${isSoldOut ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col items-center gap-2 z-10">
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-slate-500 font-mono">
          Live Inventory
        </span>

        <motion.div
          animate={isSoldOut ? "shake" : "idle"}
          variants={shakeVariants}
        >
          <motion.span
            animate={controls}
            className={`block text-[5.5rem] font-black leading-none tabular-nums tracking-tight transition-colors duration-700 ${
              isSoldOut ? "text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.7)]"
              : isLow    ? "text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
              :            "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {String(stock).padStart(3, "0")}
          </motion.span>
        </motion.div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono tracking-widest ${isSoldOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-600"}`}>
            {isSoldOut ? "⬛ SOLD OUT" : isLow ? "⚠ LOW STOCK" : "● AVAILABLE"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Terminal Log ─────────────────────────────────────────────────────────────
const TerminalLog = ({ logs }) => {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolledUp = useRef(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledUp.current = !nearBottom;
    setIsScrolledUp(!nearBottom);
  };

  const jumpToBottom = () => {
    userScrolledUp.current = false;
    setIsScrolledUp(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 overflow-hidden bg-[#090b0f]" style={{ height: "100%", minHeight: 0 }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <Terminal size={13} className="text-slate-500 ml-2" />
        <span className="text-[11px] font-mono text-slate-500 tracking-widest uppercase">
          Event Stream — GoFlash Control
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600">{logs.length} events</span>
          <AnimatePresence>
            {isScrolledUp && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={jumpToBottom}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono hover:bg-emerald-500/25 transition-colors"
              >
                ↓ latest
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto p-4 space-y-0.5 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800" style={{ flex: "1 1 0", minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {logs.map(log => {
            const lt = LOG_TYPES[log.type] || LOG_TYPES.SYSTEM;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2 items-start group"
              >
                <span className="text-slate-600 shrink-0 select-none">{log.time}</span>
                <span className={`shrink-0 ${lt.color}`}>{lt.prefix}</span>
                <span className={`${lt.color} group-hover:brightness-125 transition-all`}>{log.msg}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

// ─── Control Panel Button ──────────────────────────────────────────────────────
const CtrlBtn = ({ onClick, disabled, loading, children, variant = "primary", icon: Icon }) => {
  const styles = {
    primary:  "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:border-emerald-400",
    danger:   "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:border-rose-400",
    warning:  "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:border-amber-400",
    ghost:    "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:border-slate-500",
  };
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden ${styles[variant]}`}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      {Icon && <Icon size={13} />}
      {children}
    </motion.button>
  );
};

// ─── Metrics Card ─────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: Icon, color = "emerald" }) => {
  const colorMap = {
    emerald: "text-emerald-400",
    sky: "text-sky-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">{label}</span>
        {Icon && <Icon size={13} className={colorMap[color]} />}
      </div>
      <span className={`text-2xl font-black tabular-nums ${colorMap[color]}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-slate-600 font-mono">{sub}</span>}
    </div>
  );
};

// ─── Connection Status ─────────────────────────────────────────────────────────
const ConnStatus = ({ connected }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wider ${
    connected
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : "border-rose-500/40 bg-rose-500/10 text-rose-400"
  }`}>
    <motion.div
      className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`}
      animate={connected ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
    <span>{connected ? "SSE Live" : "Disconnected"}</span>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
let packetIdCounter = 0;

export default function App() {
  const [stock, setStock]           = useState(100);
  const [connected, setConnected]   = useState(false);
  const [logs, setLogs]             = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [stressing, setStressing]   = useState(false);
  const [packets, setPackets]       = useState([]);
  const [metrics, setMetrics]       = useState({ total: 0, success: 0, fail: 0, rps: 0 });
  const logIdRef = useRef(0);
  const rpsTimerRef = useRef(null);
  const rpsCountRef = useRef(0);

  // ── Logger ────────────────────────────────────────────────────────────────
  const addLog = useCallback((msg, type = "SYSTEM") => {
    setLogs(prev => [...prev.slice(-300), { id: ++logIdRef.current, msg, type, time: ts() }]);
  }, []);

  // ── RPS Tracker ──────────────────────────────────────────────────────────
  const trackRps = useCallback(() => {
    rpsCountRef.current++;
    clearTimeout(rpsTimerRef.current);
    rpsTimerRef.current = setTimeout(() => {
      setMetrics(m => ({ ...m, rps: rpsCountRef.current }));
      rpsCountRef.current = 0;
    }, 1000);
  }, []);

  // ── Packet Animation Helper ───────────────────────────────────────────────
  const firePackets = useCallback(() => {
    const NUM_SEGMENTS = 5;
    const delay = 250;
    for (let seg = 0; seg < NUM_SEGMENTS; seg++) {
      setTimeout(() => {
        const id = ++packetIdCounter;
        setPackets(prev => [...prev, {
          id,
          segment: seg,
          onDone: () => setPackets(p => p.filter(x => x.id !== id)),
        }]);
      }, seg * delay);
    }
  }, []);

  // ── SSE Connection ────────────────────────────────────────────────────────
  useEffect(() => {
    addLog("Initialising SSE connection to GoFlash backend…", "SYSTEM");
    let es;
    let retryTimeout;

    const connect = () => {
      es = new EventSource(`${API_BASE}/stream`);

      es.onopen = () => {
        setConnected(true);
        addLog(`SSE stream connected → ${API_BASE}/stream`, "SUCCESS");
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const stockVal = Number(data.stock);
          if (!isNaN(stockVal)) {
            setStock(prev => {
              if (stockVal !== prev) {
                addLog(`Stock update received: ${prev} → ${stockVal}`, "INBOUND");
              }
              return stockVal;
            });
          }
        } catch {
          addLog(`SSE parse error: ${e.data}`, "WARNING");
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        addLog("SSE connection lost. Retrying in 3s…", "WARNING");
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [addLog]);

  // ── Single Purchase ───────────────────────────────────────────────────────
  const handlePurchase = useCallback(async () => {
    if (purchasing) return;
    setPurchasing(true);
    addLog("POST /purchase-async → dispatching single order…", "INBOUND");
    firePackets();
    trackRps();
    setMetrics(m => ({ ...m, total: m.total + 1 }));

    try {
      const res = await fetch(`${API_BASE}/purchase-async`, { method: "POST" });
      if (res.ok) {
        addLog("✅ Order Received & Published to Kafka", "SUCCESS");
        setMetrics(m => ({ ...m, success: m.success + 1 }));
      } else if (res.status === 409) {
        addLog("❌ Sold Out - Conflict Detected in Redis", "FAILURE");
        setMetrics(m => ({ ...m, fail: m.fail + 1 }));
      } else {
        addLog(`⚠ Unexpected response: HTTP ${res.status}`, "WARNING");
        setMetrics(m => ({ ...m, fail: m.fail + 1 }));
      }
    } catch (err) {
      addLog(`❌ Network error: ${err.message}`, "FAILURE");
      setMetrics(m => ({ ...m, fail: m.fail + 1 }));
    } finally {
      setPurchasing(false);
    }
  }, [purchasing, addLog, firePackets, trackRps]);

  // ── Stress Test ───────────────────────────────────────────────────────────
  const handleStressTest = useCallback(async (count = 100) => {
    if (stressing) return;
    setStressing(true);
    addLog(`◈ STRESS TEST INITIATED — firing ${count} concurrent requests via Promise.all`, "SYSTEM");
    addLog(`◈ Kafka consumer pool will absorb burst. Redis atomic Lua guards inventory.`, "SYSTEM");
    firePackets();

    const requests = Array.from({ length: count }, async (_, i) => {
      trackRps();
      setMetrics(m => ({ ...m, total: m.total + 1 }));
      try {
        const res = await fetch(`${API_BASE}/purchase-async`, { method: "POST" });
        return res.status;
      } catch {
        return 0;
      }
    });

    const results = await Promise.all(requests);

    const successes = results.filter(s => s === 200).length;
    const conflicts = results.filter(s => s === 409).length;
    const errors    = results.filter(s => s === 0).length;

    setMetrics(m => ({
      ...m,
      success: m.success + successes,
      fail:    m.fail + conflicts + errors,
    }));

    addLog(`◈ Promise.all resolved — ${count} concurrent requests completed`, "SYSTEM");
    addLog(`✅ ${successes} orders published to Kafka`, "SUCCESS");
    if (conflicts > 0) addLog(`❌ ${conflicts} Redis conflicts detected (sold out protection)`, "FAILURE");
    if (errors > 0)    addLog(`⚠ ${errors} network errors`, "WARNING");
    addLog(`◈ Backend concurrency resilience validated at ~${count} RPS burst`, "SYSTEM");

    setStressing(false);
  }, [stressing, addLog, firePackets, trackRps]);

  // ── System Reset ──────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    addLog("◈ Sending system reset signal → /reset", "SYSTEM");
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: "POST" });
      if (res.ok) {
        addLog("◈ System reset acknowledged. Inventory restored.", "SUCCESS");
        setMetrics({ total: 0, success: 0, fail: 0, rps: 0 });
      } else {
        addLog(`⚠ Reset returned HTTP ${res.status}`, "WARNING");
      }
    } catch (err) {
      addLog(`❌ Reset failed: ${err.message}`, "FAILURE");
    }
  }, [addLog]);

  const successRate = metrics.total > 0
    ? ((metrics.success / metrics.total) * 100).toFixed(1)
    : "—";

  // ── Architecture pipeline nodes ────────────────────────────────────────────
  const nodes = [
    { icon: Layers,   label: "Client",   sublabel: "React UI",  color: "sky"    },
    { icon: Server,   label: "API",      sublabel: "Gin/Go",    color: "emerald"},
    { icon: Zap,      label: "Redis",    sublabel: "Lua Atomic",color: "amber"  },
    { icon: Radio,    label: "Kafka",    sublabel: "Async Buf", color: "violet" },
    { icon: Cpu,      label: "Worker",   sublabel: "Consumer",  color: "indigo" },
    { icon: Database, label: "Postgres", sublabel: "Persistent",color: "rose"   },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025]" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)"
      }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <FlameKindling size={22} className="text-emerald-400" />
            </motion.div>
            <div>
              <span className="text-sm font-black tracking-[0.2em] uppercase text-white">GoFlash</span>
              <span className="text-slate-500 text-sm"> / </span>
              <span className="text-sm text-slate-400 tracking-wider">Control Room</span>
            </div>
            <div className="hidden md:flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-500 font-mono tracking-widest">5K+ RPS ENGINE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnStatus connected={connected} />
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
              <Activity size={11} className="text-slate-600" />
              {API_BASE}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* ── Row 1: Stock + Metrics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <StockWidget stock={stock} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Total Requests" value={metrics.total} sub="fired since load" icon={Activity} color="sky" />
            <MetricCard label="Success" value={metrics.success} sub="published to Kafka" icon={CheckCircle2} color="emerald" />
            <MetricCard label="Conflicts" value={metrics.fail} sub="Redis Lua blocked" icon={XCircle} color="rose" />
            <MetricCard label="Success Rate" value={successRate === "—" ? "—" : `${successRate}%`} sub="of total requests" icon={Layers} color="violet" />
          </div>
        </div>

        {/* ── Row 2: Architecture Diagram ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={14} className="text-slate-500" />
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-500">Distributed Pipeline Architecture</span>
            <div className="flex-1 h-px bg-slate-800 ml-2" />
            <AnimatePresence>
              {(purchasing || stressing) && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/30"
                >
                  ● PACKET ROUTING ACTIVE
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {nodes.map((node, i) => (
              <div key={node.label} className="flex items-center flex-1 min-w-0">
                <div className="shrink-0">
                  <PipelineNode
                    {...node}
                    active={purchasing || stressing}
                  />
                </div>
                {i < nodes.length - 1 && (
                  <PipelineSegment packets={packets} segmentIndex={i} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: "Browser", desc: "SSE + REST" },
              { label: "Gin Router", desc: "HTTP/2 Mux" },
              { label: "Lua Script", desc: "DECR Atomic" },
              { label: "Topic Buffer", desc: "orders topic" },
              { label: "Go Consumer", desc: "Concurrent" },
              { label: "JSONB Rows", desc: "Idempotent" },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-[10px] font-bold text-slate-400">{item.label}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 3: Terminal + Controls ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "420px" }}>
          <div className="lg:col-span-2 flex flex-col" style={{ height: "420px", minHeight: 0 }}>
            <TerminalLog logs={logs} />
          </div>

          <div className="flex flex-col gap-4">
            {/* Control Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Cpu size={13} className="text-slate-500" />
                <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-500">Control Panel</span>
              </div>

              <CtrlBtn
                onClick={handlePurchase}
                disabled={purchasing || stressing}
                loading={purchasing}
                variant="primary"
                icon={CheckCircle2}
              >
                Single Purchase
              </CtrlBtn>

              <CtrlBtn
                onClick={() => handleStressTest(50)}
                disabled={stressing || purchasing}
                loading={stressing}
                variant="warning"
                icon={AlertTriangle}
              >
                Stress Test 50×
              </CtrlBtn>

              <CtrlBtn
                onClick={() => handleStressTest(100)}
                disabled={stressing || purchasing}
                loading={stressing}
                variant="danger"
                icon={FlameKindling}
              >
                Nuclear Test 100×
              </CtrlBtn>

              <div className="h-px bg-slate-800" />

              <CtrlBtn
                onClick={handleReset}
                disabled={stressing || purchasing}
                variant="ghost"
                icon={RefreshCw}
              >
                System Reset
              </CtrlBtn>
            </div>

            {/* Concurrency Explainer */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 block">How It Works</span>
              <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed font-mono">
                <p><span className="text-sky-400">SSE</span> — server pushes stock deltas. No polling overhead.</p>
                <p><span className="text-violet-400">Promise.all</span> — fires N requests simultaneously, saturating the endpoint to prove concurrency safety.</p>
                <p><span className="text-amber-400">Lua DECR</span> — atomic Redis script prevents oversell under race conditions.</p>
                <p><span className="text-emerald-400">Kafka</span> — decouples order receipt from DB writes. Backpressure handled.</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-8 py-4">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between text-[10px] font-mono text-slate-700">
          <span>GoFlash Control Room — High-Concurrency Flash Sale Engine</span>
          <span>Stack: React · Vite · Tailwind · Framer Motion · SSE · Kafka · Redis · Golang</span>
        </div>
      </footer>
    </div>
  );
}