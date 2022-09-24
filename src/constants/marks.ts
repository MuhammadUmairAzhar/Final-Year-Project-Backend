export const MARKS = {
    MIN_MARKS: 0,
    MAX_ADMIN_MARKS: 10,
    MAX_ADVISOR_MARKS: 30,
    MAX_MID_MARKS: 20,
    MAX_FINAL_MARKS: 40
} as const

export const isValidAdminMarks = (marks: Number): boolean => {
    return (marks >= MARKS.MIN_MARKS && marks <= MARKS.MAX_ADMIN_MARKS);
};

export const isValidAdvisorMarks = (marks: Number): boolean => {
    return (marks >= MARKS.MIN_MARKS && marks <= MARKS.MAX_ADVISOR_MARKS);
};

export const isValidMidMarks = (marks: Number): boolean => {
    return (marks >= MARKS.MIN_MARKS && marks <= MARKS.MAX_MID_MARKS);
};

export const isValidFinalMarks = (marks: Number): boolean => {
    return (marks >= MARKS.MIN_MARKS && marks <= MARKS.MAX_FINAL_MARKS);
};