import { motion, AnimatePresence } from 'motion/react';

interface MobileOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function MobileOverlay({ open, onClose }: MobileOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black lg:hidden"
          id="mobile-overlay"
        />
      )}
    </AnimatePresence>
  );
}
