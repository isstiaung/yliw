'use client';

import React, { useState } from 'react';
import { PrintSize } from '@/types';
import { printConfigs, applyPrintStyles, removePrintStyles } from '@/utils/printStyles';
import { FaPrint, FaDownload } from 'react-icons/fa';

interface PrintControlsProps {
  className?: string;
}

export default function PrintControls({ className = '' }: PrintControlsProps) {
  const [selectedSize, setSelectedSize] = useState<PrintSize>('A4');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleSizeChange = (size: PrintSize) => {
    setSelectedSize(size);
    if (isPreviewMode) {
      applyPrintStyles(size);
    }
  };

  const togglePreviewMode = () => {
    if (isPreviewMode) {
      removePrintStyles();
      setIsPreviewMode(false);
    } else {
      applyPrintStyles(selectedSize);
      setIsPreviewMode(true);
    }
  };

  const handlePrint = () => {
    applyPrintStyles(selectedSize);
    
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
      
      // Clean up after printing
      setTimeout(() => {
        if (!isPreviewMode) {
          removePrintStyles();
        }
      }, 1000);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      
      applyPrintStyles(selectedSize);
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = document.querySelector('.life-calendar-container') as HTMLElement;
      if (!element) {
        alert('Calendar not found. Please make sure the calendar is visible.');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `life-calendar-${selectedSize.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Clean up
      if (!isPreviewMode) {
        removePrintStyles();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating download. Please try printing instead.');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Print Options</h3>
      
      {/* Print Size Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Print Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(printConfigs).map(([size, config]) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size as PrintSize)}
              className={`p-3 text-sm border rounded-lg transition-colors ${
                selectedSize === size
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="font-medium">{size}</div>
              <div className="text-xs text-gray-500">
                {config.width} × {config.height}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Size Information */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-1">Selected: {selectedSize}</div>
          <div className="text-xs text-gray-600">
            Dimensions: {printConfigs[selectedSize].width} × {printConfigs[selectedSize].height}
          </div>
          <div className="text-xs text-gray-600">
            Box size: {printConfigs[selectedSize].boxSize}
          </div>
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="mb-4">
        <button
          onClick={togglePreviewMode}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isPreviewMode
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isPreviewMode ? 'Exit Print Preview' : 'Print Preview'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handlePrint}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
        >
          <FaPrint className="w-4 h-4" />
          Print Calendar
        </button>
        
        <button
          onClick={handleDownloadPDF}
          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
        >
          <FaDownload className="w-4 h-4" />
          Download as Image
        </button>
      </div>

      {/* Print Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">Print Tips:</div>
          <ul className="text-xs space-y-1 text-blue-700">
            <li>• Use landscape orientation for better fit</li>
            <li>• Ensure your printer supports the selected size</li>
            <li>• For best quality, use high-resolution settings</li>
            <li>• A4 and A3 work well for most home printers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
