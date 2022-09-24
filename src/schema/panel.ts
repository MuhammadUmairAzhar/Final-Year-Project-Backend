import { model, Schema, Types } from "mongoose";

const panelSchema = new Schema({
    _id: {
        type: Types.ObjectId,
    },
    name: {
        type: String,
        required: true,
        min: 1,
        max: 256
    },
    members: [
        {
            type: Types.ObjectId,
            ref: "User",
        }
    ],
    contracts: [
        {
            type: Types.ObjectId,
            ref: "Contract",
        }
    ],
    isClosed: {
        type: Boolean
    }
})

const Panel = model('Panel', panelSchema);

export default Panel;