import * as functions from 'firebase-functions';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
//import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import http from 'http';
import cors from 'cors';
import { resolvers } from './resolver';
import { readFileSync } from "fs";
import * as admin from 'firebase-admin';

const typeDefs = readFileSync("./schema.graphql", { encoding: "utf-8" });

const PORT = 4000;

const app = express();

async function startApolloServer() {

    const httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });
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
    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
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
    app.use(cors({ origin: true }));

    // Apply the Apollo middleware
    app.use(
        '/graphql',
        express.json(),
        expressMiddleware(server, {
          context: async ({ req }) => {
            const token = req.headers.authorization?.split(' ')[1] || ''; // Extract the token from the "Authorization" header
            console.log('Token:', token);      
            let user = null;
            if (token) {
              try {
                // Replace with admin.auth().verifyIdToken(token) for production
                // user = { uid: 'sample-uid', email: 'user@example.com' };
                let decodedId = await admin.auth().verifyIdToken(token);
                user = { uid: decodedId.uid, email: decodedId.email };        
                console.log('Decoded ID:', decodedId);
              } catch (error) {
                console.error('Auth error:', error);
              }
            }
            console.log('user', user);
            return { user };
          },
        }));

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    return { server, app };
}

startApolloServer();

export const graphql = functions.https.onRequest(app);