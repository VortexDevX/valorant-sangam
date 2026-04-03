"use client";
import type { BracketRecord } from "@/types/bracket";
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

export async function downloadRenderedBracketPng(
  bracket: BracketRecord,
  filename: string,
) {
  const roundCount = bracket.rounds.length;
  const firstRoundMatches = Math.max(bracket.rounds[0]?.matches.length ?? 1, 1);
  const columnWidth = 300;
  const columnGap = 90;
  const boxWidth = 290;
  const boxHeight = 124;
  const topOffset = 250;
  const leftOffset = 72;
  const baseGap = 36;
  const firstRoundHeight = firstRoundMatches * boxHeight + (firstRoundMatches - 1) * baseGap;
  const exportWidth = Math.max(
    1440,
    leftOffset * 2 + roundCount * boxWidth + (roundCount - 1) * columnGap + 64,
  );
  const exportHeight = Math.max(980, topOffset + firstRoundHeight + 100);
  const canvas = document.createElement("canvas");
  canvas.width = exportWidth * 2;
  canvas.height = exportHeight * 2;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas rendering is not available in this browser.");
  }

  context.scale(2, 2);

  const base = context.createLinearGradient(0, 0, exportWidth, exportHeight);
  base.addColorStop(0, "#07111a");
  base.addColorStop(0.55, "#0d1721");
  base.addColorStop(1, "#09111a");
  context.fillStyle = base;
  context.fillRect(0, 0, exportWidth, exportHeight);

  context.strokeStyle = "rgba(255,255,255,0.035)";
  context.lineWidth = 1;
  for (let x = 48; x < exportWidth; x += 104) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, exportHeight);
    context.stroke();
  }
  for (let y = 40; y < exportHeight; y += 104) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(exportWidth, y);
    context.stroke();
  }

  context.fillStyle = "#ff4655";
  context.fillRect(0, 0, exportWidth, 10);
  context.strokeStyle = "rgba(255,243,224,0.12)";
  context.strokeRect(36, 36, exportWidth - 72, exportHeight - 72);

  drawBrand(context);
  context.fillStyle = "#f6efe7";
  context.font = "700 54px Teko, sans-serif";
  context.fillText(bracket.title.toUpperCase(), 120, 168);
  context.fillStyle = "rgba(255,243,224,0.76)";
  context.font = "600 22px Barlow, sans-serif";
  context.fillText(
    `${bracket.status.replaceAll("_", " ")} | ${bracket.teamCount} teams | ${bracket.format.toUpperCase()}`,
    120,
    206,
  );

  context.strokeStyle = "rgba(255,243,224,0.1)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(120, 226);
  context.lineTo(exportWidth - 120, 226);
  context.stroke();

  const roundCenters: number[][] = [];
  const firstCenters = Array.from({ length: firstRoundMatches }, (_, index) =>
    topOffset + index * (boxHeight + baseGap) + boxHeight / 2,
  );
  roundCenters.push(firstCenters);

  for (let roundIndex = 1; roundIndex < roundCount; roundIndex += 1) {
    const previous = roundCenters[roundIndex - 1];
    const current = Array.from({ length: Math.ceil(previous.length / 2) }, (_, index) => {
      const top = previous[index * 2];
      const bottom = previous[index * 2 + 1] ?? top;
      return (top + bottom) / 2;
    });
    roundCenters.push(current);
  }

  context.strokeStyle = "rgba(255,179,178,0.24)";
  context.lineWidth = 3;

  for (let roundIndex = 1; roundIndex < roundCount; roundIndex += 1) {
    const previous = roundCenters[roundIndex - 1];
    const current = roundCenters[roundIndex];
    const previousX = leftOffset + (roundIndex - 1) * (columnWidth + columnGap) + boxWidth;
    const currentX = leftOffset + roundIndex * (columnWidth + columnGap);
    const elbowX = previousX + columnGap / 2;

    current.forEach((centerY, matchIndex) => {
      const topY = previous[matchIndex * 2];
      const bottomY = previous[matchIndex * 2 + 1] ?? topY;

      context.beginPath();
      context.moveTo(previousX, topY);
      context.lineTo(elbowX, topY);
      context.lineTo(elbowX, bottomY);
      context.lineTo(previousX, bottomY);
      context.stroke();

      context.beginPath();
      context.moveTo(elbowX, centerY);
      context.lineTo(currentX, centerY);
      context.stroke();
    });
  }

  bracket.rounds.forEach((round, roundIndex) => {
    const x = leftOffset + roundIndex * (columnWidth + columnGap);
    const labelWidth = boxWidth;
    const labelHeight = 46;
    context.fillStyle = "rgba(107,22,29,0.86)";
    context.fillRect(x, topOffset - 88, labelWidth, labelHeight);
    context.fillStyle = "#fff0f0";
    context.font = "700 28px Teko, sans-serif";
    context.textAlign = "center";
    context.fillText(round.label, x + labelWidth / 2, topOffset - 58);

    round.matches.forEach((match, matchIndex) => {
      const centerY = roundCenters[roundIndex][matchIndex];
      const y = centerY - boxHeight / 2;
      const rowHeight = 48;
      const rowGap = 12;
      const headerHeight = 28;

      context.textAlign = "start";
      context.fillStyle = "rgba(18,28,39,0.95)";
      context.fillRect(x, y, boxWidth, boxHeight);
      context.strokeStyle = "rgba(255,243,224,0.1)";
      context.lineWidth = 2;
      context.strokeRect(x, y, boxWidth, boxHeight);

      context.fillStyle = "#fff0f0";
      context.font = "700 18px Teko, sans-serif";
      context.fillText(`MATCH ${match.match}`, x + 18, y + 22);

      const rows = [
        { slot: match.top, winner: match.winnerSeed === match.top?.seed },
        { slot: match.bottom, winner: match.winnerSeed === match.bottom?.seed },
      ];

      rows.forEach((row, rowIndex) => {
        const rowY = y + headerHeight + rowIndex * (rowHeight + rowGap);
        context.fillStyle = row.winner
          ? "rgba(122,26,36,0.95)"
          : "rgba(21,33,44,0.98)";
        context.fillRect(x + 12, rowY, boxWidth - 24, rowHeight);
        context.strokeStyle = row.winner
          ? "rgba(255,179,178,0.42)"
          : "rgba(255,243,224,0.08)";
        context.strokeRect(x + 12, rowY, boxWidth - 24, rowHeight);

        context.fillStyle = "rgba(255,243,224,0.8)";
        context.font = "700 13px Teko, sans-serif";
        context.textAlign = "center";
        context.fillText(
          row.slot?.isBye
            ? "BYE"
            : row.slot?.seed
              ? `SEED ${row.slot.seed}`
              : "PENDING",
          x + boxWidth / 2,
          rowY + 16,
        );

        context.fillStyle = "#f6efe7";
        context.font = "700 22px Teko, sans-serif";
        context.fillText(
          (row.slot?.name || "TBD").toUpperCase(),
          x + boxWidth / 2,
          rowY + 36,
        );

        context.textAlign = "start";
        context.fillStyle = row.winner ? "#fff4ef" : "#c9d4df";
        context.font = "700 16px Teko, sans-serif";
        context.fillText(row.winner ? "W" : "-", x + boxWidth - 30, rowY + 29);
      });
    });
  });

  downloadCanvas(canvas, filename);
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

