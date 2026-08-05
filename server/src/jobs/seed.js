const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");

const MONGODB_URI =
  "mongodb+srv://manish:arCGif8SzTB2hEI5@cluster0.qxpii1h.mongodb.net/?appName=Cluster0";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    // Find existing organization or create one
    let organization = await Organization.findOne();

    if (!organization) {
      organization = await Organization.create({
        name: "Dairy Cooperative",
        code: "DAIRY001",
        isActive: true,
      });

      console.log("Organization created:", organization._id);
    }

    // Check whether admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@dairy.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      console.log("Email: admin@dairy.com");
      return;
    }

    // Password is automatically hashed by User pre-save middleware
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@dairy.com",
      password: "Admin@123",
      phone: "9876543210",
      role: "ops_admin",
      organization: organization._id,
      isActive: true,
    });

    console.log("Admin created successfully");
    console.log("Admin ID:", admin._id);
    console.log("Organization ID:", organization._id);
    console.log("");
    console.log("Login Credentials");
    console.log("Email: admin@dairy.com");
    console.log("Password: Admin@123");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedAdmin();
