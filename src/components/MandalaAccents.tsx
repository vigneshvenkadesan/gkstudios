import React from 'react';

export function MandalaCorner({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke="#C5B378" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="0" cy="0" r="142" strokeOpacity="0.28" strokeDasharray="4 4" />
        <circle cx="0" cy="0" r="122" strokeOpacity="0.55" />
        <circle cx="0" cy="0" r="96" strokeOpacity="0.4" />
        <circle cx="0" cy="0" r="68" strokeOpacity="0.55" />
        <circle cx="0" cy="0" r="38" strokeOpacity="0.6" />
        {[0, 18, 36, 54, 72, 90].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path
              d="M38 0 C54 -11, 74 -11, 96 0 C74 11, 54 11, 38 0 Z"
              fill="#C5B378"
              fillOpacity="0.16"
            />
            <path
              d="M96 0 L114 -9 L126 0 L114 9 Z"
              fill="#C5B378"
              fillOpacity="0.22"
            />
            <circle cx="132" cy="0" r="2" fill="#D8C78E" fillOpacity="0.65" stroke="none" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function MandalaDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C5B378]/40 to-[#C5B378]/60" />
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="15" stroke="#C5B378" strokeOpacity="0.55" strokeWidth="1.2" />
        <circle cx="18" cy="18" r="6" stroke="#D8C78E" strokeWidth="1.2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path
            key={deg}
            d="M18 3 L20.5 10 L18 12 L15.5 10 Z"
            fill="#C5B378"
            fillOpacity="0.7"
            transform={`rotate(${deg} 18 18)`}
          />
        ))}
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#C5B378]/40 to-[#C5B378]/60" />
    </div>
  );
}

export function GKCameraMark({ className = 'h-9 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 56" fill="none" aria-hidden="true" className={className}>
      {/* Minimalist camera bracket frame matching attached GK STUDIOS mark */}
      <path
        d="M18 12 H10 V48 H22 M62 12 H70 V48 H58 M14 12 V7 H22 V12"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="30" r="17" stroke="#FFFFFF" strokeWidth="2.2" strokeDasharray="38 12" />
      <circle cx="40" cy="30" r="12.5" stroke="#D8C78E" strokeWidth="1.5" strokeDasharray="24 14" />
      <text
        x="33.5"
        y="34.5"
        fill="#E03E36"
        fontSize="14"
        fontWeight="800"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        G
      </text>
      <text
        x="42"
        y="34.5"
        fill="#FFFFFF"
        fontSize="14"
        fontWeight="700"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        K
      </text>
    </svg>
  );
}
