"use client";
import type { SeriesRecord } from "@/types/series";

const WIDTH = 1600;
const HEIGHT = 900;

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas rendering is not available in this browser.");
  }

  return { canvas, context };
}

function drawBackground(
  context: CanvasRenderingContext2D,
  accent: string,
  accentSoft: string,
) {
  const base = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  base.addColorStop(0, "#07111a");
  base.addColorStop(0.55, "#0d1721");
  base.addColorStop(1, "#09111a");
  context.fillStyle = base;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = context.createRadialGradient(WIDTH * 0.72, HEIGHT * 0.12, 40, WIDTH * 0.72, HEIGHT * 0.12, 680);
  glow.addColorStop(0, accentSoft);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.strokeStyle = "rgba(255,255,255,0.04)";
  context.lineWidth = 1;

  for (let x = 72; x < WIDTH; x += 104) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, HEIGHT);
    context.stroke();
  }

  for (let y = 56; y < HEIGHT; y += 104) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WIDTH, y);
    context.stroke();
  }

  context.fillStyle = accent;
  context.fillRect(0, 0, WIDTH, 12);

  context.strokeStyle = "rgba(255,243,224,0.12)";
  context.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);
}

function drawBrand(context: CanvasRenderingContext2D) {
  context.fillStyle = "#ff4655";
  context.save();
  context.translate(120, 118);
  context.rotate(Math.PI / 4);
  context.fillRect(-10, -10, 20, 20);
  context.restore();

  context.fillStyle = "#fff0e8";
  context.font = "700 42px Teko, sans-serif";
  context.fillText("VALORANT SANGAM", 154, 132);
}

function drawEyebrow(context: CanvasRenderingContext2D, label: string, x: number, y: number, color = "#ffb2a8") {
  context.fillStyle = color;
  context.font = "700 26px Teko, sans-serif";
  context.fillText(label.toUpperCase(), x, y);
}

function drawChips(
  context: CanvasRenderingContext2D,
  chips: string[],
  x: number,
  y: number,
  accent: string,
) {
  let cursorX = x;

  for (const chip of chips) {
    const width = Math.max(150, chip.length * 17 + 44);
    context.fillStyle = "rgba(13,20,30,0.96)";
    context.strokeStyle = "rgba(255,243,224,0.14)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(cursorX, y);
    context.lineTo(cursorX + width - 14, y);
    context.lineTo(cursorX + width, y + 14);
    context.lineTo(cursorX + width, y + 54);
    context.lineTo(cursorX + 10, y + 54);
    context.lineTo(cursorX, y + 44);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = accent;
    context.font = "700 24px Teko, sans-serif";
    context.fillText(chip.toUpperCase(), cursorX + 22, y + 35);
    cursorX += width + 18;
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

export function downloadSeriesResultCard(series: SeriesRecord) {
  const { canvas, context } = createCanvas();
  drawBackground(context, "#ff4655", "rgba(255,70,85,0.22)");
  drawBrand(context);
  drawEyebrow(context, series.status === "completed" ? "Final Result" : "Series Snapshot", 120, 214);

  context.fillStyle = "#f6efe7";
  context.font = "700 118px Teko, sans-serif";
  context.fillText(series.teamA.toUpperCase(), 120, 360);
  context.fillText("VS", WIDTH / 2 - 45, 498);
  context.fillText(series.teamB.toUpperCase(), 120, 520);

  drawChips(
    context,
    [
      series.format,
      `${series.overallScore.teamA}-${series.overallScore.teamB}`,
      series.status.replaceAll("_", " "),
    ],
    120,
    590,
    "#ffb2a8",
  );

  context.fillStyle = "rgba(255,243,224,0.78)";
  context.font = "500 32px Barlow, sans-serif";
  context.fillText(
    series.bracket
      ? `${series.bracket.title} | Round ${series.bracket.round} Match ${series.bracket.match}`
      : "Manual series",
    120,
    706,
  );

  const winner =
    series.overallScore.winner === "teamA"
      ? series.teamA
      : series.overallScore.winner === "teamB"
        ? series.teamB
        : "TBD";

  context.fillStyle = "#68d2ae";
  context.font = "700 42px Teko, sans-serif";
  context.fillText(`Winner: ${winner.toUpperCase()}`, 120, 778);

  context.fillStyle = "rgba(255,255,255,0.05)";
  context.fillRect(980, 170, 470, 560);
  context.strokeStyle = "rgba(255,243,224,0.12)";
  context.strokeRect(980, 170, 470, 560);

  context.fillStyle = "#ffb2a8";
  context.font = "700 28px Teko, sans-serif";
  context.fillText("MAP LOG", 1018, 220);

  const maps = series.results.length > 0 ? series.results : [];

  maps.slice(0, 5).forEach((entry, index) => {
    const y = 290 + index * 94;
    context.fillStyle = "rgba(10,16,23,0.92)";
    context.fillRect(1018, y - 34, 396, 72);

    context.fillStyle = "#f6efe7";
    context.font = "700 34px Teko, sans-serif";
    context.fillText(`MAP ${entry.order} | ${entry.map.toUpperCase()}`, 1042, y);

    context.fillStyle = "rgba(255,243,224,0.78)";
    context.font = "500 26px Barlow, sans-serif";
    context.fillText(entry.score, 1286, y);
  });

  downloadCanvas(
    canvas,
    `${sanitizeFileName(`${series.teamA}-vs-${series.teamB}`) || "series"}-result.png`,
  );
}
