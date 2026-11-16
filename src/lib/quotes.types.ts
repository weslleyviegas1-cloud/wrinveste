export interface Quote {
  ticker: string;
  price: number;
  change: number;
  prevClose: number;
  currency: string;
  shortName?: string;
  longName?: string;
  lastDividend: number;
  monthlyDividend: number;
  yearlyDividend: number;
  dividendYield: number;
  /** Horário informado pelo provedor para a última negociação, quando disponível. */
  marketTime?: string;
  /** Horário em que o servidor consultou/obteve os dados. */
  updatedAt: string;
  source: string;
}

export interface QuotesResponse {
  quotes: Record<string, Quote>;
  fetchedAt: string;
}
