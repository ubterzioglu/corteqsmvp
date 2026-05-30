import { useState } from "react";
import { MessageSquare, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PlatformMessageDialog, { RecipientKind } from "./PlatformMessageDialog";

interface Props {
  recipientKind: RecipientKind;
  recipientSlug: string;
  recipientName: string;
  recipientUserId?: string | null;
  defaultSubject?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  fullWidth?: boolean;
}

const PlatformMessageButton = ({
  recipientKind,
  recipientSlug,
  recipientName,
  recipientUserId,
  defaultSubject,
  variant = "default",
  size = "default",
  className = "",
  label = "Mesaj Gönder",
  fullWidth = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Giriş gerekli",
        description: "Mesaj göndermek için lütfen giriş yapın veya kayıt olun.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
        onClick={handleClick}
      >
        {user ? <MessageSquare className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {label}
      </Button>
      {user && (
        <PlatformMessageDialog
          open={open}
          onOpenChange={setOpen}
          recipientKind={recipientKind}
          recipientSlug={recipientSlug}
          recipientName={recipientName}
          recipientUserId={recipientUserId}
          defaultSubject={defaultSubject}
        />
      )}
    </>
  );
};

export default PlatformMessageButton;
