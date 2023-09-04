const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const tempDir = path.join(__dirname, "../", "tmp");

const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extname);
    const name = `${basename}-${crypto.randomUUID()}${extname}`;
    cb(null, name);
  },
});

const upload = multer({
  storage: multerConfig,
});

module.exports = {
  upload,
};
