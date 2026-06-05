
import speakeasy from 'speakeasy';

export function generateTOTP(secret) {

  return speakeasy.totp({
    secret: secret,   
    encoding: 'base32',
    step: 30,           // 30-second window (standard)
    digits: 6,
    window: 1,          // tolerate slight clock drift
  });
}



/*

//  Manish sir 
secret: 'XMLYBBM7DFE6L4OGGZ2QBILQ4E',
"clientcode":"M162423",
"password":"8965",  


// Rishab 
secret: 'UYUNR7FY6DCD6IMQB2KDMUJS2Q',
"clientcode":"ARJMA1921",
"password":"7748",  
*/