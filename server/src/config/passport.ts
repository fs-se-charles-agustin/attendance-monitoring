import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import bcrypt from "bcrypt"
import { User } from "../models/User"
import dotenv from "dotenv"

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables. Please check your .env file.");
}

passport.use(
    new LocalStrategy(
        {usernameField:"email"},
        async (email, password, done) => {
            try {
                console.log("Passport LocalStrategy - Attempting login:", { email, passwordLength: password?.length });
                
                const user = await User.findOne({email})
                if(!user) {
                    console.log("Passport LocalStrategy - User not found for email:", email);
                    return done(null, false, { message: "Invalid email or password" });
                }

                console.log("Passport LocalStrategy - User found:", { 
                    email: user.email, 
                    isVerified: user.isVerified,
                    passwordHash: user.password?.substring(0, 20) + "..."
                });

                if(!user.isVerified) {
                    console.log("Passport LocalStrategy - User not verified");
                    return done(null, false, { message: "Please verify your email first" });
                }

                console.log("Passport LocalStrategy - Comparing password...");
                
                const isPasswordHashed = user.password && (
                    user.password.startsWith("$2a$") || 
                    user.password.startsWith("$2b$") || 
                    user.password.startsWith("$2y$")
                );
                
                if (!isPasswordHashed) {
                    console.error("Passport LocalStrategy - WARNING: User password is not hashed! Password appears to be stored in plain text.");
                    return done(null, false, { message: "Invalid email or password" });
                }
                
                const trimmedPassword = password.trim();
                console.log("Passport LocalStrategy - Password details:", {
                    inputLength: password.length,
                    trimmedLength: trimmedPassword.length,
                    hashLength: user.password.length,
                    hashPrefix: user.password.substring(0, 7)
                });
                
                const isMatch = await bcrypt.compare(trimmedPassword, user.password);
                console.log("Passport LocalStrategy - Password match:", isMatch);
                
                if(!isMatch) {
                    return done(null, false, { message: "Invalid email or password" });
                }

                console.log("Passport LocalStrategy - Authentication successful");
                return done(null, user);
            }catch(err){
                console.error("Passport LocalStrategy - Error:", err);
                return done(err);
            }
        }
    )
);

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        },
        async (payload, done) => {
            const user = await User.findById(payload.id);
            return user ? done(null, user) : done(null, false);
        }
    )
);

export default passport;