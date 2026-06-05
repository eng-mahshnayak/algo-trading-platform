
import AngelOneCredentialer from '../models/angelOneCredential.js';
import User from '../models/userModel.js';



export const getAngelOneCredential = async (req, res) => {
    try {

    const  userId  = req.userId

     if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "userId is required in params.",
        data: null,
      });
    }

    const credential = await AngelOneCredentialer.findOne({ where: { userId: userId } });

     const userData = await User.findOne({ where: { id: userId } });

     // convert to plain object
const credentialData = credential.toJSON();

     credentialData.apiKey = userData.kite_key

    if (!credentialData) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "AngelOne credentials retrieved successfully.",
      data: credentialData,
    });
   
    } catch (error) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};


export const createAngelOneCredential = async (req, res) => {
    try {

        const {  clientId, totpSecret, password ,apiKey} = req.body;


          console.log(req.userId,'==============existing 191========================');
        

        // Validation
            if ( !clientId || !totpSecret || !password) {

              console.log(req.userId,'==============existing 151========================');

            return res.json({
                status: false,
                statusCode: 400,
                message: "All fields (clientId, totpSecret, password) are required.",
                data: null,
            });
            }
   
             console.log(req.userId,'==============req.userId========================');

        let existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });

        console.log(existing,'==============existing========================');

        if (existing) {
      
       existing.clientId = clientId;
      existing.totpSecret = totpSecret;
      existing.password = password; // ⚠️ consider hashing
      await existing.save();

         let userData = await User.findOne({ where: { id: req.userId } });

          console.log('==============existing 121========================');

         userData.kite_key = apiKey

         userData.save()

          console.log('==============existing 131========================');

      return res.json({
        status: true,
        statusCode: 200,
        message: "AngelOne credentials updated successfully.",
        data: existing,
      });
      }else{


 // ✅ CREATE (ye missing tha)
      const newCredential = await AngelOneCredentialer.create({
        userId: req.userId,
        clientId,
        totpSecret,
        password,
      });

      let userData = await User.findOne({ where: { id: req.userId } });
      if (userData) {
        userData.kite_key = apiKey;
        await userData.save();
      }

      return res.json({
        status: true,
        statusCode: 201,
        message: "AngelOne credentials created successfully.",
        data: newCredential,
      });


      }

        
    } catch (error) {

      console.log(error);
      
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};