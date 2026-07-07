// src/components/Icons.tsx
import React from 'react';

export const ICONS: Record<string, React.ReactNode> = {
  bag: (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <path d="M15 30c0-10 9-18 20-18s20 8 20 18v20a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V30z" fill="#FBF4EC" opacity="0.85" />
      <path d="M22 30c4-4 8-4 13 0s9 4 13 0" stroke="#7B4B33" strokeWidth="2" fill="none" />
    </svg>
  ),
  bear: (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="24" r="14" fill="#FBF4EC" opacity="0.9" />
      <circle cx="24" cy="20" r="2" fill="#3D2B1F" />
      <circle cx="36" cy="20" r="2" fill="#3D2B1F" />
      <path d="M20 44c2-6 6-9 10-9s8 3 10 9" stroke="#FBF4EC" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  ),
  hat: (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <path d="M10 24c0-4 4-7 8-7h24c4 0 8 3 8 7v3H10v-3z" fill="#FBF4EC" opacity="0.9" />
      <rect x="8" y="27" width="44" height="22" rx="3" fill="#FBF4EC" opacity="0.75" />
    </svg>
  ),
  scarf: (
    <svg width="80" height="20" viewBox="0 0 100 20" fill="none">
      <rect x="0" y="0" width="100" height="20" rx="10" fill="#FBF4EC" />
      <path d="M5 10c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0 8-4 12 0" stroke="#7B4B33" strokeWidth="1.4" fill="none" />
    </svg>
  ),
  pouch: (
    <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
      <rect x="15" y="25" width="50" height="55" rx="8" fill="#FBF4EC" />
      <path d="M27 25v-6a13 13 0 0 1 26 0v6" stroke="#FBF4EC" strokeWidth="4" fill="none" />
    </svg>
  ),
  fox: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="22" fill="#FBF4EC" />
      <path d="M40 18c10 0 14 8 14 8s-9-2-14 2-14-2-14-2 4-8 14-8z" fill="#FBF4EC" />
      <circle cx="33" cy="38" r="2.5" fill="#3D2B1F" />
      <circle cx="47" cy="38" r="2.5" fill="#3D2B1F" />
    </svg>
  ),
  starfish: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* 5-pointed starfish */}
      <path d="M40 8 L45 30 L65 22 L50 38 L68 52 L46 46 L40 68 L34 46 L12 52 L30 38 L15 22 L35 30 Z" fill="#FBF4EC" opacity="0.9" />
      {/* googly eyes */}
      <circle cx="36" cy="32" r="3.5" fill="white" />
      <circle cx="44" cy="32" r="3.5" fill="white" />
      <circle cx="37" cy="33" r="1.5" fill="#1a1a1a" />
      <circle cx="45" cy="33" r="1.5" fill="#1a1a1a" />
    </svg>
  ),
};
