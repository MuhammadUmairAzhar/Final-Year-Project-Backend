import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserSignupModel } from "../models/userSignup.model";
import { UserSigninModel } from "../models/userSignin.model";
import User from "../schema/user";
import { UserRoles, isStudent } from "../enums/roles.enum";
import { ContractModel } from "../models/contract.model";
import Contract from "../schema/contract";
import Panel from "../schema/panel";
import {
  AcceptanceStatus,
  isValidStatus,
  isAccepted,
} from "../enums/contract.enum";
import { ContextModel } from "../models/context.model";
import { isLimitReached } from "../constants/contract";

const saltRounds = 10;

export const Signup = async (user: UserSignupModel, res: Response) => {
  try {
    const userExist = await User.findOne().or([
      { email: user.email },
      { ID: user.ID },
    ]);
    if (userExist) {
      return res.status(404).json({
        success: false,
        message: "Error signing up!",
      });
    }

    if (user.password != user.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password does not match with confirm password!",
      });
    }

    if (!user.ID) {
      return res.status(400).json({
        success: false,
        message:
          "Student must enter his/her registration ID provided by the university! Enter correct ID as it cannot be modified later",
      });
    }

    const hash = bcrypt.hashSync(user.password, saltRounds);

    const newUser = new User({
      _id: new Types.ObjectId(),
      name: user.name,
      email: user.email,
      password: hash,
      role: UserRoles.STUDENT,
      ID: user.ID,
    });

    await newUser.save();

    return res.status(200).json({
      success: true,
      message: "Successfully signed up!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error signing up!",
    });
  }
};

export const Signin = async (user: UserSigninModel, res: Response) => {
  try {
    const result = await User.findOne({ email: user.email });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User does not exist!",
      });
    }

    if (!isStudent(result.role)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access!",
      });
    }

    const hash = bcrypt.compareSync(user.password, result.password);

    if (hash) {
      const token = jwt.sign(
        {
          id: result._id,
          role: UserRoles.STUDENT,
        },
        process.env.SECRET_KEY as string,
        { expiresIn: "15d" }
      );

      return res.status(200).json({
        success: false,
        message: "Successfully signed in!",
        token: token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Incorrect Credentials!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error signing in!",
    });
  }
};

export const AllAdvisors = async (res: Response) => {
  try {
    const advisors = await User.find({ role: UserRoles.ADVISOR }).select(
      "name department"
    );

    return res.status(200).json({
      message: advisors.length + " rows retreived!",
      advisors: advisors,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error!",
    });
  }
};

