import { ApolloClient, InMemoryCache } from '@apollo/client';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { setContext } from '@apollo/client/link/context';

const uploadHttpLink = new UploadHttpLink({
  uri: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'apollo-require-preflight': 'true',
  }
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(uploadHttpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getTeams: {
            keyArgs: ["skip"], 
          },
        },
      },
    },
  }),
});