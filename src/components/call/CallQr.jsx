import React from "react";
import { QRCodeSVG } from "qrcode.react";

// QR in einer weißen Fläche — nur so ist er auf dem dunklen Hintergrund sicher scannbar.
export default function CallQr({ value, size = 168 }) {
  return (
    <div className="bg-white p-3 rounded-2xl w-fit mx-auto">
      <QRCodeSVG value={value} size={size} level="M" />
    </div>
  );
}