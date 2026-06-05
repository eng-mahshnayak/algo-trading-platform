// import React from "react";
// import "./UserPopup.css";

// interface UserPopupProps {
//   open: boolean;
//   onClose: () => void;
// }

// const UserPopup: React.FC<UserPopupProps> = ({ open, onClose }) => {
//   if (!open) return null;

//   return (
//     <div className="popup-overlay">
//       <div className="popup-box">
//         <button className="popup-close-btn" onClick={onClose}>
//           ✕
//         </button>

//         <div className="popup-content">
//           <h2>📢 Important Update</h2>

//           <p>
//             Welcome back. Please review the latest updates before continuing.
//           </p>

//           <button className="popup-action-btn" onClick={onClose}>
//             Continue
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserPopup;





// =====================date and price subscription  code 


// import React from "react";
// import "./UserPopup.css";

// interface UserPopupProps {
//   open: boolean;
//   onClose: () => void;
//   userName?: string;
//   expiryDate?: string;
// }

// const UserPopup: React.FC<UserPopupProps> = ({ open, onClose, userName = "User", expiryDate = "2024-12-31" }) => {
//   if (!open) return null;

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   return (
//     <div className="popup-overlay">
//       <div className="popup-box">
//         <button className="popup-close-btn" onClick={onClose}>
//           ✕
//         </button>

//         <div className="popup-content">
//           <div className="popup-icon">⚠️</div>
          
//           <h2>Subscription Renewal Required!</h2>
          
//           <p className="popup-message">
//             Dear <strong>{userName}</strong>, your trading subscription is expiring soon.
//           </p>

//           <div className="subscription-details">
//             <div className="detail-row">
//               <span className="detail-label">📅 Expiry Date:</span>
//               <span className="detail-value">{formatDate(expiryDate)}</span>
//             </div>
//             <div className="detail-row">
//               <span className="detail-label">💎 Current Plan:</span>
//               <span className="detail-value">Premium Trading Pack</span>
//             </div>
//           </div>

//           <div className="renewal-plans">
//             <div className="plan-card">
//               <div className="plan-name">Monthly</div>
//               <div className="plan-price">₹999<span className="plan-duration">/month</span></div>
//               <div className="plan-features">Real-time data + Analytics</div>
//             </div>
//             <div className="plan-card recommended">
//               <div className="plan-badge">🔥 BEST VALUE</div>
//               <div className="plan-name">Yearly</div>
//               <div className="plan-price">₹9,999<span className="plan-duration">/year</span></div>
//               <div className="plan-features">Save 16% + Priority support</div>
//             </div>
//           </div>

//           <div className="popup-buttons">
//             <button className="popup-renew-btn" onClick={onClose}>
//               🔄 Renew Now
//             </button>
//             <button className="popup-later-btn" onClick={onClose}>
//               Remind Me Later
//             </button>
//           </div>

//           <p className="popup-footer-text">
//             Don't worry! You can continue using basic features after expiry.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserPopup;



// ================without subscription price page==============

// import React from "react";
// import "./UserPopup.css";

// interface UserPopupProps {
//   open: boolean;
//   onClose: () => void;
//   userName?: string;
//   expiryDate?: string;
// }

// const UserPopup: React.FC<UserPopupProps> = ({ open, onClose, userName = "User", expiryDate = "2024-12-31" }) => {
//   if (!open) return null;

//   const formatDate = (date: string) => {
//     const d = new Date(date);
//     return d.toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   return (
//     <div className="popup-overlay">
//       <div className="popup-box">
//         <button className="popup-close-btn" onClick={onClose}>
//           ✕
//         </button>

//         <div className="popup-content">
//           <div className="popup-icon">⚠️</div>
          
//           <h2>Subscription Renewal Required!</h2>
          
//           <p className="popup-message">
//             Dear <strong>{userName}</strong>, your trading subscription is expiring soon.
//           </p>

//           <div className="subscription-details">
//             <div className="detail-row">
//               <span className="detail-label">📅 Expiry Date:</span>
//               <span className="detail-value">{formatDate(expiryDate)}</span>
//             </div>
//             <div className="detail-row">
//               <span className="detail-label">💎 Current Plan:</span>
//               <span className="detail-value">Premium Trading Pack</span>
//             </div>
//           </div>

//           <div className="popup-buttons">
//             <button className="popup-renew-btn" onClick={onClose}>
//               🔄 Renew Now
//             </button>
//             <button className="popup-later-btn" onClick={onClose}>
//               Remind Me Later
//             </button>
//           </div>

//           <p className="popup-footer-text">
//             Don't worry! You can continue using basic features after expiry.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserPopup;











// import React from "react";
// import "./UserPopup.css";

// interface UserPopupProps {
//   open: boolean;
//   onClose: () => void;
//   userName?: string;
//   expiryDate?: string;
// }

// const UserPopup: React.FC<UserPopupProps> = ({ open, onClose, userName = "User", expiryDate = "2024-12-31" }) => {
//   if (!open) return null;

//   const formatDate = (date: string) => {
//     const d = new Date(date);
//     return d.toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   return (
//     <div className="popup-overlay">
//       <div className="popup-box">
//         {/* X button - top right */}
//         <button className="popup-close-btn" onClick={onClose} aria-label="Close">
//           ✕
//         </button>

//         <div className="popup-content">
//           <div className="popup-icon">⚠️</div>
          
//           <h2>Subscription Renewal Required!</h2>
          
//           <p className="popup-message">
//             Dear <strong>{userName}</strong>, your trading subscription is expiring soon.
//           </p>

//           <div className="subscription-details">
//             <div className="detail-row">
//               <span className="detail-label">📅 Expiry Date:</span>
//               <span className="detail-value">{formatDate(expiryDate)}</span>
//             </div>
//             <div className="detail-row">
//               <span className="detail-label">💎 Current Plan:</span>
//               <span className="detail-value">Premium Trading Pack</span>
//             </div>
//           </div>

//           <div className="popup-buttons">
//             <button className="popup-renew-btn" onClick={onClose}>
//               🔄 Renew Now
//             </button>
//             <button className="popup-later-btn" onClick={onClose}>
//               Remind Me Later
//             </button>
//           </div>

//           {/* ✅ NEW - Close button */}
//           <button className="popup-close-bottom-btn" onClick={onClose}>
//             Close
//           </button>

//           <p className="popup-footer-text">
//             Don't worry! You can continue using basic features after expiry.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserPopup;







import React, { useEffect } from "react";
import "./UserPopup.css";

interface UserPopupProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  expiryDate?: string;
}

