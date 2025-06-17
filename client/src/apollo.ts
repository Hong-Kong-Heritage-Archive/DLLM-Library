import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getAuth } from "firebase/auth";

// Firebase Auth instance
const auth = getAuth();

// Create an HttpLink for the GraphQL endpoint
const httpLink = new HttpLink({
  // uri: 'http://localhost:4000/graphql', // Replace with your Firebase Function URL
  //    uri: 'https://us-central1-dllm-libray.cloudfunctions.net/graphql', // Replace with your Firebase Function URL
  uri: "https://graphql-lkgxripzba-uc.a.run.app/graphql/",
});

// Middleware to add the Authorization header
const authLink = setContext(async (_, { headers }) => {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Combine the authLink and httpLink
const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
