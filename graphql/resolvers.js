const axios = require("axios");
const { AuthenticationError, ApolloError } = require("apollo-server");
const { PubSub } = require("apollo-server");
const graphqlFields = require("graphql-fields");
const convertToCelsius = require("../helpers/converter");
const User = require("../models/user");

const pubsub = new PubSub();
const USER_LOGGEDIN = "USER_LOGGEDIN";

module.exports = {
  Query: {
    getCountryInfo: async (_, { countryName }, context, info) => {
      if (context.token === undefined) {
        throw new ApolloError("You are not logged in", 404);
      }

      const user = await User.findById(context.id);
      if (!user || user.token !== context.token) {
        throw new ApolloError("Invalid token", 401);
      }

      const requestedParams = JSON.parse(
        JSON.stringify(graphqlFields(info), null, 2)
      );

      let data = {};
      try {
        const country = await axios.get(
          `https://restcountries.eu/rest/v2/name/${countryName.toLowerCase()}`
        );
        data.name = country.data[0].name;
        data.capital = country.data[0].capital;
        data.timezones = country.data[0].timezones;
        data.flag = country.data[0].flag;
        data.currencies = country.data[0].currencies;
        data.population = country.data[0].population;
        data.borders = country.data[0].borders;

        if (requestedParams.weather) {
          const weather = await axios.get(
            `https://api.darksky.net/forecast/1e752c9b142206ff7c331bc57ddd3f1b/${country.data[0].latlng[0]},${country.data[0].latlng[1]}?lang=en`
          );
          data.weather = {
            currently: {
              time: weather.data.currently.time,
              summary: weather.data.currently.summary,
              icon: weather.data.currently.icon,
              humidity: weather.data.currently.humidity,
              currentTemperature: convertToCelsius(
                weather.data.currently.temperature
              )
            },
            next8days: weather.data.daily.data.map(dailyInfo => {
              return {
                summary: dailyInfo.summary,
                maxTemperature: convertToCelsius(dailyInfo.temperatureMax),
                minTemperature: convertToCelsius(dailyInfo.temperatureMin),
                icon: dailyInfo.icon,
                humidity: dailyInfo.humidity
              };
            })
          };
        }
      } catch (error) {
        throw new ApolloError("Wrong country name", 400);
      }
      return {
        ...data
      };
    }
  },

  Mutation: {
    login: async (_, { email, password }, req, info) => {
      const user = await User.findOne({ email: email });
      if (!user) {
        throw new AuthenticationError("Must register first");
      }
      const isEqual = password === user.password;
      if (!isEqual) {
        throw new AuthenticationError("Wrong credentials");
      }
      const token = user.generateToken();
      pubsub.publish(USER_LOGGEDIN, {
        loggedUsers: {
          id: user._id.toString(),
          email: user.email
        }
      });
      return { token: token, userId: user._id.toString() };
    },

    register: async (_, { input }, req) => {
      const inputData = JSON.parse(JSON.stringify(input));
      const user = new User();
      user.email = inputData.email;
      user.password = inputData.password;
      user.name = inputData.name;

      await user.save();
      return {
        name: user.name,
        email: user.email
      };
    }
  },

  Subscription: {
    loggedUsers: {
      subscribe: () => pubsub.asyncIterator(USER_LOGGEDIN)
    }
  }
};
