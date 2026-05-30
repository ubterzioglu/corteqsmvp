import { useState } from "react";
import { ScanLine, Camera, Check, X, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRScannerMockProps {
  onScan?: (code: string) => void;
  couponCode?: string;
}

const QRScannerMock = ({ onScan, couponCode }: QRScannerMockProps) => {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const startScan = () => {
    setScanning(true);
    setScanned(false);
    setResult(null);

    setTimeout(() => {
      const code = couponCode || "HOSGELDIN15";
      setScanning(false);
      setScanned(true);
      setResult(code);
      onScan?.(code);
      toast({
        title: "Kupon Tarandı ✅",
        description: `${code} kuponu başarıyla işlendi.`,
      });
    }, 2500);
  };

  const reset = () => {
    setScanning(false);
    setScanned(false);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Scanner viewport */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-secondary mb-4">
        {!scanning && !scanned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <QrCode className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Taramaya hazır</p>
          </div>
        )}

        {scanning && (
          <>
            <div className="absolute inset-0 bg-secondary/90 flex items-center justify-center">
              <Camera className="h-20 w-20 text-muted-foreground/20" />
            </div>
            {/* Scan line animation */}
            <div className="absolute left-4 right-4 top-4 bottom-4 border-2 border-primary/40 rounded-lg">
              <div className="absolute left-0 right-0 h-0.5 bg-primary animate-bounce" style={{ animation: "scanLine 1.5s ease-in-out infinite" }} />
            </div>
            {/* Corner markers */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
            <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-primary font-medium">Taranıyor...</p>
          </>
        )}

        {scanned && result && (
          <div className="absolute inset-0 bg-success/10 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-sm font-bold text-foreground">{result}</p>
            <p className="text-xs text-success font-medium">Başarıyla tarandı!</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {!scanning && !scanned && (
        <Button onClick={startScan} className="gap-2">
          <ScanLine className="h-4 w-4" /> Kuponu Tara
        </Button>
      )}
      {scanning && (
        <Button variant="outline" onClick={reset} className="gap-2">
          <X className="h-4 w-4" /> İptal
        </Button>
      )}
      {scanned && (
        <Button variant="outline" onClick={reset} className="gap-2">
          <ScanLine className="h-4 w-4" /> Yeni Tarama
        </Button>
      )}

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
};

export default QRScannerMock;
