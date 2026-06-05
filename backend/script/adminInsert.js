import User from '../models/userModel.js';
import GithubSetting from '../models/GithubSetting.js';

import { encrypt } from '../utils/passwordUtils.js';
import { generateRandomNumbers } from '../utils/randomWords.js';



async function generateUniqueUsername() {
  let username;
  let isUnique = false;

  while (!isUnique) {
    username = await generateRandomNumbers(5); // e.g., "48371"

    const existingUser = await User.findOne({
      where: { username: username },
    });

    if (!existingUser) {
      isUnique = true; // ✅ unique username found
    }
  }

  return username;
}


export async function seedAdmin() {
  try {

     const username = await generateUniqueUsername();

    const obj = {
    firstName:"admin",
    lastName:"admin",
    email:"admin@gmail.com",
    username:username,
    phoneNumber:9999999999,
    password:"Admin@1234",
    role:"admin"
      
    } 

  
    const existing = await User.findOne({
      where: { email: obj.email },
    });

    const passwordHash = await encrypt(obj.password, process.env.CRYPTO_SECRET);
  
    obj.password = passwordHash

    if (!existing) {
        
      await User.create(obj);

      console.log('Admin user created:');

    } else {
      
      console.log('🔁 Admin Credential Already Created:');
    }

  } catch (err) {

    console.error(' Seed admin failed:', err.message);
    
  }
}




