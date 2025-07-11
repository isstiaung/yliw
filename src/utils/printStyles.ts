import { PrintSize, PrintConfig } from '@/types';

export const printConfigs: Record<PrintSize, PrintConfig> = {
  A0: {
    size: 'A0',
    width: '33.1in',
    height: '46.8in',
    boxSize: '0.8mm',
    fontSize: '8pt'
  },
  A1: {
    size: 'A1',
    width: '23.4in',
    height: '33.1in',
    boxSize: '0.6mm',
    fontSize: '7pt'
  },
  A2: {
    size: 'A2',
    width: '16.5in',
    height: '23.4in',
    boxSize: '0.4mm',
    fontSize: '6pt'
  },
  A3: {
    size: 'A3',
    width: '11.7in',
    height: '16.5in',
    boxSize: '0.3mm',
    fontSize: '5pt'
  },
  A4: {
    size: 'A4',
    width: '8.3in',
    height: '11.7in',
    boxSize: '0.2mm',
    fontSize: '4pt'
  },
  A5: {
    size: 'A5',
    width: '5.8in',
    height: '8.3in',
    boxSize: '0.15mm',
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
      }
      
      .week-box {
        width: ${config.boxSize};
        height: ${config.boxSize};
        min-width: ${config.boxSize};
        min-height: ${config.boxSize};
      }
      
      .life-grid {
        gap: 1px;
      }
      
      .print-hide {
        display: none !important;
      }
      
      .print-show {
        display: block !important;
      }
      
      .title {
        font-size: calc(${config.fontSize} * 2);
        margin-bottom: 0.2in;
      }
      
      .quote {
        font-size: calc(${config.fontSize} * 1.2);
        margin-top: 0.2in;
      }
      
      .year-labels {
        font-size: calc(${config.fontSize} * 0.8);
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
