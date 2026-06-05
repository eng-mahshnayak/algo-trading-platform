import crypto from "crypto";




// Encryption function
export function encrypt(text, password) {

    try {
        
    // Generate a random initialization vector (IV)
    const iv = crypto.randomBytes(16);

    // Create a cipher using AES-256-CBC
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        crypto.scryptSync(password, 'salt', 32), // Derive a 32-byte key from the password
        iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;

    } catch (error) {
        
    }

}

// console.log(encrypt('Manish@1234',process.env.CRYPTO_SECRET));



// Decryption function
export function decrypt(encryptedText, password) {

    try{

        // Split IV and encrypted data
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');

    // Create a decipher using AES-256-CBC
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        crypto.scryptSync(password, 'salt', 32), // Derive the same key
        iv
    );

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;

    }catch(error) {

        throw error

    }

    

}


// console.log(decrypt('c2afc06e73249c7ea4a9d53f2be9c0df:662d9f9695a605a520933c37ff5fc5e9',process.env.CRYPTO_SECRET));


