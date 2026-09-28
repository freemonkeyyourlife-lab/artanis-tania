import React from "react";
import { Euro } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PaymentLinkForm from "@/components/pay/PaymentLinkForm";

export default function PaymentLinkDialog({ defaultAmount, defaultTitle, className }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          title="Geld anfordern"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full bg-elevated text-muted-foreground hover:text-primary transition-colors",
            className || "w-8 h-8"
          )}
        >
          <Euro className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <h3 className="font-display text-lg text-foreground mb-1">Geld anfordern</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Betrag und Zweck festlegen — du bekommst einen Link, den du direkt verschicken kannst.
        </p>
        <PaymentLinkForm defaultAmount={defaultAmount} defaultTitle={defaultTitle} />
      </DialogContent>
    </Dialog>
  );
}