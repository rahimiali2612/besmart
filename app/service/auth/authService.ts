import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { TokenBlacklistService } from "./tokenBlacklistService";

// Constants
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "your-secure-jwt-secret-key"; // Should be in env in production
const JWT_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours in seconds

// Helper to get the secret as a Uint8Array
function getSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Authentication service for handling password encryption and JWT tokens
 */
export class AuthService {
  /**
   * Hash a plain text password
   * @param password Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword Plain text password
   * @param hashedPassword Hashed password
   * @returns Boolean indicating if passwords match
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  /**
   * Generate a JWT token for a user
   * @param payload Data to include in the token
   * @returns Object containing token and expiration info
   */
  static async generateToken(payload: Record<string, any>): Promise<{
    token: string;
    expiresIn: number;
    expiresAt: number;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + JWT_EXPIRY_SECONDS;
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(getSecret());
    return {
      token,
      expiresIn: JWT_EXPIRY_SECONDS,
      expiresAt: expiresAt * 1000, // Convert to milliseconds for consistency
    };
  }
  /**
   * Verify a JWT token
   * @param token JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  static async verifyToken(token: string): Promise<Record<string, any> | null> {
    try {
      // Check if token is blacklisted
      if (TokenBlacklistService.isBlacklisted(token)) {
        return null;
      }
      const { payload } = await jwtVerify(token, getSecret());
      return payload as Record<string, any>;
    } catch (error) {
      console.error("JWT verification error:", error);
      return null;
    }
  }
  /**
   * Invalidate a token (e.g., on logout)
   * @param token JWT token to invalidate
   * @returns void
   */
  static async invalidateToken(token: string): Promise<void> {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      if (payload && payload.exp) {
        // Add token to blacklist until expiration
        const expiryMs = Number(payload.exp) * 1000; // Convert seconds to milliseconds
        TokenBlacklistService.blacklistToken(token, expiryMs);
      }
    } catch (error) {
      console.error("Error invalidating token:", error);
    }
  }
}
