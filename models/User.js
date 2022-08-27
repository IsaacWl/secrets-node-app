const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    googleId: {
        type: String,
    },
    secret: String
})

module.exports = mongoose.model("UserSecret", UserSchema)