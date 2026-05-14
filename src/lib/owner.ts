// Single fixed owner ID — used in place of auth.uid() for all DB queries
// Set OWNER_ID in your .env.local (any UUID you choose)
export const OWNER_ID = process.env.OWNER_ID ?? '00000000-0000-0000-0000-000000000001'
