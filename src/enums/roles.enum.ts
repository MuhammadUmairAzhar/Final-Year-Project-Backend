export enum UserRoles {
    ADMIN = 1,
    ADVISOR = 2,
    PANEL = 3,
    STUDENT = 4
}

export const isAdmin = (role: UserRoles): boolean => {
    return role === UserRoles.ADMIN
}

export const isStudent = (role: UserRoles): boolean => {
    return role === UserRoles.STUDENT
}

export const isAdvisor = (role: UserRoles): boolean => {
    return role === UserRoles.ADVISOR
}

export const isPanel = (role: UserRoles): boolean => {
    return role === UserRoles.PANEL
}