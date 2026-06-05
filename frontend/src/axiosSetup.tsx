import axios from "axios";

// optional: base URL set once
axios.defaults.baseURL = import.meta.env.VITE_API_URL 


// ✅ Global response interceptor
axios.interceptors.response.use(
  (res:any) => {

   if (res?.data?.statusCode === 401 && res?.data?.message === 'Unauthorized') {

          console.log(res.data,'========Unauthorized=========');
          

            // localStorage.removeItem("token");
            // localStorage.removeItem("user");
            // localStorage.removeItem("termsAccepted");
            // localStorage.removeItem("feed_token");
            // localStorage.removeItem("refresh_token");
            //  window.location.href = "/";
      
    } 
    return res;
  },
  (err:any) => {

    const data = err?.response?.data;

    console.log(data,'=========axios interceptor');
    
  
    if (data?.statusCode === 401 && data?.message === 'Unauthorized') {

      //       localStorage.removeItem("token");
      //       localStorage.removeItem("user");
      //       localStorage.removeItem("termsAccepted");
      //       localStorage.removeItem("feed_token");
      //       localStorage.removeItem("refresh_token");
      //        window.location.href = "/";
      //  return Promise.reject(err);
    } 
    else if(data==undefined) {

        console.log(data,'========undefined=========');

      //       localStorage.removeItem("token");
      //       localStorage.removeItem("user");
      //       localStorage.removeItem("termsAccepted");
      //       localStorage.removeItem("feed_token");
      //       localStorage.removeItem("refresh_token");
      //        window.location.href = "/";
      //  return Promise.reject(err);

    }
   
  }
);