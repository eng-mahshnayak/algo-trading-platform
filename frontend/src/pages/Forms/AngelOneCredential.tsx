// import { FC, useState } from "react";
// import Input from "../../components/form/input/InputField";
// import Button from "../../components/ui/button/Button";
// import Label from "../../components/form/Label";
// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import axios from "axios";
// import { toast } from "react-toastify";

// const AngelOneCredential: FC = () => {

//     const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//     const [showNewPassword, setShowNewPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//     const [currentPassword, setCurrentPassword] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const apiUrl = import.meta.env.VITE_API_URL;

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         try {
//             const storedUser = localStorage.getItem("user");
//             if (!storedUser) {
//                 toast.error("user not logged in");
//                 return;
//             }

//             const { id } = JSON.parse(storedUser);

//             const res = await axios.put(`${apiUrl}/auth/update-password`, {
//                 id,
//                 currentPassword,
//                 newPassword,
//                 confirmPassword
//             })

//             toast.success(res.data.message);
//             setCurrentPassword("");
//             setNewPassword("");
//             setConfirmPassword("");
//         } catch (err: any) {
//             toast.error(err.response?.data?.message || "Something went wrong");
//         }
//     }

//     return (
//         <section className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
//             <div className="w-full p-6 bg-white rounded-lg shadow dark:border  dark:bg-gray-800 dark:border-gray-700">
//                 <h2 className="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white text-center">
//                   AngelOne Credential
//                 </h2>
//                 <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" action="#" onSubmit={handleSubmit}>
//                     <div>
//                         <Label
//                             htmlFor="current-password"
//                             className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
//                         >
//                            Client Id 
//                         </Label>
//                         <div className="relative">
//                             <Input
//                                 type={showCurrentPassword ? "text" : "password"}
//                                 value={currentPassword}
//                                 onChange={(e) => setCurrentPassword(e.target.value)}
//                                 name="current-password"
//                                 id="current-password"
                              
//                                 required
//                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
//                 focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
//                 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
//                 dark:focus:ring-blue-500 dark:focus:border-blue-500"
//                             />
//                             <span
//                                 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                                 className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
//                             >
//                                 {showCurrentPassword ? (
//                                     <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                                 ) : (
//                                     <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                                 )}
//                             </span>
//                         </div>
//                     </div>
//                     <div>
//                         <Label
//                             htmlFor="password"
//                             className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
//                         >
//                            TOTP Secret
//                         </Label>
//                         <div className="relative">
//                             <Input
//                                 type={showNewPassword ? "text" : "password"}
//                                 value={newPassword}
//                                 onChange={(e) => setNewPassword(e.target.value)}
//                                 name="password"
//                                 id="password"
                               
//                                 required
//                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
//                 focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
//                 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
//                 dark:focus:ring-blue-500 dark:focus:border-blue-500"
//                             />
//                             <span
//                                 onClick={() => setShowNewPassword(!showNewPassword)}
//                                 className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
//                             >
//                                 {showNewPassword ? (
//                                     <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                                 ) : (
//                                     <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                                 )}
//                             </span>
//                         </div>
//                     </div>

//                     {/* Confirm Password */}
//                     <div>
//                         <Label
//                             htmlFor="confirm-password"
//                             className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
//                         >
//                              password
//                         </Label>
//                         <div className="relative">
//                             <Input
//                                 type={showConfirmPassword ? "text" : "password"}
//                                 value={confirmPassword}
//                                 onChange={(e) => setConfirmPassword(e.target.value)}
//                                 name="confirm-password"
//                                 id="confirm-password"
                               
//                                 required
//                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
//                 focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
//                 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
//                 dark:focus:ring-blue-500 dark:focus:border-blue-500"
//                             />
//                             <span
//                                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                                 className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
//                             >
//                                 {showConfirmPassword ? (
//                                     <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                                 ) : (
//                                     <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                                 )}
//                             </span>
//                         </div>
//                     </div>
//                     <Button
//                         type="submit"
//                         className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 
//             focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 
//             text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
//                     >
//                         Reset password
//                     </Button>
//                 </form>
//             </div>
//         </section>
//     );
// };

// export default AngelOneCredential;


import { FC, useState,useEffect } from "react";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import axios from "axios";
import { toast } from "react-toastify";

const AngelOneCredential: FC = () => {

  const apiUrl = import.meta.env.VITE_API_URL;

  // 🔑 Form fields
  const [clientId, setClientId] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [password, setPassword] = useState("");
    const [apiKey, setApiKey] = useState("");

  // 👁️ Toggles
  const [showTotp, setShowTotp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/angelone/credential/get`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          AngelOneToken: localStorage.getItem("angel_token"),
        },
      });

      

      if (res.data.status) {

        setClientId(res?.data?.data?.clientId||"");
        setTotpSecret(res?.data?.data?.totpSecret||"")
        setPassword(res?.data?.data?.password||"");
        setApiKey(res?.data?.data?.apiKey||"")
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
                password:password,
                apiKey:apiKey
            }

            let res = await axios.post(`${apiUrl}/angelone/credential/create`, reqData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                        "AngelOneToken": localStorage.getItem("angel_token") || "",
                    },
             })

             if(res.data.status==true) {
              
              toast.success(res?.data?.message);
              // setClientId("");
              // setTotpSecret("");
              // setPassword("");
                    
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
          AngelOne Credential
        </h2>

        <form className="mt-4 space-y-4 lg:mt-5 md:space-y-5" onSubmit={handleSubmit}>
          {/* Client Id */}
          <div>
            <Label
              htmlFor="client-id"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Client Id <span className="text-error-500">*</span>
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

          {/* TOTP Secret */}
          <div>
            <Label
              htmlFor="totp-secret"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              TOTP Secret <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showTotp ? "text" : "password"}
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                name="totp-secret"
                id="totp-secret"
                placeholder="Base32 secret from your Authenticator app"
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

            {/* Client Id */}
          <div>
            <Label
              htmlFor="apiKey"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              ApiKey  <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                name="apiKey"
                id="apiKey"
                placeholder="ABC123"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label
              htmlFor="ao-password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="ao-password"
                id="ao-password"
                placeholder="Angel One account password"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                  dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
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

export default AngelOneCredential;

