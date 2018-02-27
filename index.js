'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

/* 1 */
server.route({
    method: 'GET',
    path: '/hello/{name?}',
    handler: function (request, reply) {
        reply({"hello": request.params.name});
    }
});

/* 2 */
/*
 * Payload must be an JSON object containing a formated email and an alpha mdp
 * Format example : {email: a@a.fr, mdp:124}
 */
function wait2seconds() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ok:1});
      }, 2000);
    });
  }

server.route({
    method: 'POST',
    path: '/test',
    config: {
        handler: async function (request, reply) {
            const result = await wait2seconds();
            reply(result)
        },
        validate: {
          payload: {
            email: Joi.string().email().required(),
            mdp: Joi.number().integer().required()
          }
        }
      }
});

/* 3 */
/*
 * List must be given as parameter
 * Format example : [1,2,3]
 * POST: http://localhost:3000/cache/[24,1,2,3,4,3,2,13994]
 */

const mySort = async function (numbers, next) {
    numbers.sort(function (a,b) { return b - a });
    const result = await wait2seconds();
    return next(null, numbers);
}

server.method('sortNumbers', mySort, {
    cache: {
        expiresIn: 30 * 1000,
        generateTimeout: 4 * 1000
    },
    generateKey: function (array) {
        return array.join(',');
    }
});

server.route({
    method: 'POST',
    path: '/cache/{array}',
    config: {
        handler: function (request, reply) {
            var numbers = request.params.array;
            server.methods.sortNumbers(numbers, (err, result) => {
                if (err) {
                    return reply(err);
                }
                reply(result);
            });
        },
        validate: {
            params: {
                array: Joi.array().items(Joi.number())
            },
        }
      }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});