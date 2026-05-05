const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const url = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/notification_db";
        await mongoose.connect(url);

        console.log("MongoDB connected ✅");
    } catch (error) {
        console.error("MongoDB connection error ❌:", error);
        process.exit(1);
    }
};

module.exports = connectDB;