export const SelectAdvisor = async (
  contract: ContractModel,
  context: ContextModel,
  res: Response
) => {
  try {
    const contractCount = await Contract.find({
      advisor: contract.advisor,
      acceptance: AcceptanceStatus.ACCEPTED,
      isClosed: false,
    }).count();
    if (isLimitReached(contractCount)) {
      return res.status(400).json({
        message: "Advisor can no more accept any fyp group!",
      });
    }

    const contractExist = await Contract.findOne().or([
      {
        student: context.user._id,
        acceptance: AcceptanceStatus.ACCEPTED,
        isClosed: false,
      },
      {
        student: context.user._id,
        acceptance: AcceptanceStatus.NOT_RESPONDED,
        isClosed: false,
      },
      {
        studentOne: { ID: context.user.ID },
        acceptance: AcceptanceStatus.ACCEPTED,
        isClosed: false,
      },
      {
        studentOne: { ID: context.user.ID },
        acceptance: AcceptanceStatus.NOT_RESPONDED,
        isClosed: false,
      },
      {
        studentTwo: { ID: context.user.ID },
        acceptance: AcceptanceStatus.ACCEPTED,
        isClosed: false,
      },
      {
        studentTwo: { ID: context.user.ID },
        acceptance: AcceptanceStatus.NOT_RESPONDED,
        isClosed: false,
      },
    ]);
    if (contractExist) {
      if (isAccepted(contractExist.acceptance)) {
        return res.status(400).json({
          message:
            "You have already selected an advisor or may be your group mate! Ask your advisor to close the request if you want to request another advisor!",
        });
      } else {
        return res.status(400).json({
          message:
            "You have already requested an advisor or may be your group mate! Close that request to request another advisor!",
        });
      }
    }

    if (contract.studentOne.ID != context.user.ID) {
      const otherStudentContractExist = await Contract.findOne().or([
        {
          studentOne: { ID: contract.studentOne.ID },
          acceptance: AcceptanceStatus.ACCEPTED,
          isClosed: false,
        },
        {
          studentOne: { ID: contract.studentOne.ID },
          acceptance: AcceptanceStatus.NOT_RESPONDED,
          isClosed: false,
        },
        {
          studentTwo: { ID: contract.studentOne.ID },
          acceptance: AcceptanceStatus.ACCEPTED,
          isClosed: false,
        },
        {
          studentTwo: { ID: contract.studentOne.ID },
          acceptance: AcceptanceStatus.NOT_RESPONDED,
          isClosed: false,
        },
      ]);
      if (otherStudentContractExist) {
        if (isAccepted(otherStudentContractExist.acceptance)) {
          return res.status(400).json({
            message:
              "Your other member has already selected an advisor! Ask your advisor to close his/her request if you want to request advisor!",
          });
        } else {
          return res.status(400).json({
            message:
              "Your other member has already requested an advisor! Ask him to close that request to request advisor!",
          });
        }
      }
    } else {
      const otherStudentContractExist = await Contract.findOne().or([
        {
          studentOne: { ID: contract.studentTwo.ID },
          acceptance: AcceptanceStatus.ACCEPTED,
          isClosed: false,
        },
        {
          studentOne: { ID: contract.studentTwo.ID },
          acceptance: AcceptanceStatus.NOT_RESPONDED,
          isClosed: false,
        },
        {
          studentTwo: { ID: contract.studentTwo.ID },
          acceptance: AcceptanceStatus.ACCEPTED,
          isClosed: false,
        },
        {
          studentTwo: { ID: contract.studentTwo.ID },
          acceptance: AcceptanceStatus.NOT_RESPONDED,
          isClosed: false,
        },
      ]);
      if (otherStudentContractExist) {
        if (isAccepted(otherStudentContractExist.acceptance)) {
          return res.status(400).json({
            message:
              "Your other member has already selected an advisor! Ask your advisor to close his/her request if you want to request advisor!",
          });
        } else {
          return res.status(400).json({
            message:
              "Your other member has already requested an advisor! Ask him to close that request to request advisor!",
          });
        }
      }
    }

    if (
      (contract.studentOne.ID != context.user.ID ||
        contract.studentOne.name.toLocaleLowerCase() !=
          context.user.name.toLocaleLowerCase()) &&
      (contract.studentTwo.ID != context.user.ID ||
        contract.studentTwo.name.toLocaleLowerCase() !=
          context.user.name.toLocaleLowerCase())
    ) {
      return res.status(400).json({
        message:
          "Student can only fill his/her request form! One of the student must be him/her. Enter exact ID as entered upon signing up.",
      });
    }
    if (
      contract.studentOne.ID == context.user.ID &&
      contract.studentTwo.ID == context.user.ID
    ) {
      return res.status(400).json({
        message: "Error! Same ID found for both students",
      });
    }

    const newContract = new Contract({
      _id: new Types.ObjectId(),
      student: context.user._id,
      advisor: contract.advisor,
      project: contract.project,
      studentOne: contract.studentOne,
      studentTwo: contract.studentTwo,
    });
    await newContract.save();

    return res.status(200).json({
      message: "Request successfully sent to the advisor",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error!",
    });
  }
};