const UserPopup: React.FC<UserPopupProps> = ({
  open,
  onClose,
  userName = "User",
  expiryDate = "2024-12-31",
}) => {

  // ✅ Header Hide / Show
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

  const formatDate = (date: string) => {
    const d = new Date(date);

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="popup-overlay">
      <div className="popup-box">

        {/* X Button */}
        <button
          className="popup-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="popup-content">

          <div className="popup-icon">⚠️</div>

          <h2>Subscription Renewal Required!</h2>

          <p className="popup-message">
            Dear <strong>{userName}</strong>, your trading subscription is
            expiring soon.
          </p>

          <div className="subscription-details">

            <div className="detail-row">
              <span className="detail-label">
                📅 Expiry Date:
              </span>

              <span className="detail-value">
                {formatDate(expiryDate)}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">
                💎 Current Plan:
              </span>

              <span className="detail-value">
                Premium Trading Pack
              </span>
            </div>

          </div>

          <div className="popup-buttons">

            <button
              className="popup-renew-btn"
              onClick={onClose}
            >
              🔄 Renew Now
            </button>

            <button
              className="popup-later-btn"
              onClick={onClose}
            >
              Remind Me Later
            </button>

          </div>

          {/* Bottom Close Button */}
          <button
            className="popup-close-bottom-btn"
            onClick={onClose}
          >
            Close
          </button>

          <p className="popup-footer-text">
            Don't worry! You can continue using basic features after expiry.
          </p>

        </div>
      </div>
    </div>
  );
};

export default UserPopup;