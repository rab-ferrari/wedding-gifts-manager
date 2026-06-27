import { useText } from "../context/SiteDataContext";
import "../styles/about.css";

export default function AboutPage() {
  const aboutTitle = useText("about_title");
  const aboutBody = useText("about_body");
  const privacyTitle = useText("privacy_title");
  const privacyBody = useText("privacy_body");

  return (
    <div className="about-page">
      <div className="about-page__boxes">
        <section className="about-box">
          <h2 className="about-box__title">{aboutTitle}</h2>
          <p className="about-box__text">{aboutBody}</p>
        </section>

        <section className="about-box">
          <h2 className="about-box__title">{privacyTitle}</h2>
          <p className="about-box__text">{privacyBody}</p>
        </section>
      </div>
    </div>
  );
}
