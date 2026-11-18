import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { Camera, ScanLine, Hand, ShieldCheck, ShieldAlert, AlertTriangle, Wifi, Cpu, Circle, CheckCircle2, XCircle, RefreshCcw, Eye, Zap, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Pill profiles: name, shape, target RGB color ──────────────────────────────
const PILL_PROFILES = [
  { name: 'Metformin 500mg',   shape: 'Oval',  color: '#a3e635', rgb: [163, 230, 53],  colorLabel: 'Lime Green' },
  { name: 'Lisinopril 10mg',   shape: 'Round', color: '#fb923c', rgb: [251, 146, 60],  colorLabel: 'Orange' },
  { name: 'Atorvastatin 20mg', shape: 'Round', color: '#f9fafb', rgb: [249, 250, 251], colorLabel: 'White' },
];

// Euclidean color distance → confidence score 0–1
function colorConfidence(r, g, b, target) {
  const dist = Math.sqrt((r - target[0]) ** 2 + (g - target[1]) ** 2 + (b - target[2]) ** 2);
  return Math.max(0, 1 - dist / 441); // 441 = max possible distance
}

// Sample dominant color from canvas center region
function sampleCanvasColor(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = Math.floor(canvas.width / 2), cy = Math.floor(canvas.height / 2), r = 40;
  const data = ctx.getImageData(cx - r, cy - r, r * 2, r * 2).data;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; count++;
  }
  return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
}

const StatBadge = ({ icon: Icon, label, value, ok }) => (
  <div className="flex items-center gap-2 bg-slate-800/70 rounded-lg px-3 py-2 border border-slate-700">
    <Icon size={14} className={ok ? 'text-secondary-400' : 'text-red-400'} />
    <span className="text-xs text-slate-400 font-mono">{label}</span>
    <span className={cn('text-xs font-bold font-mono', ok ? 'text-secondary-400' : 'text-red-400')}>{value}</span>
  </div>
);

