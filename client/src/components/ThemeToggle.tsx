import React from 'react';
import { useCustomTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { mode, toggleTheme } = useCustomTheme();
  const isDarkMode = mode === 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      title="Alternar tema"
      aria-label="Alternar tema"
      onClick={toggleTheme}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 32 32"
        style={{
          transition: 'color 0.4s cubic-bezier(.4,2,.6,1)',
          color: isDarkMode ? '#fff' : '#eab308',
          display: 'block'
        }}
      >
        <defs>
          <mask id="moon-mask">
            <rect x="0" y="0" width="32" height="32" fill="white" />
            <circle
              cx={isDarkMode ? 24 : 16}
              cy={isDarkMode ? 8 : 16}
              r="9.34"
              fill="black"
              style={{
                transition: 'cx 0.4s cubic-bezier(.4,2,.6,1), cy 0.4s cubic-bezier(.4,2,.6,1)'
              }}
            />
          </mask>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="9.34"
          fill="currentColor"
          mask="url(#moon-mask)"
          style={{
            transition: 'fill 0.4s cubic-bezier(.4,2,.6,1)'
          }}
        />
        {/* Sun rays */}
        <g
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            opacity: isDarkMode ? 0 : 1,
            transition: 'opacity 0.4s cubic-bezier(.4,2,.6,1)'
          }}
        >
          <path d="M16 5.5v-4" />
          <path d="M16 30.5v-4" />
          <path d="M1.5 16h4" />
          <path d="M26.5 16h4" />
          <path d="m23.4 8.6 2.8-2.8" />
          <path d="m5.7 26.3 2.9-2.9" />
          <path d="m5.8 5.8 2.8 2.8" />
          <path d="m23.4 23.4 2.9 2.9" />
        </g>
      </svg>
    </button>
  );
} 