/**
 * Simple in-memory token blacklist service
 * In a production environment, this would typically be stored in Redis or a similar store
 */
export class TokenBlacklistService {
  // In-memory storage for invalidated tokens
  private static blacklistedTokens: Map<string, number> = new Map();

  /**
   * Add a token to the blacklist until its expiry time
   * @param token The JWT token to blacklist
   * @param expiryTimestamp The expiry timestamp in milliseconds
   */
  static blacklistToken(token: string, expiryTimestamp: number): void {
    this.blacklistedTokens.set(token, expiryTimestamp);

    // Schedule cleanup of expired token
    setTimeout(() => {
      this.blacklistedTokens.delete(token);
    }, expiryTimestamp - Date.now());
  }
  /**
   * Check if a token is blacklisted
   * @param token The JWT token to check
   * @returns Whether the token is blacklisted
   */
  static isBlacklisted(token: string): boolean {
    // First remove any expired tokens
    this.cleanupExpiredTokens();

    // Check if token is in the blacklist
    const isBlacklisted = this.blacklistedTokens.has(token);
    // Removed console.warn that showed blacklisted token details
    return isBlacklisted;
  }

  /**
   * Clean up expired tokens from the blacklist
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, expiry] of this.blacklistedTokens.entries()) {
      if (expiry <= now) {
        this.blacklistedTokens.delete(token);
      }
    }
  }
}