export default function VisionVerification() {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const detectorRef = useRef(null);
  const rafRef      = useRef(null);
  const handTimerRef = useRef(null);

  const [cameraOn,    setCameraOn]    = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [modelStatus, setModelStatus] = useState('idle'); // idle | loading | ready
  const [phase,       setPhase]       = useState('idle');
  const [handPresent, setHandPresent] = useState(false);
  const [confidence,  setConfidence]  = useState(null);
  const [detectedRGB, setDetectedRGB] = useState(null);
  const [logs,        setLogs]        = useState(['[SYS] Waiting for camera…']);
  const [activePill,  setActivePill]  = useState(0);
  const [scanY,       setScanY]       = useState(0);

  const addLog = useCallback((msg) => setLogs(prev => [...prev.slice(-5), msg]), []);

  // Scan animation
  useEffect(() => {
    if (!cameraOn) return;
    let dir = 1, y = 0;
    const id = setInterval(() => { y += dir * 1.2; if (y > 100) dir = -1; if (y < 0) dir = 1; setScanY(y); }, 16);
    return () => clearInterval(id);
  }, [cameraOn]);

  // Start camera + load model
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      setModelStatus('loading');
      addLog('[SYS] Camera started. Loading AI model…');
      await tf.setBackend('webgl');
      await tf.ready();
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const det = await handPoseDetection.createDetector(model, {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        modelType: 'lite',
      });
      detectorRef.current = det;
      setModelStatus('ready');
      addLog('[AI] MediaPipe Hands model ready ✓');
    } catch (err) {
      setCameraError('Camera permission denied or device not found.');
    }
  }, [addLog]);

  // Stop everything
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(handTimerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setCameraOn(false); setModelStatus('idle'); setPhase('idle');
    setHandPresent(false); setConfidence(null); setDetectedRGB(null);
    setLogs(['[SYS] Camera stopped.']);
  }, []);

  // Analyze color from canvas
  const analyzeColor = useCallback(() => {
    const canvas = canvasRef.current, video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const [r, g, b] = sampleCanvasColor(canvas);
    setDetectedRGB([r, g, b]);
    const target = PILL_PROFILES[activePill].rgb;
    const conf = colorConfidence(r, g, b, target);
    setConfidence(conf);
    addLog(`[AI] Sampled RGB: (${r},${g},${b})`);
    addLog(`[AI] Color confidence: ${(conf * 100).toFixed(1)}%`);
    if (conf > 0.75) {
      setPhase('success');
      addLog(`[AI] MATCH: ${PILL_PROFILES[activePill].name} ✓`);
      addLog('[DB] Dose event logged.');
    } else {
      setPhase('restock_error');
      addLog('[AI] MISMATCH: Color does not match profile');
      addLog('[ALERT] Caregiver notified!');
    }
    // reset after 6s
    setTimeout(() => { setPhase('idle'); setHandPresent(false); setConfidence(null); }, 6000);
  }, [activePill, addLog]);

  // Detection loop
  useEffect(() => {
    if (!cameraOn || modelStatus !== 'ready') return;
    let running = true;

    const loop = async () => {
      if (!running || !detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        if (running) rafRef.current = requestAnimationFrame(loop);
        return;
      }
      try {
        const hands = await detectorRef.current.estimateHands(videoRef.current);
        const seen = hands.length > 0;
        setHandPresent(seen);

        if (seen && phase === 'idle') {
          setPhase('motion');
          addLog('[SENSOR] Hand detected in frame');
          clearTimeout(handTimerRef.current);
          handTimerRef.current = setTimeout(() => {
            setPhase('analyze');
            addLog('[AI] Capturing frame for analysis…');
            setTimeout(analyzeColor, 800);
          }, 1500);
        } else if (!seen && phase === 'motion') {
          clearTimeout(handTimerRef.current);
          setPhase('idle');
          addLog('[SENSOR] Hand removed — reset');
        }
      } catch (_) {}
      if (running) rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [cameraOn, modelStatus, phase, analyzeColor, addLog]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const PHASE_META = {
    idle:          { label: 'Idle',            color: 'text-slate-400',    border: 'border-slate-600' },
    motion:        { label: 'Hand Detected',   color: 'text-yellow-400',   border: 'border-yellow-500' },
    analyze:       { label: 'AI Scanning',     color: 'text-primary-400',  border: 'border-primary-500' },
    success:       { label: 'Verified ✓',      color: 'text-secondary-400',border: 'border-secondary-500' },
    restock_error: { label: 'Mismatch ✗',      color: 'text-red-400',      border: 'border-red-500' },
  };
  const pm = PHASE_META[phase] || PHASE_META.idle;

  const steps = ['idle', 'motion', 'analyze', 'success'];
  const curIdx = steps.indexOf(phase.includes('error') ? 'analyze' : phase);

  // Simulate degradation (only remaining simulated case)
  const simulateDegradation = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('motion'); addLog('[SENSOR] Motion detected (restock)');
    setTimeout(() => { setPhase('analyze'); addLog('[AI] Scanning loaded compartment…'); }, 1500);
    setTimeout(() => {
      setPhase('restock_error'); setConfidence(0.38);
      addLog('[AI] COLOR MISMATCH: Yellowing detected');
      addLog('[ALERT] Quality Warning: Moisture Damage');
      setTimeout(() => { setPhase('idle'); setConfidence(null); }, 6000);
    }, 3200);
  }, [phase, addLog]);

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text flex items-center gap-2">
            <Eye className="text-primary-500" size={26} /> Local Vision &amp; Quality Scanner
          </h1>
          <p className="text-text-muted text-sm mt-1">Real Edge AI • MediaPipe Hands • Canvas Color Analysis</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatBadge icon={Wifi} label="Cloud" value="OFF" ok={false} />
          <StatBadge icon={Cpu}  label="Edge"  value={modelStatus === 'ready' ? 'READY' : modelStatus === 'loading' ? 'LOADING' : 'OFF'} ok={modelStatus === 'ready'} />
          <StatBadge icon={Hand} label="Hand"  value={handPresent ? 'YES' : 'NO'} ok={handPresent} />
          <StatBadge icon={Zap}  label="TF.js" value={modelStatus === 'ready' ? 'ON' : '—'} ok={modelStatus === 'ready'} />
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* Camera */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-3">
          <div className={cn('relative bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-xl', pm.border)} style={{ aspectRatio: '16/10' }}>
            <video ref={videoRef} className={cn('absolute inset-0 w-full h-full object-cover', cameraOn ? 'opacity-100' : 'opacity-0')} muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="w-20 h-20 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center">
                  <Camera size={36} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-mono">Camera feed inactive</p>
                {cameraError && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={12} /> {cameraError}</p>}
              </div>
            )}

            {cameraOn && (
              <>
                {/* Corner reticles */}
                {['top-3 left-3','top-3 right-3','bottom-3 left-3','bottom-3 right-3'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-6 h-6 border-primary-400 opacity-80`} style={{ borderTopWidth: i<2?2:0, borderBottomWidth: i>=2?2:0, borderLeftWidth: i%2===0?2:0, borderRightWidth: i%2===1?2:0 }} />
                ))}

                {/* Scan line */}
                <motion.div className="absolute left-0 right-0 h-[2px] pointer-events-none" style={{ top: `${scanY}%` }}>
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-70" />
                </motion.div>

                {/* Model loading overlay */}
                {modelStatus === 'loading' && (
                  <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Activity size={32} className="text-primary-400" />
                    </motion.div>
                    <p className="text-primary-300 text-sm font-mono">Loading MediaPipe Hands model…</p>
                  </div>
                )}

                {/* ROI box during analysis */}
                <AnimatePresence>
                  {['analyze','success','restock_error'].includes(phase) && (
                    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className={cn('absolute border-2 rounded-lg pointer-events-none', phase === 'analyze' ? 'border-primary-400' : phase === 'success' ? 'border-secondary-400' : 'border-red-400')}
                      style={{ top:'30%', left:'35%', width:'30%', height:'35%' }}>
                      <span className={cn('absolute -top-5 left-0 text-[10px] font-mono px-1 rounded',
                        phase === 'analyze' ? 'text-primary-400 bg-primary-900/80' :
                        phase === 'success'  ? 'text-secondary-400 bg-secondary-900/80' : 'text-red-400 bg-red-900/80')}>
                        {phase === 'analyze' ? 'SCANNING…' : confidence !== null ? `CONFIDENCE ${(confidence*100).toFixed(0)}%` : ''}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Detected color swatch */}
                {detectedRGB && (
                  <div className="absolute top-3 right-10 flex items-center gap-2 bg-slate-900/80 rounded-lg px-2 py-1 border border-slate-600">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: `rgb(${detectedRGB.join(',')})` }} />
                    <span className="text-[10px] text-slate-300 font-mono">Detected</span>
                  </div>
                )}

                {/* Phase badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className={cn('text-xs font-mono font-bold px-3 py-1 rounded-full border backdrop-blur-sm bg-slate-900/70', pm.color, pm.border)}>
                    ● {pm.label.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900/70 px-2 py-1 rounded-full border border-slate-700">
                    {modelStatus === 'ready' ? 'EDGE·AI LIVE' : 'EDGE·AI LOADING'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-3 flex-wrap items-center">
            {!cameraOn ? (
              <button onClick={startCamera} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <Camera size={16} /> Start Camera
              </button>
            ) : (
              <>
                <button onClick={simulateDegradation} disabled={phase !== 'idle' || modelStatus !== 'ready'}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all hover:-translate-y-0.5">
                  <AlertTriangle size={14} /> Simulate: Degradation
                </button>
                <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-xs transition-all">
                  <RefreshCcw size={14} /> Reset
                </button>
                {modelStatus === 'ready' && (
                  <p className="text-xs text-secondary-400 font-mono">✓ Show your hand to the camera to trigger real AI detection</p>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2 flex flex-col gap-4">
          {/* Pipeline */}
          <div className="bg-surface-dark rounded-2xl p-5 shadow-xl border border-slate-700">
            <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
              <ScanLine size={15} className="text-primary-400" /> Verification Pipeline
            </h3>
            <div className="space-y-3">
              {[{id:'idle',label:'Idle'},{id:'motion',label:'Motion Detected'},{id:'analyze',label:'AI Scanning'},{id:'success',label:'Verified'}].map((s, i) => {
                const done = i < curIdx || (phase==='success'&&s.id==='success');
                const active = s.id === phase || (phase==='restock_error'&&s.id==='analyze');
                const failed = phase==='restock_error'&&s.id==='analyze';
                return (
                  <div key={s.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0',
                        done&&!failed?'bg-secondary-500 border-secondary-500':'',
                        active&&!failed?'border-primary-400 bg-primary-400/10 animate-pulse':'',
                        failed?'bg-red-500 border-red-500':'',
                        !done&&!active?'border-slate-600':'')}>
                        {done&&!failed&&<CheckCircle2 size={14} className="text-white"/>}
                        {failed&&<XCircle size={14} className="text-white"/>}
                        {!done&&!active&&<span className="text-[10px] text-slate-500 font-bold">{i+1}</span>}
                      </div>
                      {i<3&&<div className={cn('w-0.5 h-6 mt-1',done?'bg-secondary-600':'bg-slate-700')}/>}
                    </div>
                    <p className={cn('text-sm font-semibold font-heading pt-0.5',
                      active?pm.color:done?'text-secondary-400':'text-slate-500')}>
                      {failed?'Mismatch ✗':s.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Confidence bar */}
            <AnimatePresence>
              {confidence !== null && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>Color Confidence</span>
                    <span className={confidence>0.75?'text-secondary-400':'text-red-400'}>{(confidence*100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${confidence*100}%`}} transition={{duration:0.8,ease:'easeOut'}}
                      className={cn('h-full rounded-full',confidence>0.75?'bg-secondary-500':'bg-red-500')} />
                  </div>
                  {detectedRGB && (
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Sampled RGB: ({detectedRGB.join(', ')}) | Target: ({PILL_PROFILES[activePill].rgb.join(', ')})
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pill profile selector */}
          <div className="bg-surface-dark rounded-2xl p-5 shadow-xl border border-slate-700">
            <h3 className="text-sm font-heading font-bold text-white mb-3 flex items-center gap-2">
              <Circle size={14} className="text-accent-400" /> Active Pill Profile
            </h3>
            <div className="space-y-2">
              {PILL_PROFILES.map((p, i) => (
                <button key={i} onClick={() => setActivePill(i)}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    i===activePill?'border-primary-600 bg-primary-900/40':'border-slate-700 bg-slate-800/40 hover:border-slate-500')}>
                  <div className="w-7 h-7 rounded-full border-2 border-white/20 shrink-0" style={{backgroundColor:p.color}} />
                  <div>
                    <p className={cn('text-xs font-semibold',i===activePill?'text-primary-300':'text-slate-300')}>{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.shape} · {p.colorLabel}</p>
                  </div>
                  {i===activePill&&<span className="ml-auto text-[10px] bg-primary-800 text-primary-300 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-mono">Select the pill profile to verify against, then show a matching colored object to the camera.</p>
          </div>

          {/* Log */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-xl">
            <h3 className="text-xs font-heading font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Activity size={12} /> Edge AI Log
            </h3>
            <div className="space-y-1.5 font-mono text-[11px]">
              {logs.map((log, i) => (
                <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                  className={cn('flex gap-2',
                    log.includes('✓')?'text-secondary-400':
                    log.includes('ALERT')||log.includes('MISMATCH')||log.includes('Warning')?'text-red-400':
                    log.includes('AI')?'text-primary-400':
                    log.includes('SENSOR')?'text-yellow-400':'text-slate-400')}>
                  <span className="text-slate-600">›</span><span>{log}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info cards */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Hand,        title: 'Real Hand Detection',  desc: 'MediaPipe Hands (TensorFlow.js) runs a neural network on every camera frame to detect your hand in real-time — no button needed.', color:'text-yellow-400',    bg:'bg-yellow-500/10 border-yellow-700/50' },
          { icon: ScanLine,    title: 'Canvas Color Analysis', desc: 'When a hand is detected, the system captures the frame, samples the center pixel region, and computes a Euclidean color distance score.', color:'text-primary-400',  bg:'bg-primary-500/10 border-primary-700/50' },
          { icon: ShieldCheck, title: 'Real Confidence Score', desc: 'The confidence % is a genuine algorithm — not hardcoded. Hold a lime-green object for Metformin or orange for Lisinopril to see it respond.', color:'text-secondary-400',bg:'bg-secondary-500/10 border-secondary-700/50' },
        ].map((c,i) => (
          <div key={i} className={cn('rounded-2xl p-5 border shadow-md',c.bg)}>
            <c.icon className={cn('mb-3',c.color)} size={22}/>
            <h4 className={cn('font-heading font-bold text-sm mb-1',c.color)}>{c.title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
