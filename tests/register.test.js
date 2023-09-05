require("dotenv").config();
const supertest = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");
const { User } = require("../models/userModel");

mongoose.set("strictQuery", false);
const { DB_URI_TEST } = process.env;

describe("register", () => {
  beforeAll(async () => {
    await mongoose.connect(DB_URI_TEST);

    await User.deleteMany();
  });
  afterAll(async () => {
    await mongoose.disconnect(DB_URI_TEST);
  });

  it("should register new user", async () => {
    const response = await supertest(app).post("/users/register").send({
      name: "Ivan",
      email: "ivan@gmail.com",
      password: "12345678",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.email).toBe("ivan@gmail.com");
  });

  it("should not register the same user 2 times", async () => {
    await supertest(app).post("/users/register").send({
      name: "Ivan",
      email: "ivan@gmail.com",
      password: "12345678",
    });

    const response = await supertest(app).post("/users/register").send({
      name: "Ivan",
      email: "ivan@gmail.com",
      password: "12345678",
    });
    expect(response.statusCode).toBe(409);
  });
  it("should login user", async () => {
    const response = await supertest(app).post("/users/login").send({
      email: "ivan@gmail.com",
      password: "12345678",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.email).toBe("ivan@gmail.com");
  });
});
