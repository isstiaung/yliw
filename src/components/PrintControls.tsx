'use client';

import React, { useState } from 'react';
import { PrintSize } from '@/types';
import { printConfigs, applyPrintStyles, removePrintStyles } from '@/utils/printStyles';
import { FaPrint } from 'react-icons/fa';

interface PrintControlsProps {
  className?: string;
}

export default function PrintControls({ className = '' }: PrintControlsProps) {
  const [selectedSize, setSelectedSize] = useState<PrintSize>('A4');

  const handleSizeChange = (size: PrintSize) => {
    setSelectedSize(size);
  };

  const handlePrint = () => {
    applyPrintStyles(selectedSize);
    
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
      
      // Clean up after printing
      setTimeout(() => {
        removePrintStyles();
      }, 1000);
    }, 100);
  };

  return (
    <div className={`bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 ${className}`}>
      <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-4">
        Print
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--ink)] mb-2">
          Paper size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(printConfigs).map(([size, config]) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size as PrintSize)}
              className={`p-2.5 text-sm border rounded-md transition-colors ${
                selectedSize === size
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--line)] hover:border-[var(--muted)]/50 text-[var(--ink)]'
              }`}
            >
              <div className="font-medium">{size}</div>
              <div className="text-[10px] text-[var(--muted)]">
                {config.width} × {config.height}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="w-full bg-[var(--ink)] text-[var(--paper)] px-4 py-3 rounded-md font-medium hover:bg-[var(--accent)] transition-colors flex items-center justify-center gap-2"
      >
        <FaPrint className="w-3.5 h-3.5" />
        Print {selectedSize}
      </button>

      <div className="mt-4 p-3 bg-[var(--paper)] border border-[var(--line)] rounded-md">
        <ul className="text-xs space-y-1 text-[var(--muted)]">
          <li className="text-[var(--ink)] font-medium">Enable “Background graphics” to keep colours.</li>
          <li>Set paper to {selectedSize}, portrait, margins “Default”.</li>
          <li>Choose “Save as PDF” to export a file.</li>
          <li>A4 and A3 suit most home printers; A0–A2 are poster sizes.</li>
        </ul>
      </div>
    </div>
  );
}
