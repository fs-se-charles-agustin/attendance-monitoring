import {Router, Request, Response, NextFunction} from "express";
import passport from "passport";
import { signup, login, forgotPassword, resetPassword, verifySignupOtp, adminResetPassword } from "../controllers/auth.controller"

const router = Router();

router.post("/signup", signup);
router.post("/verify-signup-otp", verifySignupOtp);

const authenticateLocal = (req: Request, res: Response, next: NextFunction) => {
    console.log("Login request received:", { 
        email: req.body.email, 
        passwordLength: req.body.password?.length,
        rememberMe: req.body.rememberMe,
        bodyKeys: Object.keys(req.body)
    });
    
    passport.authenticate("local", {session: false}, (err: any, user: any, info: any) => {
        if (err) {
            console.error("Passport authentication error:", err);
            return res.status(500).json({message: "Internal server error"});
        }
        if (!user) {
            const errorMessage = info?.message || "Invalid email or password";
            console.log("Authentication failed:", { email: req.body.email, message: errorMessage, info });
            return res.status(401).json({message: errorMessage});
        }
        console.log("Authentication successful, proceeding to login controller");
        req.user = user;
        next();
    })(req, res, next);
};

router.post(
    "/login",
    authenticateLocal,
    login
);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Development utility endpoint - REMOVE IN PRODUCTION!
router.post("/admin/reset-password", adminResetPassword);

export default router;