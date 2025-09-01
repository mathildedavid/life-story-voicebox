import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EncouragementModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const EncouragementModal = ({ isOpen, onClose, message }: EncouragementModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center">
            Your Story Shines! ✨
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed mt-4 text-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Continue Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};