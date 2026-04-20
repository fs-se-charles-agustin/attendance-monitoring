import { Request, Response } from "express";
import { Attendance } from "../models/Attendance";
import { Company } from "../models/Company";
import { User } from "../models/User";
import { getIO } from "../config/socket";

// Haversine formula — returns distance in meters between two GPS points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTodayString() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export const timeIn = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { qrValue, lat, lng } = req.body;

    if (!qrValue || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "qrValue, lat, and lng are required" });
    }

    // Validate QR value matches a company
    const company = await Company.findOne({ qrValue });
    if (!company) {
      return res.status(400).json({ message: "Invalid QR code. Company not found." });
    }

    // Check GPS distance (geo-fencing)
    if (!company.location) {
      return res.status(400).json({ message: "Company has no location set. Contact your admin." });
    }

    const distance = haversineDistance(
      company.location.lat, company.location.lng,
      parseFloat(lat), parseFloat(lng)
    );

    if (distance > company.allowedRadius) {
      return res.status(400).json({
        message: `You are too far from the workplace. Distance: ${Math.round(distance)}m. Allowed: ${company.allowedRadius}m.`,
        distance: Math.round(distance),
        allowedRadius: company.allowedRadius,
      });
    }

    // Prevent duplicate time-in today
    const today = getTodayString();
    const existing = await Attendance.findOne({ userId: user._id, date: today, isActive: true });
    if (existing) {
      return res.status(400).json({ message: "You have already timed in today." });
    }

    // Determine status: late if after 9:00 AM
    const hour = new Date().getHours();
    const status = hour >= 9 ? "late" : "present";

    const attendance = await Attendance.create({
      userId: user._id,
      companyId: company._id,
      date: today,
      timeIn: new Date(),
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      status,
      isActive: true,
    });

    // If intern is not yet assigned to this company, assign them
    if (!user.companyId || user.companyId.toString() !== company._id.toString()) {
      await User.findByIdAndUpdate(user._id, { companyId: company._id });
    }

    const populated = await attendance.populate([
      { path: "userId", select: "firstName lastName email" },
      { path: "companyId", select: "name address" },
    ]);

    // Emit real-time update
    try {
      const io = getIO();
      io.emit("attendanceUpdated", { type: "time-in", attendance: populated });
    } catch {}

    return res.status(201).json({ message: "Time-in recorded successfully", attendance: populated });
  } catch (error: any) {
    console.error("timeIn error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const timeOut = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const today = getTodayString();

    const attendance = await Attendance.findOne({ userId: user._id, date: today, isActive: true });
    if (!attendance) {
      return res.status(400).json({ message: "No active time-in session found for today." });
    }

    const timeOut = new Date();
    const hoursWorked = (timeOut.getTime() - attendance.timeIn!.getTime()) / 3600000;

    attendance.timeOut = timeOut;
    attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
    attendance.isActive = false;
    await attendance.save();

    // Update user's total hours
    await User.findByIdAndUpdate(user._id, { $inc: { totalHours: attendance.hoursWorked } });

    const populated = await attendance.populate([
      { path: "userId", select: "firstName lastName email" },
      { path: "companyId", select: "name address" },
    ]);

    // Emit real-time update
    try {
      const io = getIO();
      io.emit("attendanceUpdated", { type: "time-out", attendance: populated });
    } catch {}

    return res.json({ message: "Time-out recorded successfully", attendance: populated, hoursWorked: attendance.hoursWorked });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const today = getTodayString();

    let records;
    if (user.role === "admin") {
      records = await Attendance.find({ date: today })
        .populate("userId", "firstName lastName email totalHours")
        .populate("companyId", "name address")
        .sort({ timeIn: -1 });
    } else {
      records = await Attendance.find({ userId: user._id, date: today })
        .populate("companyId", "name address");
    }

    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { month, year } = req.query;

    let filter: any = { userId: user._id };
    if (month && year) {
      const monthStr = String(month).padStart(2, "0");
      filter.date = { $regex: `^${year}-${monthStr}` };
    }

    const records = await Attendance.find(filter)
      .populate("companyId", "name address")
      .sort({ date: -1 });

    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = req.user as any;

    // Students can only see their own summary
    const targetId = user.role === "admin" ? userId : user._id;

    const records = await Attendance.find({ userId: targetId })
      .populate("companyId", "name")
      .sort({ date: 1 });

    const targetUser = await User.findById(targetId).select("firstName lastName email totalHours requiredOjtHours companyId");

    return res.json({ user: targetUser, records });
  } catch (error: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllInterns = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: "student" })
      .populate("companyId", "name address")
      .select("-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    // Get today's attendance for each intern
    const today = getTodayString();
    const todayAttendance = await Attendance.find({ date: today });

    const internData = users.map((u: any) => {
      const att = todayAttendance.find((a: any) => a.userId.toString() === u._id.toString());
      return {
        ...u.toObject(),
        todayStatus: att ? att.status : "absent",
        todayTimeIn: att?.timeIn || null,
        todayTimeOut: att?.timeOut || null,
        isActive: att?.isActive || false,
      };
    });

    return res.json(internData);
  } catch (error: any) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
