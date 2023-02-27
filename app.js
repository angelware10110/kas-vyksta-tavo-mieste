require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { errorHandler } = require("./middleware/errorMiddleware");
const connectDB = require("./config/databaseConfig");
const port = process.env.PORT || 6655;

connectDB();

const app = express()

app.use(cors())
app.options("*", cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(errorHandler);

app.listen(port, () => console.log("Listening on PORT", port))