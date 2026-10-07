import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PalmPayReceiptDetails } from './transactionFormat';

/**
 * Renders an authentic PalmPay transaction receipt onto an HTML5 canvas with ultra-crisp 2x/3x DPI.
 * This provides 100% resilient image and PDF exportation without DOM CSS parsing errors.
 */
export function drawReceiptToCanvas(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  scale: number = 3
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Base logical dimensions (A4 proportion, standard mobile receipt card)
  const logicalWidth = 480;
  // Dynamic height calculation based on remark length
  const remarkLines = wrapText(details.remark, 42);
  const baseHeight = 700 + remarkLines.length * 18;
  const logicalHeight = baseHeight;

  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;

  ctx.scale(scale, scale);

  // 1. Background (Clean Crisp White with subtle rounded corner container)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Top header accent line
  ctx.fillStyle = '#6c1cf5';
  ctx.fillRect(0, 0, logicalWidth, 6);

  // 2. Header Brand Area
  // Draw PalmPay Purple Hexagon Logo Icon
  drawPalmPayLogo(ctx, 32, 28, 32);

  // Wordmark "PalmPay"
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#181b28';
  ctx.textAlign = 'left';
  ctx.fillText('PalmPay', 72, 45);

  ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#8e929a';
  ctx.fillText('The Smarter Way to Bank', 72, 58);

  // Right side "TRANSACTION RECEIPT" badge
  ctx.fillStyle = 'rgba(108, 28, 245, 0.08)';
  roundRect(ctx, logicalWidth - 165, 30, 133, 26, 6);
  ctx.fill();

  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6c1cf5';
  ctx.textAlign = 'center';
  ctx.fillText('TRANSACTION RECEIPT', logicalWidth - 98, 47);

  // Subtle separator
  ctx.strokeStyle = '#f0f1f5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 76);
  ctx.lineTo(logicalWidth - 32, 76);
  ctx.stroke();

  // 3. Status Badge & Big Amount
  const centerY = 120;

  // Emerald checkmark circle
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.arc(logicalWidth / 2 - 80, centerY, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(logicalWidth / 2 - 84, centerY);
  ctx.lineTo(logicalWidth / 2 - 81, centerY + 3.5);
  ctx.lineTo(logicalWidth / 2 - 76, centerY - 3.5);
  ctx.stroke();

  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'left';
  ctx.fillText('Transaction Successful', logicalWidth / 2 - 62, centerY + 4.5);

  // Big Amount "₦..."
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.fillText(`₦${formattedAmount}`, logicalWidth / 2, centerY + 42);

  // Subtitle
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(details.isIncoming ? 'Bank Inward Credit' : 'Fund Transfer', logicalWidth / 2, centerY + 60);

  // Separator
  ctx.beginPath();
  ctx.moveTo(32, centerY + 78);
  ctx.lineTo(logicalWidth - 32, centerY + 78);
  ctx.stroke();

  // 4. Details Key-Value Table
  let currentY = centerY + 104;
  const labelX = 32;
  const valueX = logicalWidth - 32;

  const rows: { label: string; value: string; isMono?: boolean; isRemark?: boolean }[] = [
    { label: 'Recipient Name', value: details.recipientName },
    { label: 'Recipient Bank', value: details.recipientBank },
    { label: 'Recipient Account', value: details.maskedRecipientAccount, isMono: true },
    { label: 'Sender Name', value: details.senderName },
    { label: 'Sender Bank', value: details.senderBank },
    { label: 'Remark', value: details.remark, isRemark: true },
    { label: 'Transaction Date', value: details.completionTime },
    { label: 'Transaction ID', value: details.txId, isMono: true },
    { label: 'Session ID', value: details.sessionId, isMono: true },
  ];

  for (const row of rows) {
    // Label
    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#8e929a';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, labelX, currentY);

    // Value
    if (row.isRemark) {
      const lines = wrapText(row.value, 40);
      ctx.font = '600 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#181b28';
      ctx.textAlign = 'right';
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], valueX, currentY + i * 15);
      }
      currentY += Math.max(26, lines.length * 15 + 10);
    } else if (row.label === 'Session ID') {
      const lines = wrapText(row.value, 28);
      ctx.font = '600 9.5px "SFMono-Regular", Consolas, Menlo, monospace';
      ctx.fillStyle = '#181b28';
      ctx.textAlign = 'right';
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], valueX, currentY + i * 14);
      }
      currentY += Math.max(26, lines.length * 14 + 10);
    } else {
      ctx.font = row.isMono
        ? '600 11px "SFMono-Regular", Consolas, Menlo, monospace'
        : '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#181b28';
      ctx.textAlign = 'right';
      ctx.fillText(row.value, valueX, currentY);
      currentY += 28;
    }

    // Light row divider
    ctx.strokeStyle = '#f8f9fc';
    ctx.beginPath();
    ctx.moveTo(labelX, currentY - 14);
    ctx.lineTo(valueX, currentY - 14);
    ctx.stroke();
  }

  // 5. Official Footer
  const footerY = logicalHeight - 48;
  ctx.strokeStyle = '#f0f1f5';
  ctx.beginPath();
  ctx.moveTo(32, footerY - 12);
  ctx.lineTo(logicalWidth - 32, footerY - 12);
  ctx.stroke();

  // Shield icon
  ctx.fillStyle = '#6c1cf5';
  drawShield(ctx, 34, footerY + 2, 12);

  ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#8e929a';
  ctx.textAlign = 'left';
  ctx.fillText('Verified PalmPay Instant Settlement (CBN / NDIC)', 52, footerY + 11);

  ctx.font = '600 10px "SFMono-Regular", Consolas, Menlo, monospace';
  ctx.fillStyle = '#6c1cf5';
  ctx.textAlign = 'right';
  ctx.fillText('www.palmpay.com', logicalWidth - 32, footerY + 11);

  return canvas;
}

