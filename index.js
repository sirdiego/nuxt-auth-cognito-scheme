module.exports = function() {
  this.options.build.transpile.push("@sirdiego/nuxt-auth-cognito-scheme");

  this.options.auth = this.options.auth || {};
  this.options.auth.strategies = this.options.auth.strategies || {};
  this.options.auth.strategies.cognito =
    this.options.auth.strategies.cognito || {};
  this.options.auth.strategies.cognito.scheme =
    "@sirdiego/nuxt-auth-cognito-scheme/CognitoAuthScheme";
};

module.exports.meta = require("./package.json");
