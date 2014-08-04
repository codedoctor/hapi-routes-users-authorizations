(function() {
  var Boom, Hoek, helperObjToRest, i18n, validationSchemas, _;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  helperObjToRest = require('./helper-obj-to-rest');

  i18n = require('./i18n');

  validationSchemas = require('./validation-schemas');

  module.exports = function(plugin, options) {
    var fbUsernameFromRequest, fnRaise404, hapiIdentityStore, methodsOauthAuth, methodsUsers;
    if (options == null) {
      options = {};
    }
    Hoek.assert(options.accountId, i18n.optionsAccountIdRequired);
    Hoek.assert(options.baseUrl, i18n.optionsBaseUrlRequired);
    hapiIdentityStore = function() {
      return plugin.plugins['hapi-identity-store'];
    };
    Hoek.assert(hapiIdentityStore(), i18n.couldNotFindPlugin);
    methodsUsers = function() {
      return hapiIdentityStore().methods.users;
    };
    methodsOauthAuth = function() {
      return hapiIdentityStore().methods.oauthAuth;
    };
    Hoek.assert(methodsUsers(), i18n.couldNotFindMethodsUsers);
    Hoek.assert(methodsOauthAuth(), i18n.couldNotFindMethodsOauthAuth);
    fbUsernameFromRequest = function(request) {
      var usernameOrIdOrMe, _ref, _ref1;
      usernameOrIdOrMe = request.params.usernameOrIdOrMe;
      if (usernameOrIdOrMe.toLowerCase() === 'me') {
        if (!((_ref = request.auth) != null ? (_ref1 = _ref.credentials) != null ? _ref1.id : void 0 : void 0)) {
          return null;
        }
        usernameOrIdOrMe = request.auth.credentials.id;
      }
      return usernameOrIdOrMe;
    };
    fnRaise404 = function(request, reply) {
      return reply(Boom.notFound("" + i18n.notFoundPrefix + " " + options.baseUrl + request.path));
    };
    plugin.route({
      path: "/users/{usernameOrIdOrMe}/authorizations",
      method: "GET",
      config: {
        validate: {
          params: validationSchemas.paramsUsersAuthorizationsGet
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.authorizationRequired));
        }
        return methodsUsers().getByNameOrId(options.accountId, usernameOrIdOrMe, null, function(err, user) {
          var baseUrl, result;
          if (err) {
            return reply(err);
          }
          if (!user) {
            return fnRaise404(request, reply);
          }
          item.identities || (item.identities = []);
          baseUrl = "" + options.baseUrl + "/users/" + user._id + "/authorizations";
          return result = {
            items: _.map(item.identities, function(x) {
              return helperObjToRest.identity(x, baseUrl);
            }),
            totalCount: item.identities.length,
            requestCount: item.identities.length,
            requestOffset: 0
          };
        });
      }
    });
    plugin.route({
      path: "/users/{usernameOrIdOrMe}/authorizations",
      method: "POST",
      config: {
        validate: {
          params: validationSchemas.paramsUsersAuthorizationsPost,
          payload: validationSchemas.payloadUsersAuthorizationsPost
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.authorizationRequired));
        }
        return methodsUsers().getByNameOrId(options.accountId, usernameOrIdOrMe, null, function(err, user) {
          var accessToken, profile, provider, refreshToken;
          if (err) {
            return reply(err);
          }
          if (!user) {
            return fnRaise404(request, reply);
          }
          provider = request.payload.provider;
          accessToken = request.payload.accessToken;
          refreshToken = request.payload.refreshToken;
          profile = request.payload.profile || {};
          return methodsUsers().addIdentityToUser(user._id, provider, accessToken, refreshToken, profile, (function(_this) {
            return function(err, user, identity) {
              var baseUrl;
              if (err) {
                return reply(err);
              }
              baseUrl = "" + options.baseUrl + "/users/" + user._id + "/authorizations";
              return reply(helperObjToRest.identity(identity, baseUrl)).code(201);
            };
          })(this));
        });
      }
    });
    return plugin.route({
      path: "/users/{usernameOrIdOrMe}/authorizations/{authorizationId}",
      method: "DELETE",
      config: {
        validate: {
          params: validationSchemas.paramsUsersAuthorizationsDelete
        }
      },
      handler: function(request, reply) {
        var usernameOrIdOrMe;
        usernameOrIdOrMe = fbUsernameFromRequest(request);
        if (!usernameOrIdOrMe) {
          return reply(Boom.unauthorized(i18n.authorizationRequired));
        }
        return methodsUsers().getByNameOrId(options.accountId, usernameOrIdOrMe, null, function(err, user) {
          if (err) {
            return reply(err);
          }
          if (!user) {
            return reply().code(204);
          }
          return methodsUsers().removeIdentityFromUser(user._id, request.params.authorizationId, function(err) {
            if (err) {
              return reply(err);
            }
            return reply().code(204);
          });
        });
      }
    });
  };

}).call(this);

//# sourceMappingURL=routes.js.map
