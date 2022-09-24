import { Response } from "express";
import User from "../schema/user";
import { ContextModel } from "../models/context.model";

const Profile = async (context: ContextModel, res: Response) => {
  try {
    const profile = await User.findById(context.user._id).select(
      "name email ID gender role department"
    );

    return res.status(200).json({
      message: "Success",
      profile: profile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error!",
    });
  }
};

export { Profile };
