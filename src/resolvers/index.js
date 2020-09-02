const Query = require('./query');
const Mutation = require('./mutation');
const Note = require('./note');
const User = require('./user');
const { GraphQLDateTime } = require('graphql-iso-date');

// Resolvers perform exactly the action their name implies;
// they resolve the data that the API user has requested.
module.exports = {
  Query,
  Mutation,
  Note,
  User,
  // adds validation to any resolver function that requests a value with a type of DateTime
  DateTime: GraphQLDateTime
};
