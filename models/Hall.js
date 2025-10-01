import mongoose from "mongoose";

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String, // optional, e.g. "Block A, Floor 2"
    },
    capacity: {
      type: Number, // optional, e.g. 100 seats
    },
  },
  { timestamps: true }
);

const Hall = mongoose.model("Hall", hallSchema);

export default Hall;
