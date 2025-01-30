import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; 
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});
const User = mongoose.model("User", UserSchema);
const MeditationSessionSchema = new mongoose.Schema({
    userId: String,
    duration: Number,
    startTime: Date,
    endTime: Date,
});
const MeditationSession = mongoose.model("MeditationSession", MeditationSessionSchema);

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({ user, message: "Login successful" });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});

app.post("/api/sessions", async (req, res) => {
    try {
        const { userId, duration, startTime, endTime } = req.body;

        if (!userId || !duration || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newSession = new MeditationSession({
            userId,
            duration,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        });

        await newSession.save();
        res.status(201).json({ message: "Session saved successfully" });
    } catch (error) {
        console.error("Error saving session:", error);
        res.status(500).json({ message: "Error saving session" });
    }
});

app.get("/api/sessions/:userId", async (req, res) => {
    try {
        const sessions = await MeditationSession.find({ userId: req.params.userId });

        if (sessions.length === 0) {
            return res.status(404).json({ message: "No history found" });
        }

        res.json(sessions);
    } catch (error) {
        console.error("Error retrieving history:", error);
        res.status(500).json({ message: "Error retrieving history" });
    }
});
app.get("/", (req, res) => {
    res.send("Meditation Timer Backend is Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
