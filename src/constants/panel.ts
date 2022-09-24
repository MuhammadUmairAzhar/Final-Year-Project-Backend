export const PANEL = {
    MAX_MEMBERS_LIMIT: 7,
} as const
  
export const isLimitReached = (requests: number): boolean => {
    return (requests > PANEL.MAX_MEMBERS_LIMIT);
};