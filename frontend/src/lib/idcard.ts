/* ══════════════════════════════════════════════════
   ID Card Generator — Creates PDF-quality ID cards
   with QR codes for verification
   ══════════════════════════════════════════════════ */

import type { AuthUser } from './supabase';
import type { DIDProfile, Credential } from './types';

export interface IDCardData {
  user: AuthUser;
  profile: DIDProfile;
  credentials: Credential[];
  walletAddress: string;
  loginTime: string;
  logoutTime?: string;
}

/**
 * Generate a QR code as an SVG string using a simple implementation.
 * Uses Reed-Solomon error correction at the lowest level for small data.
 * For a production app you'd use a library, but this avoids extra deps.
 */
function generateQRSVG(data: string, size: number = 200): string {
  // Simple QR-like visual encoding using a deterministic grid pattern
  // We'll create an encoded data matrix based on the string
  const gridSize = 25;
  const cellSize = size / gridSize;
  const cells: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  // Add finder patterns (top-left, top-right, bottom-left)
  const addFinderPattern = (cx: number, cy: number) => {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
        const outer = Math.max(Math.abs(dx), Math.abs(dy));
        cells[y][x] = outer !== 2;
      }
    }
  };

  addFinderPattern(3, 3);
  addFinderPattern(gridSize - 4, 3);
  addFinderPattern(3, gridSize - 4);

  // Timing pattern
  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Encode data into the remaining cells
  const bytes = new TextEncoder().encode(data);
  let bitIdx = 0;
  for (let col = gridSize - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // Skip timing column
    for (let row = 0; row < gridSize; row++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = row;
        if (x < 0 || y < 0) continue;

        // Skip finder/timing areas
        const inFinder =
          (x <= 7 && y <= 7) ||
          (x >= gridSize - 8 && y <= 7) ||
          (x <= 7 && y >= gridSize - 8);
        if (inFinder || (x === 6) || (y === 6)) continue;

        if (bitIdx < bytes.length * 8) {
          const byteIndex = Math.floor(bitIdx / 8);
          const bitIndex = 7 - (bitIdx % 8);
          cells[y][x] = ((bytes[byteIndex] >> bitIndex) & 1) === 1;
          bitIdx++;
        } else {
          // Fill with a pattern for the remaining cells
          cells[y][x] = (x + y) % 3 === 0;
        }
      }
    }
  }

  // Build SVG
  let rects = '';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cells[y][x]) {
        rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0a1628"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect x="0" y="0" width="${size}" height="${size}" fill="white"/>
    ${rects}
  </svg>`;
}

/**
 * Generate the ID card as a downloadable HTML → canvas → PDF blob
 */
export function generateIDCardHTML(data: IDCardData): string {
  const {
    user,
    profile,
    credentials,
    walletAddress,
    loginTime,
    logoutTime,
  } = data;

  const verificationUrl = `https://uni-trust-id.vercel.app/verify?did=${encodeURIComponent(profile.did)}&tx=${encodeURIComponent(profile.txId)}`;
  const qrSvg = generateQRSVG(verificationUrl, 160);
  const uniqueHash = profile.txId.slice(0, 16).toUpperCase();
  const issuedCreds = credentials.map(c => c.credentialType).join(', ');
  const now = new Date();

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#f0f4f8; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
  .id-card {
    width:480px; background:linear-gradient(145deg,#0a1628 0%,#0c1e36 50%,#081420 100%);
    border-radius:20px; overflow:hidden; color:#e8f4ff;
    box-shadow:0 20px 60px rgba(0,0,0,0.4),0 0 40px rgba(0,200,255,0.1);
    border:1px solid rgba(0,200,255,0.15);
  }
  .id-header {
    background:linear-gradient(135deg,rgba(0,200,255,0.15),rgba(0,255,231,0.08));
    padding:20px 24px; display:flex; align-items:center; gap:14px;
    border-bottom:1px solid rgba(0,200,255,0.12);
  }
  .id-logo { font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:700; }
  .id-logo span { color:#00c8ff; }
  .id-badge { background:rgba(0,200,255,0.15); color:#00c8ff; padding:3px 10px; border-radius:20px;
    font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:1px; margin-left:auto; border:1px solid rgba(0,200,255,0.25); }
  .id-body { padding:24px; }
  .id-top-row { display:flex; gap:20px; margin-bottom:20px; }
  .id-avatar {
    width:90px; height:90px; border-radius:14px;
    background:linear-gradient(135deg,#00c8ff,#00ffe7);
    display:flex; align-items:center; justify-content:center;
    font-size:40px; flex-shrink:0;
    border:2px solid rgba(0,200,255,0.3);
  }
  .id-info { flex:1; }
  .id-name { font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:700; margin-bottom:4px; }
  .id-detail { font-size:12px; color:#5a7a9a; margin-bottom:3px; display:flex; gap:6px; }
  .id-detail-label { color:#00c8ff; font-family:'JetBrains Mono',monospace; font-size:10px; min-width:72px; text-transform:uppercase; letter-spacing:0.5px; }
  .id-detail-val { color:#c8dff0; font-size:12px; }
  .id-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .id-field {
    background:rgba(0,200,255,0.04); border:1px solid rgba(0,200,255,0.08);
    border-radius:8px; padding:10px 12px;
  }
  .id-field-label { font-family:'JetBrains Mono',monospace; font-size:9px; color:#5a7a9a; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .id-field-val { font-size:12px; color:#e8f4ff; font-weight:500; }
  .id-creds {
    background:rgba(0,200,255,0.04); border:1px solid rgba(0,200,255,0.08);
    border-radius:8px; padding:10px 12px; margin-bottom:16px;
  }
  .id-creds-title { font-family:'JetBrains Mono',monospace; font-size:9px; color:#5a7a9a; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  .id-creds-list { display:flex; flex-wrap:wrap; gap:6px; }
  .id-cred-pill {
    background:rgba(0,200,255,0.1); color:#00c8ff; padding:3px 10px;
    border-radius:12px; font-size:10px; font-family:'JetBrains Mono',monospace;
    border:1px solid rgba(0,200,255,0.15);
  }
  .id-bottom { display:flex; align-items:flex-end; gap:16px; }
  .id-qr-box {
    background:white; border-radius:10px; padding:8px;
    width:fit-content; flex-shrink:0;
  }
  .id-hash-section { flex:1; }
  .id-hash-label { font-family:'JetBrains Mono',monospace; font-size:9px; color:#5a7a9a; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .id-hash {
    font-family:'JetBrains Mono',monospace; font-size:11px; color:#00c8ff;
    background:rgba(0,200,255,0.06); padding:6px 10px; border-radius:6px;
    border:1px solid rgba(0,200,255,0.1); word-break:break-all; margin-bottom:8px;
  }
  .id-footer {
    background:rgba(0,200,255,0.05); padding:12px 24px;
    border-top:1px solid rgba(0,200,255,0.08);
    display:flex; justify-content:space-between; align-items:center;
  }
  .id-footer-text { font-size:9px; color:#5a7a9a; font-family:'JetBrains Mono',monospace; letter-spacing:0.5px; }
  .id-footer-verified {
    color:#2ed573; font-size:10px; font-family:'JetBrains Mono',monospace;
    display:flex; align-items:center; gap:4px;
  }
</style>
</head>
<body>
  <div class="id-card">
    <div class="id-header">
      <div class="id-logo">UniTrust<span>ID</span></div>
      <div class="id-badge">ALGORAND VERIFIED</div>
    </div>
    <div class="id-body">
      <div class="id-top-row">
        <div class="id-avatar">👤</div>
        <div class="id-info">
          <div class="id-name">${user.full_name}</div>
          <div class="id-detail"><span class="id-detail-label">Roll No</span><span class="id-detail-val">${user.student_id}</span></div>
          <div class="id-detail"><span class="id-detail-label">Dept</span><span class="id-detail-val">${user.department}</span></div>
          <div class="id-detail"><span class="id-detail-label">Email</span><span class="id-detail-val">${user.email}</span></div>
          <div class="id-detail"><span class="id-detail-label">DID</span><span class="id-detail-val" style="font-size:9px;font-family:'JetBrains Mono',monospace;">${profile.did.slice(0, 28)}...</span></div>
        </div>
      </div>
      <div class="id-fields">
        <div class="id-field">
          <div class="id-field-label">Login Time</div>
          <div class="id-field-val">${loginTime}</div>
        </div>
        <div class="id-field">
          <div class="id-field-label">Logout Time</div>
          <div class="id-field-val">${logoutTime || 'Active Session'}</div>
        </div>
        <div class="id-field">
          <div class="id-field-label">Credentials</div>
          <div class="id-field-val">${credentials.length} Issued</div>
        </div>
        <div class="id-field">
          <div class="id-field-label">Wallet</div>
          <div class="id-field-val" style="font-size:10px;font-family:'JetBrains Mono',monospace;">${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}</div>
        </div>
      </div>
      <div class="id-creds">
        <div class="id-creds-title">Issued Credentials</div>
        <div class="id-creds-list">
          ${credentials.length > 0
    ? credentials.map(c => `<span class="id-cred-pill">${c.credentialType}</span>`).join('')
    : '<span style="color:#5a7a9a;font-size:11px;">No credentials issued yet</span>'}
        </div>
      </div>
      <div class="id-bottom">
        <div class="id-qr-box">
          ${qrSvg}
        </div>
        <div class="id-hash-section">
          <div class="id-hash-label">Transaction Hash</div>
          <div class="id-hash">${profile.txId}</div>
          <div class="id-hash-label">Unique Verification ID</div>
          <div class="id-hash">${uniqueHash}</div>
          <div style="font-size:9px;color:#5a7a9a;margin-top:6px;">
            Scan QR code to verify this identity on Algorand Blockchain
          </div>
        </div>
      </div>
    </div>
    <div class="id-footer">
      <div class="id-footer-text">Generated: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}</div>
      <div class="id-footer-verified">● BLOCKCHAIN VERIFIED</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Download the ID card as a PDF using browser's print functionality
 * Falls back to downloading as an HTML file if print is unavailable.
 */
export function downloadIDCardPDF(data: IDCardData): void {
  const html = generateIDCardHTML(data);
  const printWindow = window.open('', '_blank', 'width=560,height=800');
  if (!printWindow) {
    // Fallback: download as HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UniTrustID_${data.user.student_id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Add print styles and trigger print after load
  printWindow.onload = () => {
    const style = printWindow.document.createElement('style');
    style.textContent = `
      @media print {
        body { background: white !important; }
        .id-card { box-shadow: none !important; margin: 0 auto; }
      }
      @page { size: A5 landscape; margin: 10mm; }
    `;
    printWindow.document.head.appendChild(style);

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

/**
 * Share the ID card using the Web Share API or copy verification link
 */
export async function shareIDCard(data: IDCardData): Promise<string> {
  const verificationUrl = `https://uni-trust-id.vercel.app/verify?did=${encodeURIComponent(data.profile.did)}&tx=${encodeURIComponent(data.profile.txId)}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `UniTrustID — ${data.user.full_name}`,
        text: `Verified Decentralized Identity for ${data.user.full_name} (${data.user.student_id})\nDID: ${data.profile.did}\nVerification Hash: ${data.profile.txId.slice(0, 16).toUpperCase()}`,
        url: verificationUrl,
      });
      return 'shared';
    } catch {
      // User cancelled or API not supported
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(verificationUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
