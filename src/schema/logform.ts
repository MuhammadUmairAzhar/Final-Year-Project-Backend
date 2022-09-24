import { model, Schema, Types } from "mongoose";

const logformSchema = new Schema({
  _id: {
    type: Types.ObjectId
  },
  taskAssigned: {
    type: String
  },
  date: {
    type: Date
  },
  taskStatus: {
    type: String
  },
  advisorSigned: {
    type: Boolean
  }
});

export const Logform = model('Logform', logformSchema);