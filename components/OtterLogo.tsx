import React from "react";

interface OtterLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function OtterLogo({
  className = "w-8 h-8",
  size = 32,
  showText = true,
  textClassName = "text-xl font-bold tracking-tight text-white",
}: OtterLogoProps) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-amber-500/30 to-cyan-500/30 blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />
        
        {/* Otter Head Icon Container */}
        <div className="relative rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 p-1.5 border border-slate-700/60 shadow-inner">
          <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
          >
            {/* Otter ears */}
            <circle cx="12" cy="15" r="6" fill="#D97706" />
            <circle cx="12" cy="15" r="3.5" fill="#FDE68A" />
            <circle cx="36" cy="15" r="6" fill="#D97706" />
            <circle cx="36" cy="15" r="3.5" fill="#FDE68A" />

            {/* Otter head main */}
            <path
              d="M10 24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24C38 31.732 31.732 38 24 38C16.268 38 10 31.732 10 24Z"
              fill="#F59E0B"
            />

            {/* Snout area */}
            <ellipse cx="24" cy="27" rx="9" ry="7" fill="#FEF3C7" />

            {/* Nose */}
            <ellipse cx="24" cy="24" rx="3.5" ry="2.5" fill="#1E293B" />

            {/* Mouth */}
            <path
              d="M21.5 28C22.5 29.5 23.5 29.5 24 29.5C24.5 29.5 25.5 29.5 26.5 28"
              stroke="#1E293B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Whiskers */}
            <line x1="14" y1="26" x2="9" y2="25" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="28" x2="8" y2="29" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="34" y1="26" x2="39" y2="25" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="34" y1="28" x2="40" y2="29" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

            {/* Eyes with curious spark */}
            <ellipse cx="18" cy="21" rx="2.5" ry="3" fill="#0F172A" />
            <circle cx="17.2" cy="20" r="1" fill="#FFFFFF" />

            <ellipse cx="30" cy="21" rx="2.5" ry="3" fill="#0F172A" />
            <circle cx="29.2" cy="20" r="1" fill="#FFFFFF" />

            {/* AI Sparkle badge near forehead */}
            <path
              d="M34 8L35.2 11.8L39 13L35.2 14.2L34 18L32.8 14.2L29 13L32.8 11.8L34 8Z"
              fill="#38BDF8"
              className="drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={textClassName}>
              Otter<span className="text-cyan-400">.ai</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              Flow
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
