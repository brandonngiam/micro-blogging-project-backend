const app = require("../../src/app");
const request = require("supertest");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const secret_key = require("../../src/util/key");
const bcrypt = require("bcrypt");

describe("Signup route", () => {
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
  });

  it("POST /signup should create a new user", async () => {
    const newUser = { username: "johnny", password: "12345Abde." };
    const response = await request(app)
      .post("/signup")
      .send(newUser);

    const twittausers = await db.collection("twittausers");
    const hash = await bcrypt.hash(newUser.password, 10);
    const userWithHash = {
      username: newUser.username
    };
    const found = await twittausers.findOne(userWithHash);
    expect(response.status).toEqual(201);
    expect(found.activities).toHaveLength(1);
    expect(found.activities[0].activity).toEqual("signup");
    expect(found.username).toEqual(newUser.username);
    expect(await bcrypt.compare(newUser.password, found.password)).toBeTruthy();

    const token = response.body.jwt;
    const decoded = jwt.verify(token, secret_key);
    expect(decoded.user).toEqual(newUser.username);
  });

  it("POST /signup should not create a new user if username already exists", async () => {
    const newUser = { username: "johnny", password: "abcd1234." };
    await request(app)
      .post("/signup")
      .send(newUser);

    const duplicateUser = { username: "johnny", password: "1234abcd." };
    const response = await request(app)
      .post("/signup")
      .send(duplicateUser);

    const twittausers = await db.collection("twittausers");
    const found = await twittausers.find({ username: "johnny" }).toArray();
    expect(found).toHaveLength(1);
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({ err: "Username already taken" });
  });

  it("POST /signup should not create a new user if username does not meet requirements", async () => {
    const userNameShort = { username: "john", password: "abcd1234." };
    const userNameLong = {
      username: "johnjohnjohnjohnjohnjohnjohnjohnjohn",
      password: "abcd1234."
    };
    const userNameSpecialChar = { username: "johnny#", password: "abcd1234." };

    const responseShort = await request(app)
      .post("/signup")
      .send(userNameShort);
    const responseLong = await request(app)
      .post("/signup")
      .send(userNameLong);
    const responseSpecialChar = await request(app)
      .post("/signup")
      .send(userNameSpecialChar);

    expect(responseShort.status).toEqual(400);
    expect(responseLong.status).toEqual(400);
    expect(responseSpecialChar.status).toEqual(400);
    expect(responseShort.body).toEqual({
      err:
        'child "username" fails because ["username" length must be at least 5 characters long]'
    });
    expect(responseLong.body).toEqual({
      err:
        'child "username" fails because ["username" length must be less than or equal to 32 characters long]'
    });
    expect(responseSpecialChar.body.err).toMatch(/(required pattern)/);
  });

  it("POST /signup should not create a new user if password does not meet requirements", async () => {
    const passwordShort = { username: "brandon1", password: "abcd12." };
    const passwordLong = {
      username: "brandon2",
      password:
        "abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abcd1234.abc"
    };
    const passwordNoSpecialChar = {
      username: "brandon3",
      password: "abcd1234"
    };

    const responseShort = await request(app)
      .post("/signup")
      .send(passwordShort);
    const responseLong = await request(app)
      .post("/signup")
      .send(passwordLong);
    const responseNoSpecialChar = await request(app)
      .post("/signup")
      .send(passwordNoSpecialChar);
    expect(responseShort.status).toEqual(400);
    expect(responseLong.status).toEqual(400);
    expect(responseNoSpecialChar.status).toEqual(400);
    expect(responseShort.body).toEqual({
      err:
        'child "password" fails because ["password" length must be at least 8 characters long]'
    });
    expect(responseLong.body).toEqual({
      err:
        'child "password" fails because ["password" length must be less than or equal to 128 characters long]'
    });
    expect(responseNoSpecialChar.body.err).toMatch(/(required pattern)/);
  });
});
