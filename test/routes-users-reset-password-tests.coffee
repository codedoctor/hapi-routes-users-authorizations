assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'testing GET', ->
  server = null

  describe 'with server setup', ->

    beforeEach (cb) ->
      loadServer (err,serverResult) ->
        return cb err if err
        server = serverResult
        setupServer server,(err) ->
          cb err

    describe 'with NO users', ->
      describe 'GET /users/.../authorizations', ->
        describe 'with a non existent user', ->
          it 'should return a 404', (cb) ->
            options =
              method: "GET"
              url: "/users/#{fixtures.invalidUserId}/authorizations"
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 404
              should.exist result
              console.log JSON.stringify(result)
        
              cb null
