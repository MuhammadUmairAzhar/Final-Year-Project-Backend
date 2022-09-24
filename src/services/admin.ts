import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserSignupModel } from "../models/userSignup.model";
import { UserSigninModel } from "../models/userSignin.model";
import User from "../schema/user";
import { UserRoles, isAdmin } from "../enums/roles.enum";
import Contract from "../schema/contract";
import { AcceptanceStatus } from "../enums/contract.enum";
import Panel from "../schema/panel";
import { isLimitReached } from "../constants/panel";
import { PanelModel } from "../models/panel.model";
import { ContractModel } from "../models/contract.model";
import { isValidAdminMarks } from "../constants/marks";

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
      role: UserRoles.ADMIN,
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

    if (!isAdmin(result.role)) {
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
          role: UserRoles.ADMIN,
        },
        process.env.SECRET_KEY as string,
        { expiresIn: "15d" }
      );

      return res.status(200).json({
        success: true,
        message: "Successfully logged in",
        token: token,
      });
    } else {
      return res.status(401).json({
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

export const AllStudents = async (res: Response) => {
  try {
    const students = await User.find({ role: UserRoles.STUDENT }).select(
      "name ID"
    );

    return res.status(200).json({
      message: students.length + " rows retreived!",
      students: students,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error!",
    });
  }
};

export const StudentRequest = async (id: string, res: Response) => {
  try {
    const contract = await Contract.findOne({
      student: id,
      acceptance: AcceptanceStatus.ACCEPTED,
      isClosed: false,
    })
      .populate("advisor", "_id name department")
      .populate("student", "_id name ID");

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

export const AdvisorDetails = async (id: string, res: Response) => {
  try {
    const contracts = await Contract.find({
      advisor: id,
      acceptance: AcceptanceStatus.ACCEPTED,
      isClosed: false,
    })
      .populate("advisor", "_id name department")
      .populate("student", "_id name ID")
      .select({
        advisorForm: 0,
        isClosed: 0,
        acceptance: 0,
        marks: 0,
        panel: 0,
      });

    return res.status(200).json({
      success: true,
      message: "successful!",
      contracts: contracts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const AllContractsNotInPanel = async (res: Response) => {
  try {
    const contracts = await Contract.find({
      acceptance: AcceptanceStatus.ACCEPTED,
      isClosed: false,
      inPanel: false,
    })
      .populate("advisor", "_id name department")
      .populate("student", "_id name ID")
      .select({
        advisorForm: 0,
        isClosed: 0,
        acceptance: 0,
        marks: 0,
        panel: 0,
        inPanel: 0,
      });

    return res.status(200).json({
      success: true,
      message: "successful!",
      contracts: contracts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const AllContracts = async (res: Response) => {
  try {
    const contracts = await Contract.find({
      acceptance: AcceptanceStatus.ACCEPTED,
      isClosed: false,
    })
      .populate("advisor", "_id name department")
      .populate("student", "_id name ID")
      .select({
        advisorForm: 0,
        isClosed: 0,
        acceptance: 0,
        marks: 0,
        panel: 0,
        inPanel: 0,
      });

    return res.status(200).json({
      success: true,
      message: "successful!",
      contracts: contracts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const ListOfStaffForPanel = async (res: Response) => {
  try {
    const users = await User.find({ inPanel: false })
      .or([{ role: UserRoles.ADVISOR }, { role: UserRoles.PANEL }])
      .select("name department role");

    return res.status(200).json({
      success: true,
      message: users.length + " users retreived for panel",
      users: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const CreatePanel = async (panel: PanelModel, res: Response) => {
  try {
    if (isLimitReached(panel.members.length)) {
      return res.status(400).json({
        message: "Panel cannot contain more than seven members!",
      });
    }
    if (panel.name == null || panel.name == undefined) {
      return res.status(400).json({
        message: "Panel name must be entered!",
      });
    }
    for (const id of panel.members) {
      const user = await User.findById(id);
      if (user?.inPanel) {
        return res.status(400).json({
          message:
            "One or more of the selected advisor/panel is already in panel!",
        });
      }
    }

    const newPanel = new Panel({
      _id: new Types.ObjectId(),
      name: panel.name,
      members: panel.members,
      isClosed: false,
    });
    await newPanel.save();

    for (const id of panel.members) {
      await User.findByIdAndUpdate(id, { inPanel: true, panel: newPanel._id });
    }

    return res.status(200).json({
      success: true,
      message: "Panel created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const PanelDetails = async (id: string, res: Response) => {
  try {
    const panel = await Panel.findById(id)
      .populate({
        path: "members",
        select: ["_id", "name", "department", "role"],
      })
      .populate({
        path: "contracts",
        select: ["_id", "project"],
      })
      .select({ _id: 1, name: 1, members: 1, contracts: 1 })
      .lean();

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

export const AllPanels = async (res: Response) => {
  try {
    const panels = await Panel.find({ isClosed: false })
      .select({ members: 0, isClosed: 0 })
      .lean();

    return res.status(200).json({
      success: true,
      message: panels.length + " panels retrieved.",
      panels: panels,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const ClosePanel = async (panel: PanelModel, res: Response) => {
  try {
    const panelUpdated = await Panel.findOneAndUpdate(
      { _id: panel.id },
      { isClosed: true },
      { new: true }
    );
    if (!panelUpdated) {
      return res.status(400).json({
        status: false,
        message: "Something wrong!",
      });
    }

    for (const id of panel.members) {
      await User.findByIdAndUpdate(id, { inPanel: false, panel: null });
    }

    return res.status(200).json({
      status: true,
      message: "Panel closed successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error!",
    });
  }
};

export const AddContractsToPanel = async (panel: PanelModel, res: Response) => {
  try {
    const panelUpdated = await Panel.findOneAndUpdate(
      { _id: panel.id },
      { contracts: panel.contracts },
      { new: true }
    );
    if (!panelUpdated) {
      return res.status(400).json({
        status: false,
        message: "Something wrong!",
      });
    }

    for (const id of panel.contracts) {
      await Contract.findByIdAndUpdate(id, { inPanel: true, panel: panel.id });
    }

    return res.status(200).json({
      success: true,
      message: "FYP Groups added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

export const AdminMarks = async (contract: ContractModel, res: Response) => {
  try {
    if (!isValidAdminMarks(contract.marks.admin)) {
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
      { marks: { ...contractFind?.marks, admin: contract.marks.admin } },
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
    return res.status(500).json({
      status: false,
      message: "Internal server error!",
    });
  }
};
