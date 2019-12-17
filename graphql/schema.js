const { gql } = require("apollo-server-express");

const schema = gql`
  type Currency {
    code: String
    name: String
    symbol: String
  }

  interface Weather {
    summary: String
    icon: String
    humidity: Float
  }

  type CurrentWeather implements Weather {
    time: Int
    summary: String
    icon: String
    humidity: Float
    currentTemperature: Float
  }

  type DailyWeatherData implements Weather {
    summary: String
    maxTemperature: Float
    minTemperature: Float
    icon: String
    humidity: Float
  }

  type WeatherInfo {
    currently: CurrentWeather
    next8days: [DailyWeatherData]
  }

  type Country {
    name: String
    capital: String
    timezones: [String]
    flag: String
    currencies: [Currency]
    population: Int
    borders: [String]
    lat: Int
    lng: Int
    weather: WeatherInfo
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type UserData {
    email: String!
    name: String!
  }

  type User {
    id: String
    email: String!
  }

  input registerData {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    getCountryInfo(countryName: String!): Country
  }

  type Mutation {
    login(email: String!, password: String!): AuthData
    register(input: registerData): UserData
  }

  type Subscription {
    loggedUsers: User
  }
`;
module.exports = schema;
