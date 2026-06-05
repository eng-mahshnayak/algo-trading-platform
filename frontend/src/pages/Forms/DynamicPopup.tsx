// DynamicPopup.tsx
import React, { useEffect } from "react";
import "./DynamicPopup.css"; // CSS file import karna mat bhoolna

interface DynamicPopupProps {
  open: boolean;
  onClose: () => void;
  htmlContent: string;
}

const DynamicPopup: React.FC<DynamicPopupProps> = ({ open, onClose, htmlContent }) => {

  // ✅ Header Hide/Show - Ye code add karo
  useEffect(() => {
    const header = document.querySelector(".main-header") as HTMLElement;

    if (open) {
      if (header) {
        header.style.display = "none";
      }
    } else {
      if (header) {
        header.style.display = "flex";
      }
    }

    return () => {
      if (header) {
        header.style.display = "flex";
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="popup-overlay">
      <div className="dynamic-popup-container">
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        
        <button className="popup-close-bottom-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DynamicPopup;