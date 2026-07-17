function getAuthenticatedUser(event) {
  const claims = event.requestContext?.authorizer?.claims || {};

  return {
    username: claims["cognito:username"] || claims.username || "anonymous",
    sub: claims.sub || null,
    email: claims.email || null,
    claims
  };
}

module.exports = {
  getAuthenticatedUser
};

