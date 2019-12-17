const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { ApolloError } = require("apollo-server");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value))
          throw new ApolloError("Invalid email", 400);
      }
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    token: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.generateToken = async function() {
  const user = this;
  const jtoken = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );

  user.token = jtoken;
  await user.save();

  return jtoken;
};

module.exports = mongoose.model("User", userSchema);
