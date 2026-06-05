import { BrowserRouter as Router, Routes, Route } from "react-router";


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import VerifyCode from "./pages/AuthPages/VerifyCode";
import NewPassword from "./pages/AuthPages/NewPassword";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/Dashboard/Home";
import AllUser from "./pages/admin/AllUsers";
import UserReport from "./pages/admin/UserReport";
import Broker from "./pages/admin/Broker";
import Broadcast from "./pages/admin/Broadcast";
import ActivityLogs from "./pages/admin/ActivityLogs";
import LicenseReport from "./pages/admin/LicenseReport";
import ProtectedRoute from "./route/protectedRoute";
import ChangePassword from "./components/UserProfile/changePassword";


import InstrumentForm from "./pages/Forms/InstrumentForm";
import OrderTables from "./pages/Tables/OrderTables";
import DashboardMain from "./pages/Dashboard/DashboardMain";
import TradeTables from "./pages/Tables/TradeTables";
import AngelOneCredential from "./pages/Forms/AngelOneCredential";
import Home from "./pages/Dashboard/Home";
import InstrumentFormAdmin from "./pages/Forms/instrumentFormAdmin";
import AngelOrderTable from "./pages/Tables/AngelOrderTable";
import AngelTradeTable from "./pages/Tables/AngelTradeTable";
// import NIftyAndBankNifty from "./pages/Forms/NIftyAndBankNifty";
import UsersTables from "./pages/Tables/UsersTables";
import OrderTableAdmin from "./pages/Tables/OrderTableAdmin";
import TradeAdmin from "./pages/Tables/TradeAdmin";
import SupportPage from "./pages/Tables/SupportPage";
import BrokerSettings from "./pages/Tables/BrokerSettings";
import AssignStrategy from "./pages/Forms/AssignStrategy";
import BrokerPage from "./pages/Forms/BrokerPage";
import HoldingOrder from "./pages/Tables/HoldingOrder";
import HoldingOrderAdmin from "./pages/Tables/HoldingOrderAdmin";
import UserClone from "./pages/Forms/UserClone";
import OrdersAdminPage from "./pages/Forms/OrderAdminPage";
import KiteCrendential from "./pages/Forms/KiteCredential";
import Userposition from "./pages/Tables/UserPosition";
import FinavasiaCrendetial from "./pages/Forms/FinavasiaCredential";
import UserPnlAdmin from "./pages/Tables/UserPnlAdmin";
import RejectedHistory from "./pages/Tables/RejectedHistory";
import GrowwCrendetial from "./pages/Forms/growwCrendetial";
import AdminCheckUserPosition from "./pages/Tables/UserPositionTableAdmin";
import CandleChart from "./pages/Charts/CandleChart";
import AdminCheckUserDeshboard from "./pages/Dashboard/AdminCheckUserDeshboard";
import UserSession from "./pages/admin/UserSession";
import PlatformSettingsPage from "./pages/Forms/PlatformSettingsPage";
import { useEffect, useState } from "react";
import axios from "axios";
import UserSessionPageTable from "./pages/Tables/UserSessionTable";
import WatchList from "./pages/Forms/WatchList";
import FyersCrendential from "./pages/Forms/FyersCredential";
// import RiskConfigPage from "./pages/Forms/RiskConfig";
import KotakNeoCredential from "./pages/Forms/KotakNeoCredential";
import GithubSettings from "./pages/Tables/GithubSettings";
import RiskManagement from "./pages/Tables/RiskManagement";
import UserLayout from "./layout/UserLayout";

