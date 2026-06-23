import { useState, useEffect } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import {  useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import axios from "axios";

export default function UserDropdown() {

  const API_URL = import.meta.env.VITE_API_URL;

  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("User");
    const [userNameId, setUserNameId] = useState("User");
  const [userEmail, setUserEmail] = useState("user@example.com");

    const [broker, setBroker] = useState("");

   
 console.log(broker);
 

  
  const navigate = useNavigate();



  

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {



      try {
        const parsedUser = JSON.parse(storedUser); 
        setBroker(parsedUser.brokerName)
        setUserNameId(parsedUser.username || "User");
        setUserEmail(parsedUser.email || "user@example.com");
        // setUserRole(parsedUser.role || "U");
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
      }
    }
    
    // ✅ Call API after fetching local data
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/getuser/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // optional
          },
        });

         let resData = response.data

         if(resData.status==true){

           let UserNameDb = resData.data.firstName+' '+resData.data.lastName

           setUserName(resData.data.username);
          //  setUserPackageName(resData.data.packageName)
          //  setUserPackageDate(resData.data.packageDate)
           setUserNameId( UserNameDb);

         }else{
           toast.error("Something went wrong");
         }
        
      } catch (error) {
         toast.error("Something went wrong");
       
      }
    };

    fetchUserData(); // call function

  }, []);

  // const userInitial =
  //   userRole?.trim()?.length > 0 ? userRole.trim()[0].toUpperCase() : "U";

  //   console.log(userInitial);
    

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }


  

  async function handleSignOut() {

      try {

        let token = localStorage.getItem("token")

         if(token) {

           const response = await axios.get(`${API_URL}/users/logout`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // optional
          },
        });

         let resData = response.data

         if(resData.status==true){

              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("termsAccepted");
              localStorage.removeItem("angel_feed_token");
              localStorage.removeItem("angel_refresh_token");
              localStorage.removeItem("angel_token");
               localStorage.removeItem("userID");
                localStorage.removeItem("platformlogo");
                localStorage.removeItem("platformtitle");
              

              navigate("/");

         }else{

          toast.error("Error fetching user data");

           localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("termsAccepted");
              localStorage.removeItem("angel_feed_token");
              localStorage.removeItem("angel_refresh_token");
              localStorage.removeItem("angel_token");
               localStorage.removeItem("userID");
                localStorage.removeItem("platformlogo");
                localStorage.removeItem("platformtitle");
                  navigate("/");
         
         }

         }else{
          navigate("/");
         }
       
        
      } catch (error) {

        toast.error("Error fetching user data");
        
      }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
       

        <span className="block mr-1 font-medium text-theme-sm">{userNameId}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {userName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {userEmail}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Edit profile
            </DropdownItem>
          </li>
          

         
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/change-password"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Change Password
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
