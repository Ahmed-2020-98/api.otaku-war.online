const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Trivia Admin Dashboard API",
      version: "1.0.0",
      description: "API Documentation for Trivia Admin Dashboard",
    },
    servers: [
      {
        url: "http://localhost:5050",
        description: "Local Server",
      },
    ],
  },
  apis: ["./api/routes/*.js", "./api/controllers/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
module.exports = swaggerDocs;