export const CloseAdvisorRequest = async (
  contract: ContractModel,
  res: Response
) => {
  try {
    const contractUpdated = await Contract.findOneAndUpdate(
      {
        _id: contract.id,
        acceptance: AcceptanceStatus.NOT_RESPONDED,
        isClosed: false,
      },
      { isClosed: true },
      { new: true }
    );
    if (!contractUpdated) {
      return res.status(400).json({
        status: false,
        message: "Something wrong!",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Request closed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error!",
    });
  }
};

export const AllAdvisorsRequest = async (
  status: string,
  context: ContextModel,
  res: Response
) => {
  try {
    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request status!",
      });
    }

    const contracts = await Contract.find({
      student: context.user._id,
      acceptance: status,
    })
      .populate("advisor", "_id name department")
      .select({
        advisor: 1,
        project: 1,
        acceptance: 1,
        isClosed: 1,
        advisorForm: { _id: 1 },
        inPanel: 1,
        panel: 1,
      });

    return res.status(200).json({
      success: true,
      message: contracts.length + " rows retreived!",
      contracts: contracts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const AdvisorRequest = async (id: string, res: Response) => {
  try {
    const contract = await Contract.findById(id)
      .populate("advisor", "_id name department")
      .select({ student: 0, advisorForm: 0 });

    return res.status(200).json({
      success: true,
      message: "successful!",
      contract: contract,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const SubmitAdvisorForm = async (
  contract: ContractModel,
  res: Response
) => {
  try {
    const existingContract = await Contract.findById(contract.id).populate(
      "advisor"
    );

    if (existingContract?.advisorForm?._id) {
      return res.status(200).json({
        success: false,
        message: "Already submitted advisor form!",
      });
    }

    const advisorForm = {
      _id: new Types.ObjectId(),
      advisorName: (<typeof User>existingContract?.advisor).name,
      designation: contract.advisorForm.designation,
      department: contract.advisorForm.department,
      qualification: contract.advisorForm.qualification,
      specialization: contract.advisorForm.specialization,
      contact: contract.advisorForm.contact,
      email: contract.advisorForm.email,
      semester: contract.advisorForm.semester,
      year: contract.advisorForm.year,
      program: contract.advisorForm.program,
      creditHours: contract.advisorForm.creditHours,
      compensation: contract.advisorForm.compensation,
      project: {
        name: existingContract?.project?.name,
        description: existingContract?.project?.description,
      },
      tools: {
        hardware: contract.advisorForm.tools.hardware,
        software: contract.advisorForm.tools.software,
      },
      cost: contract.advisorForm.cost,
      studentOne: {
        name: existingContract?.studentOne?.name,
        ID: existingContract?.studentOne?.ID,
      },
      studentTwo: {
        name: existingContract?.studentTwo?.name,
        ID: existingContract?.studentTwo?.ID,
      },
      referenceNo: contract.advisorForm.referenceNo,
    };

    await Contract.findByIdAndUpdate(contract.id, { advisorForm: advisorForm });

    return res.status(200).json({
      success: true,
      message: "Successfully submitted advisor form!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const AdvisorForm = async (id: string, res: Response) => {
  try {
    const contract = await Contract.findById(id).select({ advisorForm: 1 });

    return res.status(200).json({
      success: true,
      message: "successful!",
      contract: contract,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const AssignedPanelDetails = async (id: string, res: Response) => {
  try {
    let panel: any = await Panel.findOne({ contracts: id, isClosed: false })
      .populate({
        path: "members",
        select: ["_id", "name", "department", "role"],
      })
      .select({ _id: 1, name: 1, members: 1, contracts: 1 })
      .lean();
    const contract: any = await Contract.findById(id)
      .select({ marks: 1 })
      .lean();
    panel = { ...panel, contracts: [contract] };

    return res.status(200).json({
      success: true,
      message: "successful!",
      panel: panel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const GetLogform = async (contractId: string, res: Response) => {
  try {
    let contract = await Contract.findById(contractId)
      .populate("logformEntries")
      .select({ logformEntries: 1 })
      .lean();

    res.status(200).json({
      status: true,
      logform: contract?.logformEntries,
      message: "logform data",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "something went wrong", status: false, logform: [] });
  }
};