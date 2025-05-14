"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphql = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
//import { useServer } from 'graphql-ws/use/ws';
const schema_1 = require("@graphql-tools/schema");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const resolver_1 = require("./resolver");
const fs_1 = require("fs");
const admin = __importStar(require("firebase-admin"));
const typeDefs = (0, fs_1.readFileSync)("./schema.graphql", { encoding: "utf-8" });
const PORT = 4000;
const app = (0, express_1.default)();
async function startApolloServer() {
    /*
  app.use(
    '/',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        let user = null;
        if (token) {
          try {
            // Replace with admin.auth().verifyIdToken(token) for production
            user = { uid: 'sample-uid', email: 'user@example.com' };
          } catch (error) {
            console.error('Auth error:', error);
          }
        }
        return { user };
      },
    })
  );*/
    const httpServer = http_1.default.createServer(app);
    const schema = (0, schema_1.makeExecutableSchema)({ typeDefs, resolvers: resolver_1.resolvers });
    /*
    // Creating the WebSocket server
    const wsServer = new WebSocketServer({
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // Pass a different path here if app.use
        // serves expressMiddleware at a different path
        //path: '/subscriptions',
    });
    // Hand in the schema we just created and have the
    // WebSocketServer start listening.
    const serverCleanup = useServer({ schema }, wsServer);
    */
    const server = new server_1.ApolloServer({
        schema,
        plugins: [
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                        },
                    };
                },
            },
        ],
    });
    await server.start();
    // Apply CORS globally
    app.use((0, cors_1.default)({ origin: true }));
    // Apply the Apollo middleware
    app.use('/graphql', express_1.default.json(), 
    /*
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    })
    */
    (0, express4_1.expressMiddleware)(server, {
        context: async ({ req }) => {
            const token = req.headers.authorization || '';
            let user = null;
            if (token) {
                try {
                    // Replace with admin.auth().verifyIdToken(token) for production
                    // user = { uid: 'sample-uid', email: 'user@example.com' };
                    let decodedId = await admin.auth().verifyIdToken(token);
                    user = { uid: decodedId.uid, email: decodedId.email };
                    console.log('Decoded ID:', decodedId);
                }
                catch (error) {
                    console.error('Auth error:', error);
                }
            }
            return { user };
        },
    }));
    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    return { server, app };
}
startApolloServer();
exports.graphql = functions.https.onRequest(app);
