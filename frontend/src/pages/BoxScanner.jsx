import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, ScanBarcode, CheckCircle2, XCircle, RefreshCcw,
  AlertTriangle, Loader2, Pill, PackageSearch, Sparkles, ListChecks,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { scanMedicineFromImage, matchMedicine } from '../lib/gemini';

// ─── Prescription list (shared source of truth) ───────────────────────────────
// In the real system, this would come from the uploaded prescription via Gemini OCR.
// For now it matches the MED_DB in AddSchedule.jsx.
const PRESCRIPTION_LIST = [
  'Aspirin 81mg',
  'Aspirin 325mg',
  'Metformin 500mg',
  'Atorvastatin 20mg',
  'Lisinopril 10mg',
  'Vitamin C 1000mg',
  'Vitamin D3 2000 IU',
  'Amoxicillin 500mg',
];

// ─── States ───────────────────────────────────────────────────────────────────
// idle → camera off
// live → camera on, waiting for scan
// scanning → frame captured, Gemini processing
// result_found → medicine found in prescription
// result_not_found → medicine NOT in prescription
// error → something went wrong

export default function BoxScanner() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [uiState,      setUiState]      = useState('idle');
  const [cameraError,  setCameraError]  = useState(null);
  const [scannedName,  setScannedName]  = useState('');
  const [matchedMed,   setMatchedMed]   = useState(null);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [frozenFrame,  setFrozenFrame]  = useState(null); // base64 preview of captured frame
  const [scanY,        setScanY]        = useState(0);

  // Scan line animation
  useEffect(() => {
    if (uiState !== 'live') return;
    let dir = 1, y = 0;
    const id = setInterval(() => {
      y += dir * 1.2;
      if (y > 100) dir = -1;
      if (y < 0) dir = 1;
      setScanY(y);
    }, 16);
    return () => clearInterval(id);
  }, [uiState]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setUiState('live');
    } catch {
      setCameraError('Camera permission denied or no camera found.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Capture frame → Gemini → match
  const scanPacket = useCallback(async () => {
    if (uiState !== 'live') return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Draw current frame onto canvas
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Get base64 (strip the data:image/jpeg;base64, prefix)
    const dataUrl  = canvas.toDataURL('image/jpeg', 0.85);
    const base64   = dataUrl.split(',')[1];
    setFrozenFrame(dataUrl);   // show the frozen preview
    setUiState('scanning');

    try {
      const name = await scanMedicineFromImage(base64);
      setScannedName(name);

      if (name === 'UNREADABLE') {
        setErrorMsg('Gemini could not read a medicine name from the image. Please hold the packet closer and ensure the label is clearly visible.');
        setUiState('error');
        return;
      }

      const { found, matchedMed: matched } = matchMedicine(name, PRESCRIPTION_LIST);
      setMatchedMed(matched);
      setUiState(found ? 'result_found' : 'result_not_found');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Check your API key and internet connection.');
      setUiState('error');
    }
  }, [uiState]);

  // Reset to camera view
  const reset = useCallback(() => {
    setScannedName('');
    setMatchedMed(null);
    setFrozenFrame(null);
    setErrorMsg('');
    setUiState('live');
  }, []);

  // Full reset (stop camera)
  const fullReset = useCallback(() => {
    stopCamera();
    setScannedName('');
    setMatchedMed(null);
    setFrozenFrame(null);
    setErrorMsg('');
    setUiState('idle');
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const isResult = uiState === 'result_found' || uiState === 'result_not_found';
  const isFound  = uiState === 'result_found';

  return (
    <div className="min-h-full space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold text-text flex items-center gap-2">
          <PackageSearch className="text-primary-500" size={26} />
          Medicine Box Scanner
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Point your camera at a medicine packet → Gemini Vision reads the label → Checks against prescription
        </p>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

        {/* ── Left: Camera + Result ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-3 space-y-4"
        >
          {/* Camera / Preview Box */}
          <div
            className={cn(
              'relative bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-xl',
              isFound            ? 'border-secondary-500 shadow-secondary-500/30' :
              uiState === 'result_not_found' ? 'border-red-500 shadow-red-500/30' :
              uiState === 'scanning'         ? 'border-primary-500 shadow-primary-500/30' :
              uiState === 'live'             ? 'border-slate-600' :
                                             'border-slate-700',
            )}
            style={{ aspectRatio: '16/10' }}
          >
            {/* Live video (always mounted, hidden when not in use) */}
            <video
              ref={videoRef}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                uiState === 'live' ? 'opacity-100' : 'opacity-0',
              )}
              muted playsInline
            />

            {/* Frozen frame shown during scanning / result */}
            {frozenFrame && uiState !== 'live' && (
              <img
                src={frozenFrame}
                alt="Captured frame"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Idle placeholder ── */}
            {uiState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="w-20 h-20 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center">
                  <Camera size={36} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-mono">Camera inactive</p>
                {cameraError && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertTriangle size={12} /> {cameraError}
                  </p>
                )}
              </div>
            )}

            {/* ── Live overlays ── */}
            {uiState === 'live' && (
              <>
                {/* Corner reticles */}
                {['top-3 left-3','top-3 right-3','bottom-3 left-3','bottom-3 right-3'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-7 h-7 border-primary-400 opacity-70`} style={{
                    borderTopWidth: i < 2 ? 2 : 0, borderBottomWidth: i >= 2 ? 2 : 0,
                    borderLeftWidth: i % 2 === 0 ? 2 : 0, borderRightWidth: i % 2 === 1 ? 2 : 0,
                  }} />
                ))}
                {/* Scanning line */}
                <div className="absolute left-0 right-0 h-[2px] pointer-events-none" style={{ top: `${scanY}%` }}>
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-60" />
                </div>
                {/* ROI box hint */}
                <div className="absolute border-2 border-dashed border-white/30 rounded-lg pointer-events-none"
                  style={{ top: '20%', left: '20%', width: '60%', height: '60%' }}>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-mono whitespace-nowrap">
                    Position label here
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-[10px] font-mono text-slate-300 bg-slate-900/70 px-2 py-1 rounded-full border border-slate-700">
                    ● LIVE
                  </span>
                </div>
              </>
            )}

            {/* ── Scanning overlay ── */}
            {uiState === 'scanning' && (
              <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={40} className="text-primary-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-white font-heading font-bold text-lg">Gemini is reading the label…</p>
                  <p className="text-slate-300 text-xs mt-1 font-mono">Sending image to AI Vision API</p>
                </div>
                {/* Animated dots */}
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 bg-primary-400 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Result overlay on frozen frame ── */}
            {isResult && (
              <div className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-3',
                'bg-gradient-to-b',
                isFound ? 'from-secondary-900/50 to-secondary-950/80' : 'from-red-900/50 to-red-950/80',
              )}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {isFound
                    ? <CheckCircle2 size={64} className="text-secondary-400" />
                    : <XCircle     size={64} className="text-red-400" />
                  }
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center px-4"
                >
                  <p className={cn('font-heading font-bold text-xl', isFound ? 'text-secondary-300' : 'text-red-300')}>
                    {isFound ? '✅ Medicine Available in Box' : '❌ Not in Prescription'}
                  </p>
                  <p className="text-white/80 text-sm mt-1 font-mono">
                    Detected: <span className="font-bold text-white">{scannedName}</span>
                  </p>
                  {isFound && matchedMed && (
                    <p className="text-secondary-300 text-xs mt-0.5 font-mono">
                      Matched: {matchedMed}
                    </p>
                  )}
                </motion.div>
              </div>
            )}

            {/* ── Error overlay ── */}
            {uiState === 'error' && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-3 p-6 backdrop-blur-sm">
                <AlertTriangle size={40} className="text-orange-400" />
                <p className="text-white font-bold text-center">Could Not Read Label</p>
                <p className="text-slate-300 text-xs text-center leading-relaxed">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 flex-wrap items-center">
            {uiState === 'idle' && (
              <button onClick={startCamera}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30">
                <Camera size={16} /> Start Camera
              </button>
            )}
            {uiState === 'live' && (
              <>
                <button onClick={scanPacket}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/30">
                  <ScanBarcode size={16} /> Scan Packet
                </button>
                <button onClick={fullReset}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-sm transition-all">
                  <RefreshCcw size={14} /> Stop Camera
                </button>
                <p className="text-xs text-text-muted font-mono">Hold the medicine label clearly in front of the camera, then click Scan.</p>
              </>
            )}
            {(isResult || uiState === 'error') && (
              <>
                <button onClick={reset}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <ScanBarcode size={16} /> Scan Another
                </button>
                <button onClick={fullReset}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-sm transition-all">
                  <RefreshCcw size={14} /> Stop Camera
                </button>
              </>
            )}
          </div>

          {/* ── Result Detail Card ── */}
          <AnimatePresence>
            {isResult && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className={cn(
                  'rounded-2xl border-2 p-6 shadow-lg',
                  isFound
                    ? 'bg-secondary-50 border-secondary-300'
                    : 'bg-red-50 border-red-200',
                )}
              >
                <div className="flex items-start gap-4">
                  {isFound
                    ? <CheckCircle2 size={36} className="text-secondary-500 shrink-0 mt-0.5" />
                    : <XCircle     size={36} className="text-red-500 shrink-0 mt-0.5" />
                  }
                  <div>
                    <h3 className={cn('font-heading font-bold text-lg', isFound ? 'text-secondary-700' : 'text-red-700')}>
                      {isFound ? 'Medicine is Available in the Box ✓' : 'Medicine Not in Prescription ✗'}
                    </h3>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Gemini Read:</span>
                        <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 text-sm font-mono">
                          {scannedName}
                        </span>
                      </div>
                      {isFound && matchedMed && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Matched With:</span>
                          <span className="font-bold text-secondary-700 bg-secondary-100 px-3 py-1 rounded-lg border border-secondary-200 text-sm font-mono">
                            {matchedMed}
                          </span>
                        </div>
                      )}
                      {!isFound && (
                        <p className="text-red-600 text-sm mt-2">
                          This medicine was not found in the patient's prescription list. Do not place it in the box.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Right: Prescription List ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 space-y-4"
        >
          {/* How it works */}
          <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700 shadow-xl">
            <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-primary-400" /> How It Works
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Start the camera and point it at a medicine packet, box, or strip.', color: 'bg-primary-600' },
                { step: '2', text: 'Click "Scan Packet" — the app captures the current frame.', color: 'bg-accent-600' },
                { step: '3', text: 'Gemini Vision AI reads the label and extracts the medicine name.', color: 'bg-secondary-600' },
                { step: '4', text: 'The app checks if that medicine is in the patient\'s prescription.', color: 'bg-orange-500' },
              ].map(({ step, text, color }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0', color)}>
                    {step}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prescription list */}
          <div className="bg-surface-dark rounded-2xl p-5 border border-slate-700 shadow-xl">
            <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
              <ListChecks size={14} className="text-secondary-400" /> Prescription List
              <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {PRESCRIPTION_LIST.length} medicines
              </span>
            </h3>
            <div className="space-y-2">
              {PRESCRIPTION_LIST.map((med) => {
                const isMatched = isResult && matchedMed === med;
                const isNotFound = uiState === 'result_not_found';
                return (
                  <motion.div
                    key={med}
                    animate={isMatched ? { scale: [1, 1.03, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300',
                      isMatched
                        ? 'bg-secondary-900/40 border-secondary-600'
                        : 'bg-slate-800/50 border-slate-700',
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                      isMatched ? 'bg-secondary-500' : 'bg-slate-700',
                    )}>
                      {isMatched
                        ? <CheckCircle2 size={14} className="text-white" />
                        : <Pill size={13} className="text-slate-400" />
                      }
                    </div>
                    <span className={cn(
                      'text-xs font-semibold font-mono',
                      isMatched ? 'text-secondary-300' : 'text-slate-300',
                    )}>
                      {med}
                    </span>
                    {isMatched && (
                      <span className="ml-auto text-[10px] bg-secondary-800 text-secondary-300 px-2 py-0.5 rounded-full font-bold">
                        MATCHED
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <h4 className="text-orange-400 text-xs font-bold mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Tips for Best Results
            </h4>
            <ul className="text-orange-200/80 text-xs space-y-1 leading-relaxed list-disc list-inside">
              <li>Hold the packet flat, label facing the camera</li>
              <li>Ensure good lighting — avoid shadows on the label</li>
              <li>Keep the packet within the dashed guide box</li>
              <li>Hold still for a second before clicking Scan</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
