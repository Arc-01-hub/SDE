const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Untitled Document",
    },
    desc: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    content: {
      type: String,
      default: "",
    },

    tags: [
      {
        type: String,
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
