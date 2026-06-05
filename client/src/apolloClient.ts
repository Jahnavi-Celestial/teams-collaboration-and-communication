import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_BACKEND_URL,
});

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("token");
  
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : "",
    },
  });
  
  return forward(operation);
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    resultCaching: false,
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
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      nextFetchPolicy: "network-only",
    },
    query: {
      fetchPolicy: "network-only",
    },
  },
});