// Helper: PalmPay Purple Hexagon Logo drawing on 2D context
function drawPalmPayLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 48;
  ctx.scale(s, s);

  // Purple Hexagon
  ctx.fillStyle = '#7418f2';
  ctx.beginPath();
  // Standard PalmPay hexagon path
  ctx.moveTo(21.15, 4.26);
  ctx.bezierCurveTo(22.9, 3.24, 25.07, 3.24, 26.84, 4.26);
  ctx.lineTo(39.67, 11.67);
  ctx.bezierCurveTo(41.43, 12.69, 42.51, 14.56, 42.51, 16.59);
  ctx.lineTo(42.51, 31.41);
  ctx.bezierCurveTo(42.51, 33.44, 41.43, 35.32, 39.67, 36.33);
  ctx.lineTo(26.84, 43.74);
  ctx.bezierCurveTo(25.07, 44.76, 22.9, 44.76, 21.15, 43.74);
  ctx.lineTo(8.32, 36.33);
  ctx.bezierCurveTo(6.56, 35.32, 5.48, 33.44, 5.48, 31.41);
  ctx.lineTo(5.48, 16.59);
  ctx.bezierCurveTo(5.48, 14.56, 6.56, 12.69, 8.32, 11.67);
  ctx.closePath();
  ctx.fill();

  // White Interlocking bands
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  ctx.beginPath();
  ctx.moveTo(5.5, 29.8);
  ctx.lineTo(23.0, 12.3);
  ctx.lineTo(32.2, 19.4);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(42.5, 18.2);
  ctx.lineTo(25.0, 35.7);
  ctx.lineTo(15.8, 28.6);
  ctx.stroke();

  // White Center diamond
  ctx.save();
  ctx.translate(24, 24);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -2.5, -2.5, 5.1, 5.1, 0.6);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 16;
  ctx.scale(s, s);
  ctx.fillStyle = '#6c1cf5';
  ctx.beginPath();
  ctx.moveTo(8, 1);
  ctx.lineTo(14, 3.5);
  ctx.lineTo(14, 8);
  ctx.bezierCurveTo(14, 12.2, 11.4, 14.5, 8, 15.8);
  ctx.bezierCurveTo(4.6, 14.5, 2, 12.2, 2, 8);
  ctx.lineTo(2, 3.5);
  ctx.closePath();
  ctx.fill();

  // White checkmark inside shield
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(5.2, 8.2);
  ctx.lineTo(7.2, 10.4);
  ctx.lineTo(11, 5.8);
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return ['-'];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

/**
 * Downloads receipt as high-res PNG image.
 */
export async function downloadReceiptAsImage(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<void> {
  let canvas: HTMLCanvasElement;
  if (element) {
    try {
      canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
    } catch (e) {
      console.warn('html2canvas capture error, falling back to drawReceiptToCanvas:', e);
      canvas = drawReceiptToCanvas(details, formattedAmount, 3);
    }
  } else {
    canvas = drawReceiptToCanvas(details, formattedAmount, 3);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to generate image blob');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `palmpay_receipt_${details.txId}.png`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Exports receipt as clean A4 standard PDF.
 */
export async function downloadReceiptAsPDF(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<void> {
  let canvas: HTMLCanvasElement;
  if (element) {
    try {
      canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
    } catch (e) {
      console.warn('html2canvas capture error, falling back to drawReceiptToCanvas:', e);
      canvas = drawReceiptToCanvas(details, formattedAmount, 3);
    }
  } else {
    canvas = drawReceiptToCanvas(details, formattedAmount, 3);
  }

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Center receipt card neatly on A4 page
  const imgWidth = 145; // 145mm width card
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const x = (pageWidth - imgWidth) / 2;
  const y = Math.max(12, (pageHeight - imgHeight) / 2);

  // Add subtle background container on PDF
  pdf.setFillColor(244, 245, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');

  // Generate Blob URL for 100% Android WebView & Mobile Browser compatibility
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `palmpay_receipt_${details.txId}.pdf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Native share or file share via Web Share API with download fallback.
 */
export async function shareReceipt(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<{ success: boolean; method: 'web-share' | 'download' }> {
  let canvas: HTMLCanvasElement;
  if (element) {
    try {
      canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
    } catch (e) {
      canvas = drawReceiptToCanvas(details, formattedAmount, 3);
    }
  } else {
    canvas = drawReceiptToCanvas(details, formattedAmount, 3);
  }

  // If Web Share API with files is supported
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], `palmpay_receipt_${details.txId}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'PalmPay Transaction Receipt',
            text: `PalmPay Transaction Receipt for ₦${formattedAmount} (${details.txId})`,
            files: [file],
          });
          return { success: true, method: 'web-share' };
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share API error, falling back to download:', err);
      } else {
        return { success: true, method: 'web-share' };
      }
    }
  }

  // Fallback: download directly
  await downloadReceiptAsImage(details, formattedAmount, element);
  return { success: true, method: 'download' };
}
