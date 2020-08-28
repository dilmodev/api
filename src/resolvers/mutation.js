const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');

const Mutation = {
  newNote: async (parent, { content }, { models }) => {
    return await models.Note.create({
      content,
      author: 'Dillon Morris'
    });
  },
  deleteNote: async (parent, { id }, { models }) => {
    try {
      await models.Note.findOneAndRemove({ _id: id });
      return true;
    } catch {
      return false;
    }
  },
  updateNote: async (parent, { id, content }, { models }) => {
    return await models.Note.findOneAndUpdate(
      { _id: id },
      { $set: { content } },
      { new: true }
    );
  },
  signUp: async (parent, { username, email, password }, { models }) => {
    // normalize the email address
    email = email.trim().toLowerCase();
    // hash the password
    const hashed = await bcrypt.hash(password, 10);
    // create the gravatar url
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed
      });
      // create and return the json web token
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      // if there's a problem creating the account, throw an error
      throw new Error('Error creating account');
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    // normalize the email address
    if (email) {
      email = email.trim().toLowerCase();
    }

    // pause execution to see if user exists in DB with given email OR username
    const user = await models.User.findOne({
      $or: [{ email }, { username }]
    });

    // if we didn't find a user, throw an error
    if (!user) {
      throw new AuthenticationError('Error signing in');
    }

    // pause execution to compare the password given with the stored password for this user
    const valid = await bcrypt.compare(password, user.password);

    // if that comes back false (password is not what we have stored)
    // then throw an error
    if (!valid) {
      throw new AuthenticationError('Error signing in');
    }

    // if we've gotten to this point, we know that we have
    // a user with the given email or password
    // and that the password given is what we have stored
    // so we can return a JWT to the client
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  }
};

module.exports = Mutation;
