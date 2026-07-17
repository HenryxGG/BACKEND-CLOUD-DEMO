const countries = require("../data/countries");
const players = require("../data/players");
const teams = require("../data/teams");
const logger = require("../utils/logger");
const response = require("../utils/response");
const { getMethod, getPath } = require("../utils/http");

function enrichPlayer(player) {
  const team = teams.find((item) => item.id === player.teamId);
  const country = countries.find((item) => item.id === team?.countryId);

  return {
    ...player,
    team,
    country
  };
}

async function lambdaHandler(event) {
  logger.logRequest(event);

  try {
    const method = getMethod(event);
    const path = getPath(event);

    if (method === "OPTIONS") {
      return response.options();
    }

    let result;

    if (method === "GET" && path === "/players") {
      const countryFilter = event.queryStringParameters?.country;
      let items = players.map(enrichPlayer);

      if (countryFilter) {
        items = items.filter((player) => player.country?.id === countryFilter);
      }

      result = response.ok({
        items,
        count: items.length
      });
    } else if (method === "GET" && event.pathParameters?.id) {
      const player = players.find((item) => item.id === event.pathParameters.id);
      result = player
        ? response.ok(enrichPlayer(player))
        : response.notFound(`No se encontró el jugador con id '${event.pathParameters.id}'`);
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

