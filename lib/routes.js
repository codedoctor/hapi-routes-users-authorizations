(function() {
  var Boom, Hoek, helperObjToRest, i18n, validationSchemas, _;

  _ = require('underscore');

  Boom = require('boom');

  Hoek = require("hoek");

  helperObjToRest = require('./helper-obj-to-rest');

  i18n = require('./i18n');

  validationSchemas = require('./validation-schemas');

  module.exports = function(plugin, options) {
    var fbUsernameFromRequest, fnRaise404, hapiOauthStoreMultiTenant, hapiUserStoreMultiTenant, methodsOauthAuth, methodsUsers;
    if (options == null) {
      options = {};
    }
    Hoek.assert(options._tenantId, i18n.optionsAccountIdRequired);
    Hoek.assert(options.baseUrl, i18n.optionsBaseUrlRequired);
    hapiOauthStoreMultiTenant = function() {
      return plugin.plugins['hapi-oauth-store-multi-tenant'];
    };
    Hoek.assert(hapiOauthStoreMultiTenant(), i18n.couldNotFindPluginOauth);
    hapiUserStoreMultiTenant = function() {
      return plugin.plugins['hapi-user-store-multi-tenant'];
    };
    Hoek.assert(hapiUserStoreMultiTenant(), i18n.couldNotFindPluginUser);
    methodsUsers = function() {
      return hapiUserStoreMultiTenant().methods.users;
    };
    methodsOauthAuth = function() {
      return hapiOauthStoreMultiTenant().methods.oauthAuth;
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
        return methodsUsers().getByNameOrId(options._tenantId, usernameOrIdOrMe, null, function(err, user) {
          var baseUrl, result;
          if (err) {
            return reply(err);
          }
          if (!user) {
            return fnRaise404(request, reply);
          }
          user.identities || (user.identities = []);
          baseUrl = "" + options.baseUrl + "/users/" + user._id + "/authorizations";
          result = {
            items: _.map(user.identities, function(x) {
              return helperObjToRest.identity(x, baseUrl);
            }),
            totalCount: user.identities.length,
            requestCount: user.identities.length,
            requestOffset: 0
          };
          return reply(result);
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
        return methodsUsers().getByNameOrId(options._tenantId, usernameOrIdOrMe, null, function(err, user) {
          var profile, provider, v1, v2;
          if (err) {
            return reply(err);
          }
          if (!user) {
            return fnRaise404(request, reply);
          }
          provider = request.payload.provider;
          v1 = request.payload.v1;
          v2 = request.payload.v2;
          profile = request.payload.profile || {};

          /*
          @TODO This does not work as expected.
           */
          return methodsUsers().addIdentityToUser(user._id, provider, v1, v2, profile, null, (function(_this) {
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
        return methodsUsers().getByNameOrId(options._tenantId, usernameOrIdOrMe, null, function(err, user) {
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
