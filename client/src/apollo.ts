import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
//  uri: 'http://localhost:4000/graphql', // Replace with your Firebase Function URL
//    uri: 'https://us-central1-dllm-libray.cloudfunctions.net/graphql', // Replace with your Firebase Function URL
    uri: 'https://graphql-lkgxripzba-uc.a.run.app/graphql/',
  cache: new InMemoryCache(),
});

export default client;