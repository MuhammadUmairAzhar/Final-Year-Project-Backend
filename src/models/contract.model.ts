import { AcceptanceStatus } from "../enums/contract.enum";

export class ContractModel  {
    id: String;
    student: String;
    advisor: String;
    project: {
        name: String;
        description: String
    };
    studentOne: {
        name: String;
        ID: String;
    };
    studentTwo: {
        name: String;
        ID: String;
    };
    acceptance: AcceptanceStatus;
    isClosed: Boolean;
    advisorForm: {
        advisorName: String;
        designation: String;
        department: String;
        qualification: String;
        specialization: String;
        contact: String;
        email: String;
        semester: Number;
        year: Number;
        program: String;
        creditHours: Number;
        compensation: Number;
        project: {
            name: String;
            description: String;
        };
        tools: {
            hardware: String;
            software: String;
        };
        cost: Number;
        studentOne: {
            name: String;
            ID: String;
        };
        studentTwo: {
            name: String;
            ID: String;
        };
        referenceNo: String;
    };
    panel: String;
    inPanel: Boolean;
    marks: {
        admin: Number,
        advisor: Number,
        mid: {
            evaluator: String;
            marks: Number;
        },
        final: {
            evaluator: String;
            marks: Number;
        }
    }
}