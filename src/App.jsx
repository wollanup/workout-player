import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import { Providers } from './app/Providers.jsx';
import { EditRoute, Layout, ListRoute, PlayRoute } from './app/routes.jsx';

// Hash URLs (#/s/<id>): work on GitHub Pages and offline without any server rewrite.
const routes = [{
  element: <Layout />,
  children: [
    { index: true, element: <ListRoute /> },
    { path: 's/:id', element: <EditRoute /> },
    { path: 's/:id/play', element: <PlayRoute /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
}];
const router = createHashRouter(routes);

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
