import PageMeta from "../../components/common/PageMeta";

import SignUpForm from "../../components/auth/SignUpForm";

import { useEffect, useState } from "react";
import axios from "axios";

export default function SignUp() {

    const apiUrl = import.meta.env.VITE_API_URL;

    const [platformTitle, setPlatformTitle] = useState("");

useEffect(() => {

    const fetchTitle = async () => {
      try {
        const res = await axios.get(`${apiUrl}/admin/active/platform-settings`);
        console.log(res,'resresresres');
        

        if (res.data?.title) {
          setPlatformTitle(res.data.title);

          // ✅ Save to localStorage for next time
          localStorage.setItem("platformtitle", res.data.title);
        }
      } catch (err) {
        console.error("Failed to fetch platform title");
      }
    };

    const storedTitle = localStorage.getItem("platformtitle");

    if (storedTitle) {
      setPlatformTitle(storedTitle);
    } else {
      fetchTitle(); // 🔥 Only call API if not found
    }

  }, []);

  return (
    <>
      <PageMeta
        title={platformTitle}
        description={platformTitle}
      />
     
        <SignUpForm />
     
    </>
  );
}
