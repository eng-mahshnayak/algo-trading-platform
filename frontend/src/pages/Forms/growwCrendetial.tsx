import { FC, useState,useEffect } from "react";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import axios from "axios";
import { toast } from "react-toastify";



const GrowwCrendetial: FC = () => {

  const apiUrl = import.meta.env.VITE_API_URL;

  const [token, setToken] = useState("");

  useEffect(() => {
  const fetchCredential = async () => {
    try {
      const res = await axios.get(
        `${apiUrl}/groww/appcredential/get`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      if (res.data.status === true && res.data.data?.authToken) {
        setToken(res.data.data.authToken);
      }
    } catch (error) {
      console.error("Failed to fetch groww token");
    }
  };

  fetchCredential();
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
            let reqData = {
                authToken:token, 
            }

            let res = await axios.post(`${apiUrl}/groww/appcredential/create`, reqData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                        "AngelOneToken": localStorage.getItem("angel_token") || "",
                    },
             })

           
             
             if(res.data.status==true) {
              
              toast.success(res?.data?.message);
              
               localStorage.setItem("angel_token", token || "");
              setToken("")
             }else{
              toast.error(res?.data?.message || "Something went wrong");
             
             }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="w-full p-6 bg-white rounded-lg shadow dark:border dark:bg-gray-800 dark:border-gray-700">
        <h2 className="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
          Groww Credential
        </h2>

        <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" onSubmit={handleSubmit}>

         


          {/* Client Id */}
               <div>
            <Label
              htmlFor="client-id"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Groww Token   <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                name="token"
                id="token"
                placeholder="eeyJraWQiOiJaTUtjVXciLCJh .........."
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 
              focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 
              text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            Save Credentials
          </Button>
        </form>
      </div>
    </section>
  );
};

export default GrowwCrendetial;