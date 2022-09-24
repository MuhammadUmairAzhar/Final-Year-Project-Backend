export enum AcceptanceStatus {
    ACCEPTED = 1,
    REJECTED = -1,
    NOT_RESPONDED = 0
}

export const isAccepted = (status: AcceptanceStatus): boolean => {
    return status === AcceptanceStatus.ACCEPTED
}

export const isRejected = (status: AcceptanceStatus): boolean => {
    return status === AcceptanceStatus.REJECTED
}

export const isNotResponded = (status: AcceptanceStatus): boolean => {
    return status === AcceptanceStatus.NOT_RESPONDED
}

export const isValidStatus = (status: string): boolean => {
    for(const _status in AcceptanceStatus){
        if(_status === status){
            return true;
        }
    }
    return false;
}