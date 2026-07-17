const teams = require("../data/teams");
const logger = require("../utils/logger");
const response = require("../utils/response");
const { getMethod, getPath } = require("../utils/http");

async function lambdaHandler(event) {
  logger.logRequest(event);

  try {
    const method = getMethod(event);
    const path = getPath(event);

    if (method === "OPTIONS") {
      return response.options();
    }

    let result;

    if (method === "GET" && path === "/teams") {
      result = response.ok({
        items: teams,
        count: teams.length
      });
    } else if (method === "GET" && event.pathParameters?.id) {
      const team = teams.find((item) => item.id === event.pathParameters.id);
      result = team
        ? response.ok(team)
        : response.notFound(`No se encontró el equipo con id '${event.pathParameters.id}'`);
    } else {
      result = response.notFound(`No existe la ruta ${method} ${path}`);
    }

    logger.logResult({ route: path, method, statusCode: result.statusCode });
    return result;
  } catch (error) {
    logger.logError(error, event);
    return response.internalServerError();
  }
}

module.exports = {
  lambdaHandler
};

