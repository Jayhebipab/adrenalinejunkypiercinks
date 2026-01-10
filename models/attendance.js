import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    timeIn: {
      type: Date,
      required: true,
    },
    timeOut: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  }
);

// IMPORTANT: para maiwasan error sa Next.js hot reload
export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);
