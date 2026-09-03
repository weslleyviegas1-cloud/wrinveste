import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  tickers: z
    .array(z.string().min(3).max(8).regex(/^[A-Z0-9]+$/))
    .min(1)
    .max(600),
});

export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const { fetchQuotes } = await import("./quotes.server");
    return fetchQuotes(data.tickers);
  });

