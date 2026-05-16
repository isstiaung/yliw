import { PrintSize, PrintConfig } from '@/types';

// Box sizes are tuned so a full 52 × 90 grid (the worst case) fits the
// printable area with room for the title, legend and stats. Bigger paper →
// bigger squares, so the poster actually fills the sheet.
export const printConfigs: Record<PrintSize, PrintConfig> = {
  A0: {
    size: 'A0',
    width: '33.1in',
    height: '46.8in',
    boxSize: '40px',
    gap: '3px',
    fontSize: '28pt'
  },
  A1: {
    size: 'A1',
    width: '23.4in',
    height: '33.1in',
    boxSize: '28px',
    gap: '2px',
    fontSize: '22pt'
  },
  A2: {
    size: 'A2',
    width: '16.5in',
    height: '23.4in',
    boxSize: '19px',
    gap: '1.5px',
    fontSize: '16pt'
  },
  A3: {
    size: 'A3',
    width: '11.7in',
    height: '16.5in',
    boxSize: '12px',
    gap: '1px',
    fontSize: '12pt'
  },
  A4: {
    size: 'A4',
    width: '8.3in',
    height: '11.7in',
    boxSize: '7px',
    gap: '0.75px',
    fontSize: '9pt'
  },
  A5: {
    size: 'A5',
    width: '5.8in',
    height: '8.3in',
    boxSize: '5px',
    gap: '0.5px',
    fontSize: '7pt'
  }
};

export function generatePrintCSS(printSize: PrintSize): string {
  const config = printConfigs[printSize];
  
  return `
    @media print {
      @page {
        size: ${config.size} portrait;
        margin: 0.4in;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      body {
        line-height: 1.2;
      }

      .life-calendar-container {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }

      /* The single source of truth: every box AND every grid track reads
         these, so resizing here scales the whole layout coherently. */
      .life-grid {
        overflow: visible !important;
        --week-size: ${config.boxSize} !important;
        --week-gap: ${config.gap} !important;
      }

      .week-box {
        background-color: var(--bg-color) !important;
        border: 0.5px solid var(--border-color) !important;
      }

      /* Hide interactive chrome — keep only the printable poster */
      .print-hide {
        display: none !important;
      }

      .print-show {
        display: block !important;
      }

      .title {
        font-size: ${config.fontSize} !important;
        margin-bottom: 4px !important;
      }

      .subtitle {
        font-size: calc(${config.fontSize} * 0.42) !important;
        display: block !important;
        margin-bottom: 6px !important;
      }

      .quote {
        font-size: calc(${config.fontSize} * 0.55) !important;
        margin-top: 10px !important;
        padding-top: 10px !important;
      }

      /* Compact the surrounding chrome so the grid reliably fits one
         page even at the 52 × 90 worst case with a wrapped legend. */
      .calendar-head {
        margin-bottom: 10px !important;
      }

      .legend {
        margin-bottom: 10px !important;
        gap: 4px 14px !important;
      }

      .life-stats {
        margin-top: 12px !important;
        padding-top: 10px !important;
      }
    }
  `;
}

export function applyPrintStyles(printSize: PrintSize): void {
  // Remove existing print styles
  const existingStyle = document.getElementById('print-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Add new print styles
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.textContent = generatePrintCSS(printSize);
  document.head.appendChild(style);
}

export function removePrintStyles(): void {
  const existingStyle = document.getElementById('print-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
}
