const players = require("../data/players");
const stickers = require("../data/stickers");
const logger = require("../utils/logger");
const response = require("../utils/response");
const { getAuthenticatedUser } = require("../utils/cognito");
const { getMethod, getPath } = require("../utils/http");
const { parseJsonBody } = require("../utils/request");

function enrichSticker(sticker) {
  const player = players.find((item) => item.id === sticker.playerId);

  return {
    ...sticker,
    player
  };
}

function validateStickerPayload(payload) {
  const missingFields = ["number", "playerId", "edition", "rarity"].filter(
    (field) => !payload[field]
  );

  if (missingFields.length > 0) {
    return `Faltan campos obligatorios: ${missingFields.join(", ")}`;
  }

  const playerExists = players.some((item) => item.id === payload.playerId);

  if (!playerExists) {
    return `El playerId '${payload.playerId}' no existe en la data dummy`;
  }

  return null;
}

async function lambdaHandler(event) {
  logger.logRequest(event);

  try {
    const method = getMethod(event);
    const path = getPath(event);
    const user = getAuthenticatedUser(event);
    let result;

    if (method === "OPTIONS") {
      return response.options();
    }

    if (method === "GET" && path === "/stickers") {
      const rarityFilter = event.queryStringParameters?.rarity;
      let items = stickers.map(enrichSticker);

      if (rarityFilter) {
        items = items.filter((sticker) => sticker.rarity === rarityFilter);
      }

      result = response.ok({
        items,
        count: items.length
      });
    } else if (method === "GET" && event.pathParameters?.id) {
      const sticker = stickers.find((item) => item.id === event.pathParameters.id);
      result = sticker
        ? response.ok(enrichSticker(sticker))
        : response.notFound(`No se encontró el cromo con id '${event.pathParameters.id}'`);
    } else if (method === "POST" && path === "/stickers") {
      const payload = parseJsonBody(event.body);

      if (payload === null) {
        result = response.badRequest("El body no contiene JSON válido");
      } else {
        const validationError = validateStickerPayload(payload);
        if (validationError) {
          result = response.badRequest(validationError);
        } else {
          const createdSticker = {
            id: `sticker-simulated-${Date.now()}`,
            number: payload.number,
            playerId: payload.playerId,
            edition: payload.edition,
            marketValue: payload.marketValue ?? 0,
            rarity: payload.rarity,
            collected: payload.collected ?? false
          };

          result = response.created({
            message: "Cromo creado de forma simulada",
            requestedBy: user.username,
            item: enrichSticker(createdSticker)
          });
        }
      }
    } else if (method === "PUT" && event.pathParameters?.id) {
      const sticker = stickers.find((item) => item.id === event.pathParameters.id);

      if (!sticker) {
        result = response.notFound(`No se encontró el cromo con id '${event.pathParameters.id}'`);
      } else {
        const payload = parseJsonBody(event.body);

        if (payload === null) {
          result = response.badRequest("El body no contiene JSON válido");
        } else {
          const updatedSticker = {
            ...sticker,
            ...payload,
            id: sticker.id
          };

          if (updatedSticker.playerId) {
            const playerExists = players.some((item) => item.id === updatedSticker.playerId);
            result = playerExists
              ? response.ok({
                  message: "Cromo actualizado de forma simulada",
                  requestedBy: user.username,
                  item: enrichSticker(updatedSticker)
                })
              : response.badRequest(
                  `No se puede actualizar el cromo: el playerId '${updatedSticker.playerId}' no existe`
                );
          } else {
            result = response.ok({
              message: "Cromo actualizado de forma simulada",
              requestedBy: user.username,
              item: enrichSticker(updatedSticker)
            });
          }
        }
      }
    } else if (method === "DELETE" && event.pathParameters?.id) {
      const sticker = stickers.find((item) => item.id === event.pathParameters.id);
      result = sticker
        ? response.ok({
            message: `El cromo '${event.pathParameters.id}' fue eliminado de forma simulada`,
            requestedBy: user.username
          })
        : response.notFound(`No se encontró el cromo con id '${event.pathParameters.id}'`);
    } else {
      result = response.notFound(`No existe la ruta ${method} ${path}`);
    }

    logger.logResult({
      route: path,
      method,
      statusCode: result.statusCode,
      username: user.username
    });
    return result;
  } catch (error) {
    logger.logError(error, event);
    return response.internalServerError();
  }
}

module.exports = {
  lambdaHandler
};

