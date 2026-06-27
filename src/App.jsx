import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import GiftsPage from "./pages/GiftsPage";
import AboutPage from "./pages/AboutPage";
import { SiteDataProvider } from "./context/SiteDataContext";
import "./styles/theme.css";

export default function App() {
  return (
    <SiteDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/gifts" element={<GiftsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SiteDataProvider>
  );
}
