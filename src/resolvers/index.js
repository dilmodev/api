const Query = require('./query');
const Mutation = require('./mutation');
const { GraphQLDateTime } = require('graphql-iso-date');

// Resolvers perform exactly the action their name implies;
// they resolve the data that the API user has requested.
module.exports = {
  Query,
  Mutation,
  // adds validation to any resolver function that requests a value with a type of DateTime
  DateTime: GraphQLDateTime
};
