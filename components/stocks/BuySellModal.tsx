"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

interface BuySellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "buy" | "sell";
  symbol: string;
  name: string;
  currentPrice: number;
  cashBalance: number;
  heldQuantity: number;
  apiEndpoint?: string;
}

export function BuySellModal({
  open,
  onOpenChange,
  mode,
  symbol,
  name,
  currentPrice,
  cashBalance,
  heldQuantity,
  apiEndpoint,
}: BuySellModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const total = currentPrice * quantity;
  const maxBuy = Math.floor(cashBalance / currentPrice);
  const canConfirm =
    quantity > 0 && (mode === "buy" ? quantity <= maxBuy : quantity <= heldQuantity);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const endpoint = apiEndpoint || `/api/portfolio/${mode}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          quantity,
          type: mode,
          stockSymbol: symbol,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          `${mode === "buy" ? "Bought" : "Sold"} ${quantity} shares of ${symbol}`
        );
        onOpenChange(false);
      } else {
        toast.error(json.error || "Transaction failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-emerald-800/40 bg-emerald-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === "buy" ? "Buy" : "Sell"} {symbol}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {name} &middot; {formatINR(currentPrice)} per share
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/30 p-3 text-sm">
            {mode === "buy" ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Cash Balance</span>
                <span className="font-mono text-foreground">
                  {formatINR(cashBalance)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <span>Held Quantity</span>
                <span className="font-mono text-foreground">{heldQuantity}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 border-emerald-800/30"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="flex-1 rounded-lg border border-emerald-800/30 bg-emerald-900/30 px-3 py-2 text-center font-mono text-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                min={1}
                max={mode === "buy" ? maxBuy : heldQuantity}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 border-emerald-800/30"
                disabled={
                  mode === "buy"
                    ? quantity >= maxBuy
                    : quantity >= heldQuantity
                }
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(
                      mode === "buy" ? maxBuy : heldQuantity,
                      q + 1
                    )
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-800/40 bg-emerald-900/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {mode === "buy" ? "Total Cost" : "Total Proceeds"}
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatINR(total)}
              </span>
            </div>
            {mode === "buy" && maxBuy < quantity && (
              <p className="mt-1 text-xs text-red-400">
                Insufficient balance. Max {maxBuy} shares.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-emerald-800/30 text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={
              mode === "buy"
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "bg-red-500 text-white hover:bg-red-400"
            }
          >
            {loading
              ? "Processing..."
              : `${mode === "buy" ? "Buy" : "Sell"} ${quantity} shares`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
