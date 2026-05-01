export type FIIType = "papel" | "tijolo" | "hibrido";

export interface FII {
  ticker: string;
  name: string;
  type: FIIType;
  price: number;
  dividendYield: number; // anual %
  lastDividend: number; // por cota / mês
  score: number; // 0-10
  consistency: number; // 0-10
  volatility: number; // 0-10 (menor = melhor)
  segment: string;
}

// Dados mockados — preços/yields aproximados, fins ilustrativos
export const FIIS: FII[] = [
  { ticker: "MXRF11", name: "Maxi Renda", type: "papel", price: 10.32, dividendYield: 11.8, lastDividend: 0.10, score: 8.6, consistency: 9.2, volatility: 3.0, segment: "Recebíveis" },
  { ticker: "HGLG11", name: "CSHG Logística", type: "tijolo", price: 162.40, dividendYield: 8.4, lastDividend: 1.15, score: 9.1, consistency: 9.5, volatility: 3.5, segment: "Logística" },
  { ticker: "VISC11", name: "Vinci Shopping Centers", type: "tijolo", price: 109.20, dividendYield: 8.9, lastDividend: 0.82, score: 8.4, consistency: 8.6, volatility: 4.2, segment: "Shoppings" },
  { ticker: "KNRI11", name: "Kinea Renda Imobiliária", type: "hibrido", price: 158.10, dividendYield: 8.1, lastDividend: 1.10, score: 9.0, consistency: 9.4, volatility: 3.1, segment: "Híbrido" },
  { ticker: "BCFF11", name: "BTG Pactual Fundo de Fundos", type: "hibrido", price: 73.50, dividendYield: 9.6, lastDividend: 0.60, score: 7.9, consistency: 8.0, volatility: 4.5, segment: "FoF" },
  { ticker: "XPML11", name: "XP Malls", type: "tijolo", price: 105.80, dividendYield: 9.2, lastDividend: 0.84, score: 8.5, consistency: 8.7, volatility: 4.0, segment: "Shoppings" },
  { ticker: "HGRE11", name: "CSHG Real Estate", type: "tijolo", price: 132.40, dividendYield: 7.8, lastDividend: 0.90, score: 8.2, consistency: 8.9, volatility: 3.6, segment: "Lajes Corp." },
  { ticker: "BTLG11", name: "BTG Pactual Logística", type: "tijolo", price: 102.10, dividendYield: 8.6, lastDividend: 0.76, score: 8.8, consistency: 9.0, volatility: 3.4, segment: "Logística" },
  { ticker: "RECR11", name: "REC Recebíveis Imobiliários", type: "papel", price: 88.30, dividendYield: 13.2, lastDividend: 0.98, score: 8.3, consistency: 8.6, volatility: 4.4, segment: "Recebíveis" },
  { ticker: "KNCR11", name: "Kinea Rendimentos", type: "papel", price: 102.50, dividendYield: 11.6, lastDividend: 1.05, score: 8.9, consistency: 9.3, volatility: 2.8, segment: "Recebíveis" },
  { ticker: "HGCR11", name: "CSHG Recebíveis", type: "papel", price: 99.40, dividendYield: 11.2, lastDividend: 0.95, score: 8.7, consistency: 9.1, volatility: 3.0, segment: "Recebíveis" },
  { ticker: "VGHF11", name: "Valora Hedge Fund", type: "papel", price: 8.20, dividendYield: 13.8, lastDividend: 0.10, score: 7.6, consistency: 7.8, volatility: 5.2, segment: "Recebíveis" },
  { ticker: "MCCI11", name: "Mauá Capital Recebíveis", type: "papel", price: 95.60, dividendYield: 12.1, lastDividend: 0.96, score: 8.4, consistency: 8.7, volatility: 3.4, segment: "Recebíveis" },
  { ticker: "RBRR11", name: "RBR Rendimento High Grade", type: "papel", price: 88.20, dividendYield: 11.5, lastDividend: 0.86, score: 8.1, consistency: 8.5, volatility: 3.5, segment: "Recebíveis" },
  { ticker: "VINO11", name: "Vinci Offices", type: "tijolo", price: 56.80, dividendYield: 9.4, lastDividend: 0.45, score: 7.8, consistency: 8.0, volatility: 4.6, segment: "Lajes Corp." },
  { ticker: "RBRP11", name: "RBR Properties", type: "tijolo", price: 64.90, dividendYield: 8.7, lastDividend: 0.47, score: 7.5, consistency: 7.7, volatility: 4.8, segment: "Híbrido" },
  { ticker: "HFOF11", name: "Hedge Top FOFII 3", type: "hibrido", price: 68.40, dividendYield: 9.8, lastDividend: 0.56, score: 7.9, consistency: 8.2, volatility: 4.3, segment: "FoF" },
  { ticker: "ALZR11", name: "Alianza Trust Renda", type: "tijolo", price: 109.30, dividendYield: 8.0, lastDividend: 0.73, score: 8.3, consistency: 8.8, volatility: 3.7, segment: "Renda Urbana" },
  { ticker: "JSRE11", name: "JS Real Estate", type: "tijolo", price: 67.20, dividendYield: 8.3, lastDividend: 0.46, score: 7.7, consistency: 8.0, volatility: 4.4, segment: "Lajes Corp." },
  { ticker: "HSML11", name: "HSI Malls", type: "tijolo", price: 84.10, dividendYield: 9.1, lastDividend: 0.64, score: 8.2, consistency: 8.4, volatility: 4.1, segment: "Shoppings" },
  { ticker: "VRTA11", name: "Fator Verita", type: "papel", price: 91.30, dividendYield: 11.0, lastDividend: 0.83, score: 8.0, consistency: 8.4, volatility: 3.6, segment: "Recebíveis" },
  { ticker: "TGAR11", name: "TG Ativo Real", type: "hibrido", price: 121.80, dividendYield: 12.4, lastDividend: 1.26, score: 8.6, consistency: 8.7, volatility: 4.2, segment: "Desenv." },
  { ticker: "GGRC11", name: "GGR Covepi Renda", type: "tijolo", price: 109.50, dividendYield: 8.5, lastDividend: 0.78, score: 8.4, consistency: 9.0, volatility: 3.3, segment: "Logística" },
  { ticker: "VILG11", name: "Vinci Logística", type: "tijolo", price: 92.80, dividendYield: 8.9, lastDividend: 0.69, score: 8.3, consistency: 8.6, volatility: 3.8, segment: "Logística" },
  { ticker: "URPR11", name: "Urca Prime Renda", type: "papel", price: 78.40, dividendYield: 13.5, lastDividend: 0.88, score: 7.8, consistency: 7.9, volatility: 5.0, segment: "Recebíveis" },
  { ticker: "DEVA11", name: "Devant Recebíveis", type: "papel", price: 62.30, dividendYield: 13.0, lastDividend: 0.68, score: 7.4, consistency: 7.6, volatility: 5.4, segment: "Recebíveis" },
  { ticker: "PVBI11", name: "VBI Prime Properties", type: "tijolo", price: 86.20, dividendYield: 8.8, lastDividend: 0.63, score: 8.0, consistency: 8.3, volatility: 4.0, segment: "Lajes Corp." },
  { ticker: "RBRF11", name: "RBR Alpha Multiestratégia", type: "hibrido", price: 64.10, dividendYield: 9.4, lastDividend: 0.50, score: 7.7, consistency: 8.1, volatility: 4.4, segment: "FoF" },
  { ticker: "IRDM11", name: "Iridium Recebíveis", type: "papel", price: 78.80, dividendYield: 12.6, lastDividend: 0.83, score: 8.2, consistency: 8.5, volatility: 3.9, segment: "Recebíveis" },
  { ticker: "HGRU11", name: "CSHG Renda Urbana", type: "tijolo", price: 124.30, dividendYield: 8.2, lastDividend: 0.85, score: 8.7, consistency: 9.1, volatility: 3.2, segment: "Renda Urbana" },
];

export function getFII(ticker: string): FII | undefined {
  return FIIS.find((f) => f.ticker === ticker.toUpperCase());
}

export const TYPE_LABEL: Record<FIIType, string> = {
  papel: "Papel",
  tijolo: "Tijolo",
  hibrido: "Híbrido",
};
