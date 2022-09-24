import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserSignupModel } from "../models/userSignup.model";
import { UserSigninModel } from "../models/userSignin.model";
import User from "../schema/user";
import { UserRoles, isAdvisor } from "../enums/roles.enum";
import { ContractModel } from "../models/contract.model";
import Contract from "../schema/contract";
import { AcceptanceStatus, isValidStatus } from "../enums/contract.enum";
import { ContextModel } from "../models/context.model";
import Panel from "../schema/panel";
import { LogformModel } from "../models/logform.model";
import { Logform } from "../schema/logform";
import {
  isValidAdvisorMarks,
  isValidFinalMarks,
  isValidMidMarks,
} from "../constants/marks";
import { isLimitReached } from "../constants/contract";

const saltRounds = 10;

export const Signup = async (user: UserSignupModel, res: Response) => {
  try {
    const userExist = await User.findOne({ email: user.email });
    if (userExist) {
      return res.status(404).json({
        success: false,
        message: "Error signing up!",
      });
    }

    if (user.password !== user.confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Password does not match with confirm password!",
      });
    }

    if (!user.department) {
      return res.status(400).json({
        success: false,
        message: "Advisor must enter his/her department!",
      });
    }

    const hash = bcrypt.hashSync(user.password, saltRounds);

    const newUser = new User({
      _id: new Types.ObjectId(),
      name: user.name,
      email: user.email,
      password: hash,
      role: UserRoles.ADVISOR,
      department: user.department,
      inPanel: false,
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

    if (!isAdvisor(result.role)) {
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
          role: UserRoles.ADVISOR,
        },
        process.env.SECRET_KEY as string,
        { expiresIn: "15d" }
      );

      return res.status(200).json({
        success: true,
        message: "Successfully logged in!",
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

export const AcceptRequest = async (
  context: ContextModel,
  contract: ContractModel,
  res: Response
) => {
  try {
    const contractCount = await Contract.find({
      advisor: context.user._id,
      acceptance: AcceptanceStatus.ACCEPTED,
      isClosed: false,
    }).count();
    if (isLimitReached(contractCount)) {
      return res.status(400).json({
        message: "Advisor can no more accept any fyp group!",
      });
    }

    const contractUpdated = await Contract.findOneAndUpdate(
      {
        _id: contract.id,
        acceptance: AcceptanceStatus.NOT_RESPONDED,
        isClosed: false,
      },
      { acceptance: AcceptanceStatus.ACCEPTED },
      { new: true }
    );
    if (!contractUpdated) {
      return res.status(400).json({
        message: "Something wrong!",
      });
    }

    return res.status(200).json({
      message: "Request accepted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error!",
    });
  }
};

export const RejectRequest = async (contract: ContractModel, res: Response) => {
  try {
    const contractUpdated = await Contract.findOneAndUpdate(
      {
        _id: contract.id,
        acceptance: AcceptanceStatus.NOT_RESPONDED,
        isClosed: false,
      },
      { acceptance: AcceptanceStatus.REJECTED },
      { new: true }
    );

    if (!contractUpdated) {
      return res.status(400).json({
        message: "Something wrong!",
      });
    }

    return res.status(200).json({
      message: "Request rejected successfully!",
    });
  } catch (error) {
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
        acceptance: AcceptanceStatus.ACCEPTED,
        isClosed: false,
      },
      { isClosed: true },
      { new: true }
    );
    if (!contractUpdated) {
      return res.status(400).json({
        message: "Something wrong!",
      });
    }

    return res.status(200).json({
      message: "Request closed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error!",
    });
  }
};

export const AllStudentRequests = async (
  status: string,
  context: ContextModel,
  res: Response
) => {
  try {
    if (!isValidStatus(status)) {
      return res.status(400).json({
        message: "Invalid request status!",
      });
    }

    const contracts = await Contract.find({
      advisor: context.user._id,
      acceptance: status,
    })
      .populate("student", "_id name ID")
      .select({
        student: 1,
        project: 1,
        acceptance: 1,
        isClosed: 1,
        advisorForm: { _id: 1 },
      });

    return res.status(200).json({
      success: true,
      message: contracts.length + " rows retreived!",
      contracts: contracts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const StudentRequest = async (id: string, res: Response) => {
  try {
    const contract = await Contract.findById(id)
      .populate("student", "_id name ID")
      .select({ advisor: 0, advisorForm: 0 });

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

export const AdvisorForm = async (id: string, res: Response) => {
  try {
    const contract = await Contract.findById(id).select({
      advisorForm: 1,
      marks: { advisor: 1 },
    });

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

export const AdvisorMarks = async (contract: ContractModel, res: Response) => {
  try {
    if (!isValidAdvisorMarks(contract.marks.advisor)) {
      return res.status(400).json({
        status: false,
        message: "Invalid marks!",
      });
    }

    const contractFind: any = await Contract.findById(contract.id)
      .select({ marks: 1 })
      .lean();

    const contractUpdated = await Contract.findOneAndUpdate(
      { _id: contract.id },
      { marks: { ...contractFind?.marks, advisor: contract.marks.advisor } },
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
      message: "Marks updated successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error!",
    });
  }
};

export const AssignedPanelDetails = async (
  context: ContextModel,
  res: Response
) => {
  try {
    let panel: any = await Panel.findOne({
      members: context.user._id,
      isClosed: false,
    })
      .populate({
        path: "members",
        select: ["_id", "name", "department", "role"],
      })
      .populate({
        path: "contracts",
        select: ["_id", "project", "studentOne", "studentTwo", "marks"],
      })
      .select({ _id: 1, name: 1, members: 1, contracts: 1 })
      .lean();

    for (let i = 0; i < panel?.contracts?.length; i++) {
      if (panel?.contracts[i]?.marks?.admin) {
        panel.contracts[i].marks.admin = null;
      }
      if (panel?.contracts[i]?.marks?.advisor) {
        panel.contracts[i].marks.advisor = null;
      }
      if (panel?.contracts[i]?.marks?.mid) {
        for (let midObj of panel?.contracts[i]?.marks?.mid) {
          if (midObj?.evaluator?.toString() == context.user._id?.toString()) {
            panel.contracts[i] = {
              ...panel.contracts[i],
              user: {
                ...panel.contracts[i]?.user,
                mid: midObj.marks,
              },
            };
          }
        }
      }
      if (panel?.contracts[i]?.marks?.final) {
        for (let finalObj of panel?.contracts[i]?.marks?.final) {
          if (finalObj?.evaluator?.toString() == context.user._id?.toString()) {
            panel.contracts[i] = {
              ...panel.contracts[i],
              user: {
                ...panel.contracts[i]?.user,
                final: finalObj.marks,
              },
            };
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "successful!",
      panel: panel,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const PanelMidMarks = async (
  context: ContextModel,
  contract: ContractModel,
  res: Response
) => {
  try {
    if (!isValidMidMarks(contract.marks.mid.marks)) {
      return res.status(400).json({
        status: false,
        message: "Invalid marks!",
      });
    }

    contract.marks.mid.evaluator = context.user._id;
    const contractFind: any = await Contract.findById(contract.id)
      .select({ marks: 1 })
      .lean();

    let mid: any[] = [];
    if (contractFind?.marks?.mid) {
      mid = contractFind.marks?.mid?.map((item: any) => item);

      let evaluatorIndex = mid?.findIndex(
        (item: any) =>
          item?.evaluator?.toString() === context?.user?._id?.toString()
      );
      if (evaluatorIndex !== -1) {
        mid[evaluatorIndex] = contract.marks.mid;
      } else {
        mid.push(contract.marks.mid);
      }
    } else {
      mid.push(contract.marks.mid);
    }

    const contractUpdated = await Contract.findOneAndUpdate(
      { _id: contract.id },
      { marks: { ...contractFind?.marks, mid: mid } },
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
      message: "Marks updated successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error!",
    });
  }
};

export const PanelFinalMarks = async (
  context: ContextModel,
  contract: ContractModel,
  res: Response
) => {
  try {
    if (!isValidFinalMarks(contract.marks.final.marks)) {
      return res.status(400).json({
        status: false,
        message: "Invalid marks!",
      });
    }

    contract.marks.final.evaluator = context.user._id;
    const contractFind: any = await Contract.findById(contract.id)
      .select({ marks: 1 })
      .lean();

    let final: any[] = [];
    if (contractFind?.marks?.final) {
      final = contractFind.marks?.final?.map((item: any) => item);

      let evaluatorIndex = final?.findIndex(
        (item: any) =>
          item?.evaluator?.toString() === context?.user?._id?.toString()
      );
      if (evaluatorIndex !== -1) {
        final[evaluatorIndex] = contract.marks.final;
      } else {
        final.push(contract.marks.final);
      }
    } else {
      final.push(contract.marks.final);
    }

    const contractUpdated = await Contract.findOneAndUpdate(
      { _id: contract.id },
      { marks: { ...contractFind?.marks, final: final } },
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
      message: "Marks updated successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
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

export const AssignTask = async (
  contractId: Types.ObjectId,
  logformEntry: LogformModel,
  res: Response
) => {
  try {
    let ContractObj = await Contract.findById(contractId);
    if (!ContractObj) {
      return res
        .status(404)
        .json({ status: false, message: "No contract found" });
    }

    const taskDate = new Date();
    taskDate.setDate(taskDate.getDate() + 7);

    let logform = new Logform({
      _id: new Types.ObjectId(),
      taskAssigned: logformEntry.taskAssigned,
      taskStatus: "",
      date: taskDate,
      advisorSigned: false,
    });

    await logform.save();

    let Update = await Contract.findOneAndUpdate(
      { _id: contractId },
      { $addToSet: { logformEntries: logform._id } }
    );

    return res.status(201).json({ status: true, message: "entry updated" });
  } catch (error) {
    console.log(error);
    console.log("error");
  }
};

export const SignTask = async (id: string, res: Response) => {
  try {
    let logform = await Logform.findById(id);

    let newStatus = !logform?.advisorSigned;

    await Logform.updateOne(
      { _id: id },
      { $set: { advisorSigned: newStatus } }
    );
    res.status(201).json({ status: true, message: "updated" });
  } catch (err) {
    console.log(err);
  }
};

export const DeleteTask = async (id: string, res: Response) => {
  try {
    await Logform.deleteOne({ _id: id });
    res.status(201).json({ status: true, message: "deleted" });
  } catch (error) {
    console.log(error);
  }
};
