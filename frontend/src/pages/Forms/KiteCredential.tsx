import { FC, useState,useEffect } from "react";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import axios from "axios";
import { toast } from "react-toastify";


const KiteCrendential: FC = () => {

  const apiUrl = import.meta.env.VITE_API_URL;

  // 🔑 Form fields
  const [clientId, setClientId] = useState("");
  const [totpSecret, setTotpSecret] = useState("");

  const [pin, setPin] = useState("");
  const [apiKey, setApiKey] = useState("");


  // 👁️ Toggles
  const [showTotp, setShowTotp] = useState(false);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/kite/appcredential/get`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          AngelOneToken: localStorage.getItem("angel_token"),
        },
      });

      if (res.data.status) {
        setPin(res.data.data.pin);
        setApiKey(res.data.data.apiKey);
        setClientId(res.data.data.clientId);
        setTotpSecret(res.data.data.totpSecret);
      }
    } catch (err) {
      toast.error("Failed to load credentials");
    }
  };

  fetchData();
}, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
            let reqData = {
                clientId:clientId,
                totpSecret:totpSecret,
                apiKey:apiKey,
                pin:pin
                
            }

            let res = await axios.post(`${apiUrl}/kite/appcredential/create`, reqData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                        "AngelOneToken": localStorage.getItem("angel_token") || "",
                    },
             })

             if(res.data.status==true) {
              
              toast.success(res?.data?.message);
              setClientId("");
              setTotpSecret("");
              
                    
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
          Kite Credential
        </h2>

        <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" onSubmit={handleSubmit}>

         


          {/* Client Id */}
               <div>
            <Label
              htmlFor="client-id"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Kite Client Id  <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                name="client-id"
                id="client-id"
                placeholder="e.g. ABC123"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>

            {/* Pin */}
               <div>
            <Label
              htmlFor="pin"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Kite Password  <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                name="pin"
                id="pin"
                placeholder="e.g. *****"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>


          <div>
            <Label
              htmlFor="client-id"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Api Key  <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                name="client-id"
                id="client-id"
                placeholder="e.g. ABC123"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* TOTP Secret */}
          <div>
            <Label
              htmlFor="totp-secret"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Api Secret <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showTotp ? "text" : "password"}
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                name="totp-secret"
                id="totp-secret"
                placeholder="api secret from your Authenticator app"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              <span
                onClick={() => setShowTotp(!showTotp)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showTotp ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </span>
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

export default KiteCrendential;