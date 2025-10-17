// @ts-nocheck
import React from 'react';

const Button = ({ children, primary, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-sm
      ${primary
        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
      }
    `}
  >
    {children}
  </button>
);

export default Button;