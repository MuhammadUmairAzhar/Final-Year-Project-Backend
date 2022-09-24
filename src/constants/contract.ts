export const CONTRACT = {
  MAX_ACCEPTED_REQUESTS: 5,
} as const

export const isLimitReached = (requests: number): boolean => {
  return (requests >= CONTRACT.MAX_ACCEPTED_REQUESTS);
};