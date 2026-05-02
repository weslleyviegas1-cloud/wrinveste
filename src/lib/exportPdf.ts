import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { brl, pct, num } from "@/lib/format";

export interface PdfPosition {
  ticker: string;
  name: string;
  segment: string;
  shares: number;
  avgPrice: number;
  price: number;
  invested: number;
  current: number;
  monthlyDividend: number;
  yearlyDividend: number;
  profit: number;
  profitPct: number;
  weight: number;
  live: boolean;
  received: number;
  monthsHeld: number;
  totalReturn: number;
  totalReturnPct: number;
}

export interface PdfTotals {
  invested: number;
  current: number;
  monthly: number;
  yearly: number;
  profit: number;
  profitPct: number;
  yieldOnCost: number;
  received: number;
}

// Paleta WR Investe
const C = {
  bg: [13, 17, 23] as [number, number, number],
  card: [22, 27, 34] as [number, number, number],
  primary: [0, 230, 118] as [number, number, number],
  accent: [41, 121, 255] as [number, number, number],
  text: [245, 247, 250] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  danger: [239, 83, 80] as [number, number, number],
  border: [40, 48, 60] as [number, number, number],
};

export function exportPortfolioPdf(positions: PdfPosition[], totals: PdfTotals) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, H, "F");

  // Glow blobs (decorativos)
  doc.setFillColor(0, 230, 118);
  doc.circle(W - 40, 40, 90, "F");
  doc.setFillColor(41, 121, 255);
  doc.circle(60, H - 60, 110, "F");
  // Camada escura por cima dos glows para ficarem suaves
  doc.setFillColor(13, 17, 23);
  doc.setGState(doc.GState({ opacity: 0.85 }));
  doc.rect(0, 0, W, H, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // HEADER
  doc.setFillColor(...C.primary);
  doc.roundedRect(40, 40, 36, 36, 10, 10, "F");
  doc.setTextColor(13, 17, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("WR", 58, 64, { align: "center" });

  doc.setTextColor(...C.text);
  doc.setFontSize(20);
  doc.text("WR Investe", 90, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.muted);
  doc.text("Relatório de Carteira · Fundos Imobiliários", 90, 76);

  const now = new Date();
  const dateStr = now.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  doc.setFontSize(9);
  doc.text(dateStr, W - 40, 60, { align: "right" });

  // HERO — patrimônio
  const heroY = 100;
  doc.setFillColor(...C.card);
  doc.roundedRect(40, heroY, W - 80, 110, 14, 14, "F");
  // borda
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(40, heroY, W - 80, 110, 14, 14, "S");

  doc.setTextColor(...C.muted);
  doc.setFontSize(9);
  doc.text("PATRIMÔNIO ATUAL", 60, heroY + 24);

  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(brl(totals.current), 60, heroY + 56);

  const profitColor = totals.profit >= 0 ? C.primary : C.danger;
  doc.setFontSize(11);
  doc.setTextColor(...profitColor);
  doc.text(
    `${totals.profit >= 0 ? "▲" : "▼"} ${brl(Math.abs(totals.profit))} (${pct(totals.profitPct)})`,
    60,
    heroY + 76
  );
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Investido: ${brl(totals.invested)}`, 60, heroY + 92);

  // KPIs (4 mini-cards à direita)
  const kpis = [
    { label: "Renda mensal", value: brl(totals.monthly), color: C.primary },
    { label: "Renda anual", value: brl(totals.yearly), color: C.primary },
    { label: "Yield on Cost", value: pct(totals.yieldOnCost), color: C.accent },
    { label: "Fundos", value: String(positions.length), color: C.accent },
  ];
  const kpiX = W / 2 + 10;
  const kpiW = (W - 80 - (W / 2 - 40 + 10 - 40)) / 2 - 6;
  const kpiH = 44;
  kpis.forEach((k, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = kpiX + col * (kpiW + 8);
    const y = heroY + 18 + row * (kpiH + 8);
    doc.setFillColor(30, 36, 46);
    doc.roundedRect(x, y, kpiW, kpiH, 8, 8, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text(k.label.toUpperCase(), x + 10, y + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...k.color);
    doc.text(k.value, x + 10, y + 32);
    doc.setFont("helvetica", "normal");
  });

  // TABELA
  const tableStartY = heroY + 130;
  doc.setTextColor(...C.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Composição da Carteira", 40, tableStartY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text("Cotações ao vivo via Yahoo Finance", W - 40, tableStartY, { align: "right" });

  const rows = positions.map((p) => [
    p.ticker,
    p.segment,
    num(p.shares, 2),
    brl(p.avgPrice),
    brl(p.price) + (p.live ? "  •" : ""),
    brl(p.invested),
    brl(p.current),
    `${p.profit >= 0 ? "+" : ""}${pct(p.profitPct)}`,
    brl(p.monthlyDividend),
    pct(p.weight, 1),
  ]);

  autoTable(doc, {
    startY: tableStartY + 10,
    head: [["Ticker", "Segmento", "Cotas", "P. médio", "Atual", "Investido", "Valor", "Result.", "DY/mês", "Peso"]],
    body: rows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: C.text,
      cellPadding: { top: 7, right: 6, bottom: 7, left: 6 },
      lineColor: C.border,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [30, 36, 46],
      textColor: C.muted,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    bodyStyles: { fillColor: C.card },
    alternateRowStyles: { fillColor: [26, 32, 41] },
    columnStyles: {
      0: { fontStyle: "bold", textColor: C.primary },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right", textColor: C.primary },
      9: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        const txt = String(data.cell.raw ?? "");
        if (txt.startsWith("-")) data.cell.styles.textColor = C.danger;
        else data.cell.styles.textColor = C.primary;
      }
    },
    margin: { left: 40, right: 40 },
  });

  // Rodapé com totais
  const finalY = (doc as any).lastAutoTable.finalY + 16;
  if (finalY < H - 60) {
    doc.setFillColor(...C.card);
    doc.roundedRect(40, finalY, W - 80, 36, 8, 8, "F");
    doc.setTextColor(...C.muted);
    doc.setFontSize(8);
    doc.text("TOTAL INVESTIDO", 56, finalY + 14);
    doc.text("PATRIMÔNIO", 200, finalY + 14);
    doc.text("RESULTADO", 340, finalY + 14);
    doc.text("RENDA / MÊS", 470, finalY + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.text);
    doc.text(brl(totals.invested), 56, finalY + 28);
    doc.text(brl(totals.current), 200, finalY + 28);
    doc.setTextColor(...(totals.profit >= 0 ? C.primary : C.danger));
    doc.text(`${brl(totals.profit)} (${pct(totals.profitPct)})`, 340, finalY + 28);
    doc.setTextColor(...C.primary);
    doc.text(brl(totals.monthly), 470, finalY + 28);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(
    "Valores estimados com base em cotações em tempo real e dividendos dos últimos 12 meses. Não constitui recomendação de investimento.",
    W / 2,
    H - 30,
    { align: "center", maxWidth: W - 80 }
  );
  doc.text("WR Investe · wrinveste.lovable.app", W / 2, H - 18, { align: "center" });

  const filename = `wr-investe-relatorio-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
