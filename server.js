import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});
const User = mongoose.model("User", UserSchema);

// Meditation Session Schema
const MeditationSessionSchema = new mongoose.Schema({
    userId: String,
    duration: Number,
    startTime: Date,
    endTime: Date,
});
const MeditationSession = mongoose.model("MeditationSession", MeditationSessionSchema);

// Register User
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).send("User registered successfully");
    } catch (error) {
        res.status(500).send("Error registering user");
    }
});

// Login User
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send("Invalid credentials");
        }
        res.json({ user });
    } catch (error) {
        res.status(500).send("Error logging in");
    }
});

// Save Meditation Session
app.post("/api/sessions", async (req, res) => {
    try {
        const { userId, duration, startTime, endTime } = req.body;

        // Ensure the required fields are present
        if (!userId || !duration || !startTime || !endTime) {
            return res.status(400).send("Missing required fields");
        }

        const newSession = new MeditationSession({
            userId,
            duration,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        });
        await newSession.save();
        res.status(201).send("Session saved successfully");
    } catch (error) {
        console.error("Error saving session:", error);
        res.status(500).send("Error saving session");
    }
});

// Get Meditation History for a User
app.get("/api/sessions/:userId", async (req, res) => {
    try {
        const sessions = await MeditationSession.find({ userId: req.params.userId });
        res.json(sessions);
    } catch (error) {
        console.error("Error retrieving history:", error);
        res.status(500).send("Error retrieving history");
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
