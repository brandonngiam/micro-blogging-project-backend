const app = require("../../src/app");
const request = require("supertest");
const mockData = require("../../data/mockData");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const secret_key = require("../../src/util/key");

describe("Login route", () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true
    });
    const uriSplit = global.__MONGO_URI__.split("/");
    const realDBName = uriSplit[uriSplit.length - 1];
    db = await connection.db(realDBName);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await connection.close();
    await db.close();
  });

  beforeEach(async () => {
    await db.dropDatabase();
    const twittausers = await db.collection("twittausers");
    await twittausers.insertMany(mockData);
  });

  it("POST /login should be able to login successfully", async () => {
    const twittausers = await db.collection("twittausers");
    const response = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    expect(response.status).toEqual(200);
    const token = response.body.jwt;
    const decoded = jwt.verify(token, secret_key);
    expect(decoded.user).toEqual("brandonnnn");
  });

  it("POST /login should not be able to login successfully if username not found", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "johnnnn", password: "Abcde1234." });
    expect(response.status).toEqual(401);
    expect(response.body).toMatchObject({ err: "Username not found" });
  });

  it("POST /login should not be able to login successfully if username is found but password is wrong", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "12312432." });
    expect(response.status).toEqual(401);
    expect(response.body).toMatchObject({ err: "Incorrect password" });
  });
});
