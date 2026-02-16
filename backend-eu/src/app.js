const express = require("express");
const propertyRoutes = require("./routes/propertyRoutes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", region: process.env.REGION });
});

app.use("/", propertyRoutes);

module.exports = app;
