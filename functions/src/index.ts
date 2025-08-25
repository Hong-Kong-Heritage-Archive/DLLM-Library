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
import { getLoginUserFromToken } from './platform';
import { handleHomePageSSR, handleItemDetailSSR } from './ssrService';
import { isBotRequest, getBotType } from './botDetection';

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
            let loginUser = null;
            if (token) {
              loginUser = await getLoginUserFromToken(token);
              console.log('Login user:', loginUser);
            }
            console.log('user', loginUser);
            return { loginUser };
          },
        }));

  // Set up SSR routes
  app.get('/', handleHomePageSSR);
  
  // Handle /item and /item/:id with bot detection
  app.get('/item/:id', (req, res) => {
    if (isBotRequest(req)) {
      console.log(`Bot detected (${getBotType(req)}) for /item/${req.params.id} - serving SSR`);
      handleItemDetailSSR(req, res);
    } else {
      console.log(`Regular browser detected for /item/${req.params.id} - redirecting to CSR`);
      // Redirect to the client-side app
      res.redirect(302, `/?redirect=/item/${req.params.id}`);
    }
  });
  
  // Handle /item page (listing)
  app.get('/item', (req, res) => {
    if (isBotRequest(req)) {
      console.log(`Bot detected (${getBotType(req)}) for /item - serving SSR home page`);
      handleHomePageSSR(req, res);
    } else {
      console.log(`Regular browser detected for /item - redirecting to CSR`);
      // Redirect to the client-side app
      res.redirect(302, '/?redirect=/item');
    }
  });

  // For local development, we need to listen on a port
  if (process.env.NODE_ENV !== 'production') {
    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  }
  return { server, app };
}

startApolloServer();

export const graphql = functions.https.onRequest(app);