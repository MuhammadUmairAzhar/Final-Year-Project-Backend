import { model, Schema, Types } from "mongoose";
import { UserRoles } from "../enums/roles.enum";

const userSchema = new Schema({
    _id: {
        type: Types.ObjectId,
    },
    name: {
        type: String,
        required: true,
        min: 1,
        max: 256
    },
    email: { 
        type: String, 
        required: true,
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    ID: {
        type: String, //for students only
    },
    department: {
        type: String //for advisors and panel only
    },
    password: { 
        type: String,
        required: true
    },
    gender: {
        type: String,
    },
    role: {
        type: Number,
        required: true
    },
    inPanel: {
        type: Boolean
    },
    panel: {
        type: Types.ObjectId,
        ref: "Panel",
    }
})

const User = model('User', userSchema);

export default User;