const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');

module.exports = {
  newNote: async (parent, { content }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to create a note');
    }
    return await models.Note.create({
      content,
      // reference to the author's mongo id
      author: mongoose.Types.ObjectId(user.id)
    });
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note');
    }
    const note = models.Note.findById(id);
    // if the note owner and current user don't match, throw a forbidden error
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to delete the note");
    }

    try {
      // if everything checks out, remove the note
      await note.remove();
      return true;
    } catch {
      // if there's an error along the way, return false
      return false;
    }
  },
  updateNote: async (parent, { id, content }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note');
    }

    const note = models.Note.findById(id);

    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to update the note");
    }

    return await models.Note.findOneAndUpdate(
      { _id: id },
      { $set: { content } },
      { new: true }
    );
  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError();
    }

    // check to see if the user has already favorited the note
    let note = await models.Note.findById(id);
    const hasUser = note.favoritedBy.indexOf(user.id);

    // if the user exists in the list
    // pull them from the list and reduce the favoriteCount by 1
    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          // Set new to true to return the updated doc
          new: true
        }
      );
    } else {
      // if the user doesn't exist in the list
      // add them to the list and increment favoriteCount by 1
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: 1
          }
        },
        {
          new: true
        }
      );
    }
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
      throw new AuthenticationError('Password incorrect');
    }

    // if we've gotten to this point, we know that we have
    // a user with the given email or password
    // and that the password given is what we have stored
    // so we can return a JWT to the client
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  }
};