export default function App() {

 const API_URL = import.meta.env.VITE_API_URL;

 const [title, setTitle] = useState("Software Setu");


 console.log(title);
 

 useEffect(() => {
     
      const fetchLogo = async () => {
    try {

      console.log('hello !!');
      
       const res = await axios.get(`${API_URL}/admin/active/platform-settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

       console.log(res,'resresresres');

      const software_title = res?.data?.data?.software_title;
        const software_logo = res?.data?.data?.software_logo;

       
        
       localStorage.setItem("platformlogo", software_logo);
       localStorage.setItem("platformtitle", software_title);

      if (software_title) {
        setTitle(software_title);
        document.title = software_title
      }
    } catch (error) {
      console.error("Failed to fetch platform logo", error);
    }
  };

  // fetchLogo();

   const software_logo = localStorage.getItem("platformlogo");
   const software_title = localStorage.getItem("platformtitle");

    if (software_logo&&software_title) {
        setTitle(software_title);
        document.title = software_title
  } else {
    fetchLogo();
  }

  }, []);



  return (
    <>
          <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            {/* <Route index path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>} /> */}



            {/* user Routes  */}
{/* 
          <Route path="/new/deshboard" element={<ProtectedRoute><DashboardMain /></ProtectedRoute>} />
          <Route path="/userposition" element={<ProtectedRoute><Userposition /></ProtectedRoute>} />
          <Route path="/holding/order" element={<ProtectedRoute><HoldingOrder /></ProtectedRoute>} />
          <Route path="/order" element={<ProtectedRoute><OrderTables /></ProtectedRoute>} />
          <Route path="/user/usermanual" element={<ProtectedRoute><UserManual /></ProtectedRoute>} />
          <Route path="/user/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="/user/setting" element={<ProtectedRoute><BrokerSettings /></ProtectedRoute>} />
          <Route path="/user/marketdata" element={<ProtectedRoute><GooglChart /></ProtectedRoute>} /> */}


          <Route
  element={
    <ProtectedRoute>
      <UserLayout />
    </ProtectedRoute>
  }
>
  <Route path="/new/deshboard" element={<DashboardMain />} />
  <Route path="/userposition" element={<Userposition />} />
  <Route path="/holding/order" element={<HoldingOrder />} />
  <Route path="/order" element={<OrderTables />} />

  <Route path="/user/support" element={<SupportPage />} />
  <Route path="/user/setting" element={<BrokerSettings />} />

       <Route index path="/dashboard" element={<ProtectedRoute><DashboardMain /></ProtectedRoute>} />
</Route>

            {/*  user Routes end */}

       
            <Route path="/profile" element={<ProtectedRoute><UserProfiles /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/blank" element={<ProtectedRoute><Blank /></ProtectedRoute>} />
            <Route path="/form-elements" element={<ProtectedRoute><FormElements /></ProtectedRoute>} />
            <Route path="/basic-tables" element={<ProtectedRoute><BasicTables /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/avatars" element={<ProtectedRoute><Avatars /></ProtectedRoute>} />
            <Route path="/badge" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
            <Route path="/buttons" element={<ProtectedRoute><Buttons /></ProtectedRoute>} />
            <Route path="/images" element={<ProtectedRoute><Images /></ProtectedRoute>} />
            <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
            <Route path="/line-chart" element={<ProtectedRoute><LineChart /></ProtectedRoute>} />
            <Route path="/bar-chart" element={<ProtectedRoute><BarChart /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

            <Route
              path="/order-admin/:userId/:username/:broker"
              element={
                <ProtectedRoute>
                  <OrdersAdminPage />
                </ProtectedRoute>
              }
            />



            <Route path="/instrument" element={<ProtectedRoute><InstrumentForm /></ProtectedRoute>} />
           


            


 {/* <Route path="/instrument/niftyandbanknifty" element={<ProtectedRoute><NIftyAndBankNifty /></ProtectedRoute>} /> */}

         

  

           
            

              

             


           
         
            <Route path="/currentposition" element={<ProtectedRoute><TradeTables /></ProtectedRoute>} />
            <Route path="/angelonecredential" element={<ProtectedRoute><AngelOneCredential /></ProtectedRoute>} />
            <Route path="/kitecredential" element={<ProtectedRoute><KiteCrendential /></ProtectedRoute>} />

              <Route path="/fyerscredential" element={<ProtectedRoute><FyersCrendential /></ProtectedRoute>} />


              

                <Route path="/kotakcredential" element={<ProtectedRoute><KotakNeoCredential /></ProtectedRoute>} />

            <Route path="/finavasiacredential" element={<ProtectedRoute><FinavasiaCrendetial /></ProtectedRoute>} />
             <Route path="/growwcredential" element={<ProtectedRoute><GrowwCrendetial /></ProtectedRoute>} />


         
             <Route path="/admin/cehckuserposition" element={<ProtectedRoute><AdminCheckUserPosition /></ProtectedRoute>} />

            <Route path="/angel/order" element={<ProtectedRoute><AngelOrderTable /></ProtectedRoute>} />
            <Route path="/angel/trades" element={<ProtectedRoute><AngelTradeTable /></ProtectedRoute>} />
            <Route path="/admin/deshboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
           
            <Route path="/admin/usertable" element={<ProtectedRoute><UsersTables /></ProtectedRoute>} />
            <Route path="/admin/order" element={<ProtectedRoute><OrderTableAdmin /></ProtectedRoute>} />
            <Route path="/admin/strategy" element={<ProtectedRoute><AssignStrategy /></ProtectedRoute>} />
            <Route path="/admin/broker" element={<ProtectedRoute><BrokerPage /></ProtectedRoute>} />
            <Route path="/admin/holding/order" element={<ProtectedRoute><HoldingOrderAdmin /></ProtectedRoute>} />

            <Route path="/admin/platform" element={<ProtectedRoute><PlatformSettingsPage /></ProtectedRoute>} />

            <Route path="/admincheckuser/deshboard" element={<ProtectedRoute><AdminCheckUserDeshboard /></ProtectedRoute>} />




  <Route path="/admin/github" element={<ProtectedRoute><GithubSettings  /></ProtectedRoute>} />





                <Route path="/admin/rejected/history" element={<ProtectedRoute><RejectedHistory /></ProtectedRoute>} />


                


            {/*===================== admin ============================= */}




         {/* <Route path="/admin/riskconfig" element={<RiskConfigPage />} /> */}


           <Route path="/admin/riskconfig" element={<RiskManagement />} />




          <Route path="/admin/instrument" element={<ProtectedRoute><InstrumentFormAdmin /></ProtectedRoute>} />

            <Route path="/admin/watch" element={<ProtectedRoute><WatchList /></ProtectedRoute>} />

           {/* <Route path="/admin/order" element={<ProtectedRoute><OrderTables /></ProtectedRoute>} /> */}
            <Route path="/admin/trades" element={<ProtectedRoute><TradeAdmin /></ProtectedRoute>} />


 <Route path="/admin/check/userpnl" element={<ProtectedRoute><UserPnlAdmin /></ProtectedRoute>} />


            <Route path="/all-users" element={<ProtectedRoute><AllUser /></ProtectedRoute>} />
             <Route path="/admin/user-report" element={<ProtectedRoute><UserReport /></ProtectedRoute>} />

              <Route path="/admin/user-clone" element={<ProtectedRoute><UserClone /></ProtectedRoute>} />
              <Route path="/admin/user-session" element={<ProtectedRoute><UserSession /></ProtectedRoute>} />
                <Route path="/user/user-session" element={<ProtectedRoute><UserSessionPageTable /></ProtectedRoute>} />

              


            
            {/* <Route path="/user-reports" element={<ProtectedRoute><UserReport /></ProtectedRoute>} /> */}
            <Route path="/brokers" element={<ProtectedRoute><Broker /></ProtectedRoute>} />
            <Route path="/broadcast" element={<ProtectedRoute><Broadcast /></ProtectedRoute>} />
            <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
            <Route path="/license-report" element={<ProtectedRoute><LicenseReport /></ProtectedRoute>} />
           

          </Route>

          {/* Auth Layout */}
         
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/new-password" element={<NewPassword />} />
         
         
       

          {/* Auth Layout */}  


 <Route path="/admin/bankniftychart" element={<ProtectedRoute><CandleChart /></ProtectedRoute>} />

            
          
        
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </>
  );
}
