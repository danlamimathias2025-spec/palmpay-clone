import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { PalmPayReceiptDetails } from './transactionFormat';
import { getBankLogoUrl } from '../components/BankLogo';

/**
 * Loads an image from a URL into an HTMLImageElement safely with crossOrigin support.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Return null on failure so drawing doesn't crash
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Renders an authentic PalmPay transaction receipt onto an HTML5 canvas with ultra-crisp 2x/3x DPI.
 * Directly renders images, authentic PalmPay branding, and exact bank logos.
 */
export async function drawReceiptToCanvas(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  scale: number = 3
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Base logical dimensions (A4 proportion, standard mobile receipt slip)
  const logicalWidth = 480;
  const remarkLines = wrapText(details.remark, 40);
  const baseHeight = 720 + remarkLines.length * 18;
  const logicalHeight = baseHeight;

  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;

  ctx.scale(scale, scale);

  // 1. Background (Crisp White Canvas with subtle top accent)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Top header accent line
  ctx.fillStyle = '#6c1cf5';
  ctx.fillRect(0, 0, logicalWidth, 6);

  // Preload authentic logos
  const [palmPayImg, recipientBankImg, senderBankImg] = await Promise.all([
    loadImage('/assets/aistudio/download__1__15dfc463.png'),
    loadImage(getBankLogoUrl(details.recipientBank)),
    loadImage(getBankLogoUrl(details.senderBank)),
  ]);

  // 2. Header Brand Area
  if (palmPayImg) {
    ctx.drawImage(palmPayImg, 32, 24, 38, 38);
  } else {
    drawPalmPayHexagon(ctx, 32, 24, 38);
  }

  // Wordmark "PalmPay"
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6c1cf5';
  ctx.textAlign = 'left';
  ctx.fillText('PalmPay', 78, 43);

  ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#8e929a';
  ctx.fillText('Licensed by CBN | Insured by NDIC', 78, 57);

  // Right side "TRANSACTION RECEIPT" badge
  ctx.fillStyle = 'rgba(108, 28, 245, 0.08)';
  roundRect(ctx, logicalWidth - 175, 28, 143, 28, 6);
  ctx.fill();

  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6c1cf5';
  ctx.textAlign = 'center';
  ctx.fillText('TRANSACTION RECEIPT', logicalWidth - 104, 46);

  // Separator
  ctx.strokeStyle = '#f0f1f5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 78);
  ctx.lineTo(logicalWidth - 32, 78);
  ctx.stroke();

  // 3. Status Badge & Big Amount
  const centerY = 124;

  // Emerald checkmark circle
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.arc(logicalWidth / 2 - 82, centerY, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(logicalWidth / 2 - 86, centerY);
  ctx.lineTo(logicalWidth / 2 - 83, centerY + 4);
  ctx.lineTo(logicalWidth / 2 - 78, centerY - 4);
  ctx.stroke();

  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'left';
  ctx.fillText('Transaction Successful', logicalWidth / 2 - 64, centerY + 4.5);

  // Big Amount "₦..."
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.fillText(`₦${formattedAmount}`, logicalWidth / 2, centerY + 44);

  // Subtitle
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(details.isIncoming ? 'Bank Inward Credit' : 'Fund Transfer', logicalWidth / 2, centerY + 63);

  // Separator
  ctx.beginPath();
  ctx.moveTo(32, centerY + 82);
  ctx.lineTo(logicalWidth - 32, centerY + 82);
  ctx.stroke();

  // 4. Details Key-Value Table
  let currentY = centerY + 108;
  const labelX = 32;
  const valueX = logicalWidth - 32;

  const rows: {
    label: string;
    value: string;
    logo?: HTMLImageElement | null;
    isMono?: boolean;
    isRemark?: boolean;
  }[] = [
    { label: 'Recipient Name', value: details.recipientName },
    { label: 'Recipient Bank', value: details.recipientBank, logo: recipientBankImg },
    { label: 'Recipient Account', value: details.maskedRecipientAccount, isMono: true },
    { label: 'Sender Name', value: details.senderName },
    { label: 'Sender Bank', value: details.senderBank, logo: senderBankImg },
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
      const lines = wrapText(row.value, 38);
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
      // If row has a bank logo, draw the logo next to the bank name!
      if (row.logo) {
        ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#181b28';
        ctx.textAlign = 'right';
        ctx.fillText(row.value, valueX, currentY);

        const textMetrics = ctx.measureText(row.value);
        const logoX = valueX - textMetrics.width - 20;
        const logoY = currentY - 12;

        ctx.save();
        roundRect(ctx, logoX, logoY, 16, 16, 4);
        ctx.clip();
        ctx.drawImage(row.logo, logoX, logoY, 16, 16);
        ctx.restore();
      } else {
        ctx.font = row.isMono
          ? '600 11px "SFMono-Regular", Consolas, Menlo, monospace'
          : '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#181b28';
        ctx.textAlign = 'right';
        ctx.fillText(row.value, valueX, currentY);
      }
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
  drawShield(ctx, 34, footerY + 2, 14);

  ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#8e929a';
  ctx.textAlign = 'left';
  ctx.fillText('Verified PalmPay Instant Settlement (CBN / NDIC)', 54, footerY + 12);

  ctx.font = '600 10px "SFMono-Regular", Consolas, Menlo, monospace';
  ctx.fillStyle = '#6c1cf5';
  ctx.textAlign = 'right';
  ctx.fillText('www.palmpay.com', logicalWidth - 32, footerY + 12);

  return canvas;
}

// Fallback drawing for PalmPay Hexagon
function drawPalmPayHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 48;
  ctx.scale(s, s);

  ctx.fillStyle = '#7418f2';
  ctx.beginPath();
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
 * Renders canvas either from DOM or fallback directly to 2D canvas drawing.
 */
export async function getReceiptCanvas(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<HTMLCanvasElement> {
  if (element) {
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return canvas;
    } catch (e) {
      console.warn('html2canvas capture error, falling back to drawReceiptToCanvas:', e);
    }
  }
  return await drawReceiptToCanvas(details, formattedAmount, 3);
}

/**
 * Downloads receipt as high-res PNG image.
 * Works seamlessly across Android Capacitor native APK, mobile browsers, and desktop.
 */
export async function downloadReceiptAsImage(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<{ success: boolean; dataUrl: string; method: 'native-share' | 'browser-download' }> {
  const canvas = await getReceiptCanvas(details, formattedAmount, element);
  const dataUrl = canvas.toDataURL('image/png');
  const fileName = `palmpay_receipt_${details.txId}.png`;

  // 1. Android Capacitor Native Platform Support
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = dataUrl.split(',')[1];
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'PalmPay Receipt',
        text: `PalmPay Transaction Receipt (₦${formattedAmount})`,
        url: saved.uri,
        dialogTitle: 'Save or Share PalmPay Receipt',
      });

      return { success: true, dataUrl, method: 'native-share' };
    } catch (err) {
      console.warn('Native Filesystem/Share failed, falling back to web download:', err);
    }
  }

  // 2. Browser standard download
  try {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 1000);
  } catch (e) {
    console.warn('Browser link click failed:', e);
  }

  return { success: true, dataUrl, method: 'browser-download' };
}

