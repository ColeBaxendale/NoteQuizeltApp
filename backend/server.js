const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('./config/passport'); 
const authRoutes = require('./routes/authRoutes');


require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your other middleware and routes come after
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/auth', authRoutes);


// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Routes


// ✅ Start the server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));