/**
 * Utility to render a crisp, high-resolution digital booking pass ticket
 * directly onto an HTML5 canvas and trigger downloading/sharing to photos.
 */

export interface BookingPassData {
  shopName: string;
  shopAddress: string;
  shopCity: string;
  cancellationCode: string;
  serviceName: string;
  staffName: string;
  startAt: string;
  paymentStatus: string;
  price?: number;
  qrDataUrl: string;
}

function drawRoundedRect(
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

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

export async function renderPassCardToCanvas(
  data: BookingPassData
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const width = 800;
  const height = 1140;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context");
  }

  // Background - clean neutral container with subtle outer border
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // Outer pass card (white, rounded)
  const cardMargin = 28;
  const cardX = cardMargin;
  const cardY = cardMargin;
  const cardW = width - cardMargin * 2;
  const cardH = height - cardMargin * 2;
  const cardRadius = 32;

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.restore();

  // Card stroke
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // Top Brand Strip
  ctx.save();
  ctx.beginPath();
  // Clip top of card for header background
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.clip();

  ctx.fillStyle = "#111827";
  ctx.fillRect(cardX, cardY, cardW, 110);

  // Brand Name Pill
  ctx.fillStyle = "#ff385c";
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("GXSTYL PASS", cardX + 36, cardY + 44);

  // Top Shop Name inside dark header
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const shopTitle = truncateText(ctx, data.shopName, cardW - 180);
  ctx.fillText(shopTitle, cardX + 36, cardY + 84);

  // City badge top right
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  drawRoundedRect(ctx, cardX + cardW - 130, cardY + 54, 94, 30, 15);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(data.shopCity || "Ghana", cardX + cardW - 83, cardY + 74);
  ctx.textAlign = "left";

  ctx.restore();

  // Pass Reference & Payment Status Section
  const refY = cardY + 155;
  ctx.fillStyle = "#64748b";
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("BOOKING REFERENCE", cardX + 36, refY);

  ctx.fillStyle = "#ff385c";
  ctx.font = 'bold 32px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(`#${data.cancellationCode}`, cardX + 36, refY + 36);

  // Payment status badge
  let statusText = "Pay at Shop";
  let statusBg = "#f1f5f9";
  let statusFg = "#334155";
  if (data.paymentStatus === "paid") {
    statusText = "Paid in Full";
    statusBg = "#dcfce7";
    statusFg = "#15803d";
  } else if (data.paymentStatus === "deposit_paid") {
    statusText = "Deposit Paid";
    statusBg = "#e0f2fe";
    statusFg = "#0369a1";
  }

  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const badgeWidth = ctx.measureText(statusText).width + 24;
  const badgeX = cardX + cardW - 36 - badgeWidth;
  const badgeY = refY + 10;

  ctx.fillStyle = statusBg;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 32, 16);
  ctx.fill();

  ctx.fillStyle = statusFg;
  ctx.fillText(statusText, badgeX + 12, badgeY + 21);

  // Thin separator
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 36, refY + 60);
  ctx.lineTo(cardX + cardW - 36, refY + 60);
  ctx.stroke();

  // Details Grid (2 columns x 2 rows)
  const col1X = cardX + 36;
  const col2X = cardX + (cardW / 2) + 12;
  const row1Y = refY + 95;
  const row2Y = refY + 175;
  const colWidth = (cardW / 2) - 48;

  // Row 1: Service & Barber
  ctx.fillStyle = "#64748b";
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("SERVICE", col1X, row1Y);
  ctx.fillText("BARBER", col2X, row1Y);

  ctx.fillStyle = "#0f172a";
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const serviceStr = truncateText(ctx, data.serviceName, colWidth);
  ctx.fillText(serviceStr, col1X, row1Y + 26);

  const barberStr = truncateText(ctx, data.staffName, colWidth);
  ctx.fillText(barberStr, col2X, row1Y + 26);

  // Row 2: Date & Time, and Location
  ctx.fillStyle = "#64748b";
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("DATE & TIME", col1X, row2Y);
  ctx.fillText("LOCATION", col2X, row2Y);

  // Format date nicely
  let dateStr = data.startAt;
  try {
    const d = new Date(data.startAt);
    if (!isNaN(d.getTime())) {
      dateStr = `${d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
  } catch {
    // fallback
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(truncateText(ctx, dateStr, colWidth), col1X, row2Y + 26);

  const locStr = truncateText(ctx, data.shopAddress || data.shopCity, colWidth);
  ctx.fillText(locStr, col2X, row2Y + 26);

  // Ticket Perforation Section
  const perfY = row2Y + 68;
  const notchRadius = 18;

  // Left notch
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(cardX, perfY, notchRadius, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();

  // Right notch
  ctx.beginPath();
  ctx.arc(cardX + cardW, perfY, notchRadius, Math.PI / 2, -Math.PI / 2);
  ctx.fill();
  ctx.stroke();

  // Dashed line across
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + notchRadius + 6, perfY);
  ctx.lineTo(cardX + cardW - notchRadius - 6, perfY);
  ctx.stroke();
  ctx.restore();

  // QR Code Box
  const qrSectionY = perfY + 36;
  const qrBoxSize = 300;
  const qrBoxX = cardX + (cardW - qrBoxSize) / 2;

  // Rounded container for QR code
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, qrBoxX, qrSectionY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Load and draw QR code image
  if (data.qrDataUrl) {
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = data.qrDataUrl;
    });

    const qrInnerPadding = 16;
    ctx.drawImage(
      qrImg,
      qrBoxX + qrInnerPadding,
      qrSectionY + qrInnerPadding,
      qrBoxSize - qrInnerPadding * 2,
      qrBoxSize - qrInnerPadding * 2
    );
  }

  // Instruction under QR Code
  ctx.textAlign = "center";
  ctx.fillStyle = "#1e293b";
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("Show this pass to your barber upon arrival", width / 2, qrSectionY + qrBoxSize + 40);

  ctx.fillStyle = "#64748b";
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    "Works 100% offline • Keep saved in your phone gallery",
    width / 2,
    qrSectionY + qrBoxSize + 66
  );

  // Bottom Footer Bar
  ctx.fillStyle = "#94a3b8";
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("Official GxStyl Check-in Pass • gxstyl.vercel.app", width / 2, cardY + cardH - 24);
  ctx.textAlign = "left";

  return canvas;
}

/**
 * Downloads or shares the generated pass canvas as a PNG file.
 * Returns true if successful.
 */
export async function savePassImageToDevice(
  canvas: HTMLCanvasElement,
  code: string
): Promise<boolean> {
  const filename = `GxStyl-Pass-${code}.png`;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      const file = new File([blob], filename, { type: "image/png" });

      // Check if native mobile sharing with files is supported (iOS Safari, Android Chrome)
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `GxStyl Booking Pass #${code}`,
            text: `Here is my GxStyl booking pass #${code}. Show this upon arrival.`,
          });
          resolve(true);
          return;
        } catch (shareErr: unknown) {
          // If user aborted / cancelled dialog, still count as interaction or proceed to fallback
          if (shareErr instanceof Error && shareErr.name === "AbortError") {
            resolve(true);
            return;
          }
          // Fall through to programmatic file download
        }
      }

      // Fallback: direct anchor download
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        resolve(true);
      } catch (e) {
        console.error("Failed to trigger pass download:", e);
        resolve(false);
      }
    }, "image/png");
  });
}
