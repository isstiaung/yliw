import { PrintSize, PrintConfig } from '@/types';

export const printConfigs: Record<PrintSize, PrintConfig> = {
  A0: {
    size: 'A0',
    width: '33.1in',
    height: '46.8in',
    boxSize: '12px',
    fontSize: '10pt'
  },
  A1: {
    size: 'A1',
    width: '23.4in',
    height: '33.1in',
    boxSize: '10px',
    fontSize: '9pt'
  },
  A2: {
    size: 'A2',
    width: '16.5in',
    height: '23.4in',
    boxSize: '8px',
    fontSize: '8pt'
  },
  A3: {
    size: 'A3',
    width: '11.7in',
    height: '16.5in',
    boxSize: '5px',
    fontSize: '6pt'
  },
  A4: {
    size: 'A4',
    width: '8.3in',
    height: '11.7in',
    boxSize: '5px',
    fontSize: '4pt'
  },
  A5: {
    size: 'A5',
    width: '5.8in',
    height: '8.3in',
    boxSize: '1.5px',
    fontSize: '3pt'
  }
};

export function generatePrintCSS(printSize: PrintSize): string {
  const config = printConfigs[printSize];
  
  return `
    @media print {
      @page {
        size: ${config.width} ${config.height};
        margin: 0.5in;
      }
      
      body {
        font-size: ${config.fontSize};
        line-height: 1.2;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .life-calendar-container {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        padding: 0 !important;
      }
      
      .week-box {
        width: ${config.boxSize} !important;
        height: ${config.boxSize} !important;
        min-width: ${config.boxSize} !important;
        min-height: ${config.boxSize} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        background-color: var(--bg-color) !important;
        border: 0.5px solid var(--border-color) !important;
      }
      
      .life-grid {
        gap: 0.5px !important;
      }
      
      .life-grid > div {
        gap: 0.5px !important;
      }
      
      /* Hide all non-essential elements */
      .print-hide,
      .bg-white.shadow-sm.border-b,
      .lg\\:col-span-1,
      .flex.flex-wrap.justify-center.gap-6.mb-8 {
        display: none !important;
      }
      
      .print-show {
        display: block !important;
      }
      
      .title {
        font-size: 20px !important;
        margin-bottom: 2px !important;
      }

      .subtitle {
        font-size: 16px !important;
        display: block !important;
        margin-bottom: 2px !important;
      }
      
      .text-center.mb-8 {
        font-size: 20px !important;
        margin-bottom: 4px !important;
      }
      
      .text-gray-600 {
        display: none !important;
      }
      
      .quote {
        font-size: 20px !important;
        margin-top: 2px !important;
        padding-top: 2px !important;
      }
      
      .year-labels {
        font-size: calc(${config.fontSize} * 0.7) !important;
      }
      
      /* Ensure all elements preserve their colors */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
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
