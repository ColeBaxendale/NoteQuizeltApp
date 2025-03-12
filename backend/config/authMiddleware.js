const jwt = require('jsonwebtoken');
require('dotenv').config();


const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Retrieve token from cookies

    if (!token) {
        return res.status(401).json({ message: "Access Denied: No Token Provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or Expired Token" });
        }

        req.user = decoded; // Store user info (userId) in request object
        next(); // Proceed to the next middleware/controller
    });
};

module.exports = authenticateToken;