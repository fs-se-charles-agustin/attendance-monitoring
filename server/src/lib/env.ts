import dotenv from "dotenv";

dotenv.config();


const requireEnv = (name: string): string => {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
};

export const env = {
	MONGO_URI: requireEnv('MONGO_URI'),
	PORT: requireEnv('PORT'),
	CLIENT_URL: requireEnv('CLIENT_URL'),
	JWT_SECRET: requireEnv('JWT_SECRET'),
	JWT_EXPIRES_IN: requireEnv('JWT_EXPIRES_IN'),
	SMTP_HOST: requireEnv('SMTP_HOST'),
	SMTP_PORT: requireEnv('SMPT_PORT'),
	SMTP_USER: requireEnv('SMTP_USER'),
	SMTP_PASS: requireEnv('SMTP_PASS')
}