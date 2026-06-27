import { useSiteData, useText } from "../context/SiteDataContext";
import "../styles/home.css";

export default function HomePage() {
  const { isLoading, error } = useSiteData();
  const title = useText("home_title");
  const date = useText("home_date");

  if (error) {
    return (
      <div className="home-page">
        <p>Não foi possível carregar o conteúdo da página.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="home-page" aria-busy="true" />;
  }

  return (
    <div className="home-page">
      <div className="home-page__hero">
        <div className="home-page__image-panel">
          <img
            className="home-page__image"
            src="assets/images/home_background_center.png"
            alt={title}
          />
          <div className="home-page__scrim-top" />
          <div className="home-page__overlay-text">
            <h1 className="home-page__title">{title}</h1>
            <p className="home-page__date">{date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
