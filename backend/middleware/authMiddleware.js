import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {

const token = req.headers.authorization?.split(' ')[1];

console.log(token,'vdsdvdssdvvd');


  if (!token) {

   return res.json({
    status: false,
    statusCode: 401,
    message: "Unauthorized",
    error: "Request with No Token Again Login",
  });
  }
 
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.role = decoded.role
    req.userId = decoded.id;
    req.borker = decoded.borker;

    next();

  } catch (err) {

    return res.json({
    status: false,
    statusCode: 401,
    message: "Unauthorized",
    error: "Token invalid or expired",
  });

  }
};


const AdminAuthMiddleware = (req, res, next) => {
  
const token = req.headers.authorization?.split(' ')[1];

  if (!token) {

    return res.status(401).json({
    status: false,
    statusCode: 401,
    message: "Unauthorized",
    error: "Request with No Token Again Login",
  });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

     if(decoded.role==='admin') {

      req.AdminId = decoded.id

      next();

     }else{

      
      return res.json({
            status: false,
            statusCode:401,
            message:'Only Admin Access This Routes',
            error: null,
        });

     }
  } catch (err) {

   
   return res.status(401).json({
    status: false,
    statusCode: 401,
    message: "Unauthorized",
    error: "Token invalid or expired",
  });
    
  }
};

export  {authMiddleware,AdminAuthMiddleware};
