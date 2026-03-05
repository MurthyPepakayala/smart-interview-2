import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AIAvatarProps {
  isSpeaking: boolean;
  facePos: { x: number; y: number } | null;
}

const AIAvatar = ({ isSpeaking, facePos }: AIAvatarProps) => {
  const [blink, setBlink] = useState(false);

  // Periodic blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Calculate pupillary movement based on gaze
  const pupilX = facePos ? (0.5 - facePos.x) * 15 : 0;
  const pupilY = facePos ? (facePos.y - 0.5) * 12 : 0;

  // PHONEME SIMULATION: Various mouth paths for realistic speech
  const mouthPaths = [
    "M85,145 Q100,155 115,145", // A/O shape
    "M80,140 Q100,165 120,140 Q100,145 80,140", // Open mouth
    "M85,142 Q100,148 115,142", // Narrow E shape
    "M90,145 Q100,140 110,145", // M/P shape (closed)
    "M80,150 Q100,155 120,150", // Flat U shape
  ];

  return (
    <div className="relative rounded-xl overflow-hidden border border-sky-500/20 bg-slate-950 aspect-[4/2.8] group shadow-2xl">
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isSpeaking ? 'opacity-40' : 'opacity-20'} bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.3),transparent_70%)]`} />
      
      {/* Subtle Grid Interaction */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      {/* Main Breathing/Movement Scale */}
      <motion.div
        animate={{
          scale: [1, 1.005, 1],
          filter: isSpeaking ? ["blur(0px)", "blur(0.2px)", "blur(0px)"] : "blur(0px)"
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-full h-full flex items-center justify-center pt-4"
      >
        {/* Pro Vector Agent SVG */}
        <motion.div
          animate={{
            rotate: isSpeaking ? [0, -0.8, 0.8, 0] : [0, 0.3, -0.3, 0],
            y: [0, -2, 0]
          }}
          transition={{ duration: isSpeaking ? 1.5 : 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full relative"
        >
          <svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-[0_0_30px_rgba(14,165,233,0.2)]">
            <defs>
              <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* SHOULDERS & SUIT */}
            <g opacity="0.9">
              <path d="M20,200 Q20,140 100,140 Q180,140 180,200 L180,220 L20,220 Z" fill="url(#suitGrad)" stroke="#38bdf8" strokeWidth="0.5" />
              {/* Collar/Shirt */}
              <path d="M70,140 L100,170 L130,140" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
              <path d="M100,170 L90,220 L110,220 Z" fill="#38bdf8" opacity="0.4" /> {/* Tie area */}
            </g>

            {/* EARS */}
            <ellipse cx="45" cy="85" rx="8" ry="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <ellipse cx="155" cy="85" rx="8" ry="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />

            {/* HEAD SHAPE */}
            <path 
              d="M50,70 Q50,25 100,25 Q150,25 150,70 L150,130 Q150,170 100,170 Q50,170 50,130 Z" 
              fill="url(#skinGrad)" 
              stroke="#38bdf8" 
              strokeWidth="2" 
            />

            {/* EYEBROWS (Responsive) */}
            <motion.path 
              animate={{ d: isSpeaking ? "M70,60 Q80,55 90,62" : "M70,62 Q80,62 90,62" }}
              stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.6"
            />
            <motion.path 
              animate={{ d: isSpeaking ? "M110,62 Q120,55 130,60" : "M110,62 Q120,62 130,62" }}
              stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.6"
            />

            {/* EYES WORK */}
            <g>
              {/* Left Eye */}
              <rect x="70" y="75" width="22" height="12" rx="3" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
              {/* Right Eye */}
              <rect x="108" y="75" width="22" height="12" rx="3" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
              
              {/* Pupils with Gaze Tracking */}
              <motion.g animate={{ x: pupilX, y: pupilY }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
                <circle cx="81" cy="81" r="3" fill="#38bdf8">
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="119" cy="81" r="3" fill="#38bdf8">
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              </motion.g>

              {/* Blinking */}
              <motion.rect animate={{ height: blink ? 12 : 0 }} x="69" y="75" width="24" rx="1" fill="#1e293b" />
              <motion.rect animate={{ height: blink ? 12 : 0 }} x="107" y="75" width="24" rx="1" fill="#1e293b" />
            </g>

            {/* MOUTH (Advanced Phoneme Morphing) */}
            <motion.path
              animate={{
                d: isSpeaking 
                  ? mouthPaths 
                  : "M85,145 Q100,145 115,145",
                opacity: isSpeaking ? [0.8, 1, 0.9, 1] : 0.6
              }}
              transition={{
                duration: 0.2,
                repeat: isSpeaking ? Infinity : 0,
                repeatType: "reverse",
                ease: "linear"
              }}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]"
            />

            {/* CHEEK HIGHLIGHTS (React to speaking) */}
            <motion.circle 
              animate={{ opacity: isSpeaking ? 0.3 : 0.1, r: isSpeaking ? 6 : 4 }}
              cx="65" cy="110" fill="#38bdf8" filter="blur(4px)" 
            />
            <motion.circle 
              animate={{ opacity: isSpeaking ? 0.3 : 0.1, r: isSpeaking ? 6 : 4 }}
              cx="135" cy="110" fill="#38bdf8" filter="blur(4px)" 
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* TECH STATUS BAR */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/80 border border-sky-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ scale: isSpeaking ? [1, 1.2, 1] : 1, opacity: isSpeaking ? [1, 0.5, 1] : 1 }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-sky-400' : 'bg-slate-500'}`} 
          />
          <span className="text-[9px] font-bold text-sky-400/80 uppercase tracking-widest">
            {isSpeaking ? "Analyzing Response..." : "Awaiting Input"}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <motion.div 
              key={i}
              animate={{ height: isSpeaking ? [4, 8, 4] : 4 }}
              transition={{ duration: 0.3, delay: i * 0.1, repeat: Infinity }}
              className="w-0.5 bg-sky-500/50 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Aesthetic Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <div className="w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute inset-x-0 h-[2px] bg-sky-500/10 top-0 animate-scanline pointer-events-none shadow-[0_0_10px_rgba(14,165,233,0.2)]" />
      </div>
    </div>
  );
};

export default AIAvatar;
