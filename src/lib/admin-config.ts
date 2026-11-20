export const ADMIN_CONFIG = {
  // Session timing
  SESSION_IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SESSION_MAX_LIFETIME_MS: 8 * 60 * 60 * 1000, // 8 hours
  STEP_UP_VALIDITY_MS: 5 * 60 * 1000, // 5 minutes

  // Least-privilege thresholds
  SMALL_CREDIT_THRESHOLD: 10, // Max credits 'support' can grant/deduct
  DUAL_APPROVAL_CREDIT_THRESHOLD: 50, // Granting > 50 credits requires second super_admin approval
  DUAL_APPROVAL_DELETE_THRESHOLD: 1, // Deleting > 1 user requires second super_admin approval

  // Per-admin daily limits
  DAILY_LIMIT_CREDITS_GRANTED: 100,
  DAILY_LIMIT_USERS_DELETED: 10,
  DAILY_LIMIT_EXPORTS: 5,

  // Soft delete & data retention
  SOFT_DELETE_GRACE_PERIOD_DAYS: 14,

  // Exports
  MAX_EXPORT_ROWS: 100,

  // Rate limits & lockouts
  FAILED_ATTEMPTS_BEFORE_LOCKOUT: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};
