

// ✅ Store array of user tokens in the session
export const setTokensInSession = (req, userTokens = []) => {

  if (!Array.isArray(userTokens)) {

    throw new Error("userTokens must be an array");

  }

  req.session.userTokens = userTokens;

  req.session.save((err) => {
    if (err) {
      console.error("❌ Session save failed:", err);
    } else {
      console.log("✅ Session saved successfully!");
      console.log("Session ID:", req.sessionID);
      console.log("Stored tokens:", req.session.userTokens);
    }
  });

};



// ✅ Get tokens by user IDs from the session
export const getManyTokensFromSession = (req) => {

  const allTokens = req.session.userTokens || [];

  return allTokens;
};