const gravatar = require("gravatar");
const Jimp = require("jimp");
const { User } = require("../models/userModel");
const controllerWrapper = require("../helpers/controllerWrapper");
const errorHandler = require("../helpers/errorsHandler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

const sendEmail = require("../helpers/sendEmail");

const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw errorHandler(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomUUID();
  const avatarURL = gravatar.url(email);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  await sendEmail({
    to: email,
    subject: `welcome onboard ${name}`,
    html: `
        <p>To confirm your registration, please click on the link below:</p>
        <a href="http://localhost:3000/users/verify/${verificationToken}">Click me</a>

      `,
    text: `
        To confirm your registration, please click on the link below:\n
        http://localhost:3000/auth/verify/${verificationToken}
      `,
  });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const reverify = async (req, res, next) => {
  const { name, email } = req.body;

  const verificationToken = crypto.randomUUID();
  const user = await User.findOne({ email });

  if (user.verify) {
    throw errorHandler(400, "Verification has already been passed");
  }
  if (!user) {
    throw errorHandler(400, "missing required field email");
  }
  await User.findOneAndUpdate(email, {
    verificationToken,
  });

  await sendEmail({
    to: email,
    subject: `welcome onboard ${name}`,
    html: `
        <p>To confirm your registration, please click on the link below:</p>
        <a href="http://localhost:3000/users/verify/${verificationToken}">Click me</a>

      `,
    text: `
        To confirm your registration, please click on the link below:\n
        http://localhost:3000/auth/verify/${verificationToken}
      `,
  });
  res.json({ message: "Verification email sent" });
};

const verify = async (req, res, next) => {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken }).exec();
    if (!user) {
      throw errorHandler(401, "Invalid token");
    }
    if (user.verify === true) {
      throw errorHandler(404, "Not Found");
    }

    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null,
    });
    res.json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw errorHandler(401, "Email or password invalid");
  }

  if (user.verify !== true) {
    throw errorHandler(401, "Please, verify your account");
  }
  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    throw errorHandler(401, "Email or password is wrong");
  }

  const payload = { id: user._id };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "20h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const logOut = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).end();
};
const updateSubscriptionContact = async (req, res) => {
  const { subscription } = req.body;
  const { _id } = req.user;
  const contact = await User.findByIdAndUpdate(
    _id,
    { subscription },
    {
      new: true,
    }
  );
  if (!contact) {
    throw errorHandler(404, "Not Found");
  }
  res.status(200).json(contact);
};

const uploadAvatar = async (req, res, next) => {
  const { _id } = req.user;
  const { filename } = req.file;

  const fileName = `${_id}-${req.file.filename}`;
  const fileNamePath = path.join(__dirname, "../", "tmp", filename);
  const newFileNamePath = path.join(
    __dirname,
    "../",
    "public/avatars",
    fileName
  );
  try {
    const avatar = await Jimp.read(fileNamePath);
    avatar.resize(250, 250).quality(70).write(fileNamePath);

    await fs.rename(fileNamePath, newFileNamePath);

    const avatarURL = path.join("avatars", fileName); 
    const result = await User.findByIdAndUpdate(
      req.user.id,
      { avatarURL: avatarURL },
      { new: true }
    );

    if (!result) {
      throw errorHandler(404, "User not found");
    }
    res.json({ avatarURL: avatarURL });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register: controllerWrapper(register),
  login: controllerWrapper(login),
  getCurrent: controllerWrapper(getCurrent),
  logOut: controllerWrapper(logOut),
  updateSubscriptionContact: controllerWrapper(updateSubscriptionContact),
  uploadAvatar: controllerWrapper(uploadAvatar),
  verify: controllerWrapper(verify),
  reverify: controllerWrapper(reverify),
};
