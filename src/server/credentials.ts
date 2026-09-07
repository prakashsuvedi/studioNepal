import dotenv from 'dotenv';
dotenv.config();

// Secure Server-Side Platform Admin Credentials
// Kept strictly offline and hidden from the client browser.
export const ADMIN_CREDENTIALS = {
  email: 'prakashsuvedi.backup@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  adminKey: process.env.ADMIN_SECRET_KEY || 'nepalai-admin-key'
};
