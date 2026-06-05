

// =====================date and price subscription  code 

// import React, { useEffect, useState } from "react";
// import { Outlet, useLocation } from "react-router-dom";
// import UserPopup from "../pages/Forms/UserPopup";
// import axios from "axios";

// interface User {

//   showPopup?: boolean;
// }

// const UserLayout: React.FC = () => {

//  const apiUrl = import.meta.env.VITE_API_URL;

//   const [showPopup, setShowPopup] = useState(false);

//   const location = useLocation();



// useEffect(() => {
//   const getUserByIdAdminCheckUserDeshboard = async () => {
//     try {
//       const userString = localStorage.getItem("user");

//       if (!userString) return;

//       const user: any = JSON.parse(userString);

//       const response = await axios.get(
//         `${apiUrl}/users/withouttoken/getuser?userId=${user?.id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

     

//       // Backend se flag check
//       if (response?.data?.status === true) {

        


//          console.log(
//         response?.data?.data,
//         "=========response.data==========="
//       );

//         setShowPopup(response?.data?.data?.showPopup);
//       } else {
//         setShowPopup(false);
//       }

//     } catch (error) {
//       console.error("User parse error:", error);
//     }
//   };

//   getUserByIdAdminCheckUserDeshboard();

// }, [location.pathname]);

//   return (
//     <>
//       <UserPopup
//         open={showPopup}
//         onClose={() => setShowPopup(false)}
//       />

//       <Outlet />
//     </>
//   );
// };

// export default UserLayout;








// import React, { useEffect, useState } from "react";
// import { Outlet, useLocation } from "react-router-dom";
// import UserPopup from "../pages/Forms/UserPopup";
// import axios from "axios";







// =========running code======================



// const UserLayout: React.FC = () => {

//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [showPopup, setShowPopup] = useState(false);
//   const [userName, setUserName] = useState("User");
//   const [expiryDate, setExpiryDate] = useState("2024-12-31");

//   const location = useLocation();

//   useEffect(() => {
//     const getUserByIdAdminCheckUserDeshboard = async () => {
//       try {
//         const userString = localStorage.getItem("user");

//         if (!userString) return;

//         const user: any = JSON.parse(userString);

//         console.log(user, "========user============");

//         const response = await axios.get(
//           `${apiUrl}/users/withouttoken/getuser?userId=${user?.id}`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//           }
//         );

//         // Backend se flag check
//         if (response?.data?.status === true) {
//           console.log(
//             response?.data?.data?.showPopup,
//             "=========response.data==========="
//           );

//           setShowPopup(response?.data?.data?.showPopup);
          
//           // Set user name
//           const firstName = response?.data?.data?.firstName || "";
//           const lastName = response?.data?.data?.lastName || "";
//           const fullName = `${firstName} ${lastName}`.trim();
//           setUserName(fullName || "User");
          
//           // Set expiry date from packageDate
//           if (response?.data?.data?.packageDate) {
//             setExpiryDate(response.data.data.packageDate);
//           }
//         } else {
//           setShowPopup(false);
//         }

//       } catch (error) {
//         console.error("User parse error:", error);
//       }
//     };

//     getUserByIdAdminCheckUserDeshboard();

//   }, [location.pathname]);

//   return (
//     <>
//       <UserPopup
//         open={showPopup}
//         onClose={() => setShowPopup(false)}
//         userName={userName}
//         expiryDate={expiryDate}
//       />

//       <Outlet />
//     </>
//   );
// };

// export default UserLayout;





// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import DynamicPopup from "../pages/Forms/DynamicPopup";
// import { Outlet, useLocation } from "react-router-dom";

// const UserLayout: React.FC = () => {
//   const [showPopup, setShowPopup] = useState(false);
//   const [popupHTML, setPopupHTML] = useState("");

//     const apiUrl = import.meta.env.VITE_API_URL;

//       const location = useLocation();

//   useEffect(() => {
//     const fetchPopupHTML = async () => {
//       try {
//         const response = await axios.get(`${apiUrl}/users/get-popup-html`);
        
//         if (response.data.success && response.data.html) {
//           setPopupHTML(response.data.html);
//           setShowPopup(true);
//         }
//       } catch (error) {
//         console.error("Error fetching popup:", error);
//       }
//     };

//     fetchPopupHTML();
//   }, [location.pathname]);

//   return (
//     <>
//       <DynamicPopup 
//         open={showPopup} 
//         onClose={() => setShowPopup(false)}
//         htmlContent={popupHTML}
//       />
//       <Outlet />
//     </>
//   );
// };

// export default UserLayout;



import React, { useEffect, useState } from "react";
import axios from "axios";
import DynamicPopup from "../pages/Forms/DynamicPopup";
import { Outlet, useLocation } from "react-router-dom";

const UserLayout: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupHTML, setPopupHTML] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;
  const location = useLocation();

  useEffect(() => {
    const fetchPopupData = async () => {
      try {
        const userString = localStorage.getItem("user");

        if (!userString) return;

        const user: any = JSON.parse(userString);

        // 1. User data fetch karo
        const userResponse = await axios.get(
          `${apiUrl}/users/withouttoken/getuser?userId=${user?.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Backend flag check
        if (
          userResponse?.data?.status === true &&
          userResponse?.data?.data?.showPopup === true
        ) {
          // Popup enable hai to HTML fetch karo
          const popupResponse = await axios.get(
            `${apiUrl}/users/get-popup-html`,
            {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
          );

          if (
            popupResponse.data.success &&
            popupResponse.data.html
          ) {
            setPopupHTML(popupResponse.data.html);
            setShowPopup(true);
          }
        } else {
          // Popup disable
          setShowPopup(false);
        }
      } catch (error) {
        console.error("Error fetching popup:", error);
        setShowPopup(false);
      }
    };

    fetchPopupData();
  }, [location.pathname]);

  return (
    <>
      <DynamicPopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        htmlContent={popupHTML}
      />

      <Outlet />
    </>
  );
};

export default UserLayout;