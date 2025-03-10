import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../db/queries.js";
import 'dotenv/config';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
}

router.post("/register", async (req, res)=> {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(`
        INSERT INTO users (username, password) VALUES ($1, $2)
        ON CONFLICT DO NOTHING 
        RETURNING id
    `, [username, hashed]);
    
    if (result.rowCount === 0) {
        res.status(400).json({ message: "username already taken"});
        return;
    }

    const token = generateToken(result.rows[0].id);
    res.cookie("jwt", token, { httpOnly: true, secure: true, sameSite: "strict" });
    res.json({ token: token, username: username});
});

router.post("/login", async (req, res) => {
    // query the database by given credentials 
    const { username, password } = req.body 
    const result = await pool.query(
        'SELECT * from users WHERE username = $1',
        [username]
    );

    if (result.rowCount === 0) {
        res.status(400).json({ message: "Invalid username or password" })
        return;
    }; 

    // check if credentials are valid
    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) {
        res.status(400).json({ message: "Invalid username or password" }); 
        return;
    } 

    // generate token
    const token = generateToken(result.rows[0].id);
    res.cookie("jwt", token, { httpOnly: true, secure: true, sameSite: "strict" });
    res.json({ token: token, username: result.rows[0].username});
});

router.post("/logout", (req, res) => {
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "strict" });
    res.status(200).json({ message: "Logged out successfully" });
});

export default router;