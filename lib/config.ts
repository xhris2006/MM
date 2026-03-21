export const CONTEST_CONFIG = {
  edition: process.env.NEXT_PUBLIC_EDITION || '2025',
  voteEndDate: new Date(process.env.NEXT_PUBLIC_VOTE_END_DATE || '2025-12-31T23:59:59'),
  voteStartDate: new Date(process.env.NEXT_PUBLIC_VOTE_START_DATE || '2025-10-01T00:00:00'),
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@iai-mbalmayo.cm',
}

export function isVotingOpen(): boolean {
  const now = new Date()
  return now >= CONTEST_CONFIG.voteStartDate && now <= CONTEST_CONFIG.voteEndDate
}

export function isContestEnded(): boolean {
  return new Date() > CONTEST_CONFIG.voteEndDate
}

export function isContestStarted(): boolean {
  return new Date() >= CONTEST_CONFIG.voteStartDate
}

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return email === CONTEST_CONFIG.adminEmail
}
