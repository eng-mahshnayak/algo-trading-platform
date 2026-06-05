import { useEffect, useState } from "react";
import AdminHome from "../Dashboard/Home";
import DashboardMain from "./DashboardMain";

export default function Layout() {
  
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
   
    if (storedUser) {
      try {
        const parsedUser = storedUser;
        setRole(parsedUser.role || null);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        setRole(null);
      }
    } else {
      setRole(null);
    }
  }, []);

  if (role === null) {
    return <div>Loading...</div>;
    //  <LineChart />
    //   <BarChart />
  }

  if (role === "admin") {
    return <AdminHome />;
  }

  if (role === "user") {
    return <DashboardMain/>
    // return <UserHome />;
  }

  return <div>Role not recognized</div>;
}