export function downloadBracketCard(
  bracket: BracketRecord,
  variant: "summary" | "champion" = "summary",
) {
  const { canvas, context } = createCanvas();
  drawBackground(context, "#b79a6a", "rgba(183,154,106,0.22)");
  drawBrand(context);
  drawEyebrow(context, variant === "champion" ? "Tournament Champion" : "Bracket Summary", 120, 214, "#ffe0ab");

  context.strokeStyle = "rgba(255,243,224,0.1)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(120, 250);
  context.lineTo(1480, 250);
  context.stroke();

  context.fillStyle = "rgba(255,255,255,0.04)";
  context.fillRect(92, 310, 1416, 420);
  context.strokeStyle = "rgba(255,243,224,0.12)";
  context.strokeRect(92, 310, 1416, 420);

  context.textAlign = "center";
  context.fillStyle = "rgba(255,243,224,0.76)";
  context.font = "600 34px Barlow, sans-serif";
  context.fillText(
    variant === "champion" ? "Official tournament winner" : "Completed single-elimination bracket",
    WIDTH / 2,
    380,
  );

  context.fillStyle = "#f6efe7";
  context.font = "700 80px Teko, sans-serif";
  context.textAlign = "center";
  context.fillText(bracket.title.toUpperCase(), WIDTH / 2, 458);

  context.fillStyle = "#ffe9c0";
  context.font = "700 118px Teko, sans-serif";
  context.fillText((bracket.championName ?? "TBD").toUpperCase(), WIDTH / 2, 592);

  context.fillStyle = "rgba(255,243,224,0.8)";
  context.font = "500 30px Barlow, sans-serif";
  context.fillText(
    variant === "champion"
      ? "Official bracket champion"
      : `${bracket.rounds.length} rounds completed through single elimination`,
    WIDTH / 2,
    646,
  );

  context.textAlign = "start";
  drawChips(
    context,
    [
      `${bracket.teamCount} teams`,
      bracket.format,
      bracket.status.replaceAll("_", " "),
    ],
    120,
    778,
    "#ffe0ab",
  );

  downloadCanvas(
    canvas,
    `${sanitizeFileName(bracket.title) || "bracket"}-${variant}.png`,
  );
}
