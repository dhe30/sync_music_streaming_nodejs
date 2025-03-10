import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    // Try to extract token from cookies 
        // if token doesn't exist, return status 401
    // Verify that the JWT is valid, decode and set req.user 
        // else return return status 401
    const token = req.cookies.jwt
    if (!token) {
        res.status(401).json({ message: "invalid token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch {
        res.status(403).json({ message: "unauthorized"});
    }  
}