/**
 * Exports receipt as clean A4 standard PDF.
 * Works across Android Capacitor native APK, mobile browsers, and desktop.
 */
export async function downloadReceiptAsPDF(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<{ success: boolean; method: 'native-share' | 'browser-download' }> {
  const canvas = await getReceiptCanvas(details, formattedAmount, element);
  const imgData = canvas.toDataURL('image/png');
  const fileName = `palmpay_receipt_${details.txId}.pdf`;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Center receipt card neatly on A4 page
  const imgWidth = 145;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const x = (pageWidth - imgWidth) / 2;
  const y = Math.max(12, (pageHeight - imgHeight) / 2);

  pdf.setFillColor(244, 245, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');

  // 1. Android Capacitor Native Platform Support
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Pdf = pdf.output('datauristring').split(',')[1];
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64Pdf,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'PalmPay Receipt PDF',
        text: `PalmPay Transaction Receipt PDF (₦${formattedAmount})`,
        url: saved.uri,
        dialogTitle: 'Save or Share Receipt PDF',
      });

      return { success: true, method: 'native-share' };
    } catch (err) {
      console.warn('Native PDF export failed, falling back to browser download:', err);
    }
  }

  // 2. Browser standard download
  try {
    pdf.save(fileName);
  } catch (e) {
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return { success: true, method: 'browser-download' };
}

/**
 * Native share or file share via Capacitor Share or Web Share API with download fallback.
 */
export async function shareReceipt(
  details: PalmPayReceiptDetails,
  formattedAmount: string,
  element?: HTMLElement | null
): Promise<{ success: boolean; method: 'native-share' | 'web-share' | 'download' }> {
  const canvas = await getReceiptCanvas(details, formattedAmount, element);
  const dataUrl = canvas.toDataURL('image/png');
  const fileName = `palmpay_receipt_${details.txId}.png`;

  // 1. Capacitor Native Share
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = dataUrl.split(',')[1];
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'PalmPay Receipt',
        text: `PalmPay Transaction Receipt for ₦${formattedAmount} (${details.txId})`,
        url: saved.uri,
        dialogTitle: 'Share PalmPay Receipt',
      });

      return { success: true, method: 'native-share' };
    } catch (err) {
      console.warn('Capacitor share error, falling back:', err);
    }
  }

  // 2. Web Share API with file support
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], fileName, { type: 'image/png' });
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

  // 3. Fallback: download directly
  await downloadReceiptAsImage(details, formattedAmount, element);
  return { success: true, method: 'download' };
}
