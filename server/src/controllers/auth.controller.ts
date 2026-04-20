import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { sendPasswordResetEmail, sendOtpEmail } from "../services/email.service";
import dotenv from "dotenv";

dotenv.config();

export const signup = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, requiredOjtHours } = req.body;

        if (!firstName || !lastName || !email || !password || requiredOjtHours === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const parsedRequiredOjtHours = Number(requiredOjtHours);
        if (!Number.isFinite(parsedRequiredOjtHours) || parsedRequiredOjtHours <= 0) {
            return res.status(400).json({ message: "Required OJT hours must be greater than 0" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: "User already exists" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        if (existingUser && !existingUser.isVerified) {
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.password = password;
            existingUser.requiredOjtHours = parsedRequiredOjtHours;
            existingUser.otp = otp;
            existingUser.otpExpires = otpExpires;
            await existingUser.save();
        } else {
            await User.create({
                firstName, lastName, email, password,
                requiredOjtHours: parsedRequiredOjtHours,
                role: "student",
                otp, otpExpires, isVerified: false,
            });
        }

        try {
            await sendOtpEmail(email, otp);
            return res.status(201).json({ message: "OTP sent to your email. Please verify to complete registration." });
        } catch (emailError: any) {
            return res.status(500).json({ message: emailError.message || "Failed to send OTP email." });
        }
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};

export const verifySignupOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        const user = await User.findOne({ email, otp, otpExpires: { $gt: new Date() } });
        if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Account verified successfully. You can now login." });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const { rememberMe } = req.body;
        const expiresIn = rememberMe ? "7d" : "1d";

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
            process.env.JWT_SECRET!,
            { expiresIn }
        );

        res.json({ token, expiresIn, user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();

        try {
            await sendPasswordResetEmail(user.email, resetToken);
            return res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
        } catch {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: "Failed to send reset email" });
        }
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ message: "Token and password are required" });

        const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({ resetPasswordToken: resetTokenHash, resetPasswordExpires: { $gt: new Date() } });

        if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const adminResetPassword = async (req: Request, res: Response) => {
    try {
        if (process.env.NODE_ENV === "production") return res.status(403).json({ message: "Not available in production" });
        const { email, newPassword } = req.body;
        if (!email || !newPassword) return res.status(400).json({ message: "Email and newPassword are required" });
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        user.password = newPassword;
        await user.save();
        return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const dbUser = await User.findById(user._id || user.id).populate("companyId", "name").select("-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires");
        if (!dbUser) return res.status(404).json({ message: "User not found" });
        return res.json(dbUser);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error" });
    }
};