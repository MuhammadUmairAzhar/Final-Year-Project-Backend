import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserSignupModel } from "../models/userSignup.model";
import { UserSigninModel } from "../models/userSignin.model";
import User from "../schema/user";
import { UserRoles, isPanel } from "../enums/roles.enum";
import { ContextModel } from "../models/context.model";
import { ContractModel } from "../models/contract.model";
import { isValidFinalMarks, isValidMidMarks } from "../constants/marks";
import Contract from "../schema/contract";
import Panel from "../schema/panel";

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

    const hash = bcrypt.hashSync(user.password, saltRounds);

    const newUser = new User({
      _id: new Types.ObjectId(),
      name: user.name,
      email: user.email,
      password: hash,
      role: UserRoles.PANEL,
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
        message: "User does not exist!",
      });
    }

    if (!isPanel(result.role)) {
      return res.status(401).json({
        message: "Unauthorized Access!",
      });
    }

    const hash = bcrypt.compareSync(user.password, result.password);

    if (hash) {
      const token = jwt.sign(
        {
          id: result._id,
          role: UserRoles.PANEL,
        },
        process.env.SECRET_KEY as string,
        { expiresIn: "15d" }
      );

      return res.status(200).json({
        message: "Success",
        token: token,
      });
    } else {
      return res.status(401).json({
        message: "Incorrect Credentials!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error signing in!",
    });
  }
};

export const AssignedPanelDetails = async (
  context: ContextModel,
  res: Response
) => {
  try {
    const panel: any = await Panel.findOne({
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

    for (let i=0 ; i<panel?.contracts?.length ; i++) {
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
