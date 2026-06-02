import { ApolloProvider } from '@apollo/client/react';
import { client } from './apolloClient';
import { useEffect } from 'react';
import { socket } from './socket';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/AppRoutes';

const App = () => {
  useEffect(()=>{
    if(localStorage.getItem('token')){
      socket.connect()
    }
  }, [])

  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  )
}

export default App