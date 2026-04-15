const fs = require("fs");
const path = require("path");

const publicKey = fs.readFileSync(
    path.join(__dirname, "../keys/publicKey.pem"),
    "utf8"
);

module.exports = { publicKey };