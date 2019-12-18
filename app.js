const express = require("express");
const { createServer } = require("http");
const { PubSub } = require("apollo-server");
const { ApolloServer, ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");

const app = express();

const pubsub = new PubSub();
const MESSAGE_CREATED = "MESSAGE_CREATED";

const server = new ApolloServer({
  typeDefs: graphqlSchema,
  resolvers: graphqlResolver,
  context: ({ req, connection }) => {
    if (connection) {
      return connection.context;
    } else {
      let token = "";
      if (req.headers.authorization !== undefined) {
        token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.decode(token);
        if (Date.now() >= decoded.exp * 1000) {
          throw new ApolloError("Token expired", 404);
        }
        return { id: decoded._id, token: token };
      } else {
        return null;
      }
    }
  }
});

server.applyMiddleware({ app, path: "/graphql" });

const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);

mongoose
  .connect(process.env.MONGO_URL)
  .then(result => {
    console.log(`🚀 Connected to mongoDB`);
    httpServer.listen({ port: process.env.PORT }, () => {
      console.log(
        `Apollo Server on http://localhost:${process.env.PORT}/graphql`
      );
    });
  })
  .catch(err => {
    console.log(err);
  });
