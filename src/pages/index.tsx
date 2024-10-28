import { Route, Routes, useLocation } from "react-router-dom";
import { Home } from "./home";
import { Landing } from "./Landing";
import { NotFound } from "./not-found";

const routes = [
  { path: '/', Page: Landing },
  { path: '/home', Page: Home },
  { path: '/*', Page: NotFound }
];

function Routing() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      {routes.map(({ path, Page }) => (
        <Route key={path} path={path} element={<Page />} />
      ))}
    </Routes>
  );
}

export { Routing };
