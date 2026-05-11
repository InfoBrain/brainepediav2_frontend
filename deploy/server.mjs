const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.static(PUBLIC_DIR));

app.get("*", function (_req, res) {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, function () {
  console.log("Brainepedia server listening on port " + PORT);
});
