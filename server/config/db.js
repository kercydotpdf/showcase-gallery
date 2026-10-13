import "dotenv/config";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || "elms_db";
    await mongoose.connect(process.env.MONGO_URI, { dbName });
    console.log(`MongoDB Atlas connected (database: ${dbName})`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
