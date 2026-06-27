import { useText } from "../context/SiteDataContext";
import { useGifts } from "../hooks/useGifts";
import { groupGiftsByPriceTier } from "../utils/priceTiers";
import PriceTierCard from "../components/PriceTierCard";
import "../styles/giftsPage.css";

export default function GiftsPage() {
  const title = useText("gifts_title");
  const emptyText = useText("gifts_empty");
  const { gifts, isLoading, error } = useGifts();

  if (error) {
    return (
      <div className="gifts-page">
        <h1 className="gifts-page__title">{title}</h1>
        <p className="gifts-page__empty">Não foi possível carregar os presentes.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="gifts-page" aria-busy="true">
        <h1 className="gifts-page__title">{title}</h1>
      </div>
    );
  }

  const tiers = groupGiftsByPriceTier(gifts);

  return (
    <div className="gifts-page">
      <h1 className="gifts-page__title">{title}</h1>

      {tiers.length === 0 ? (
        <p className="gifts-page__empty">{emptyText}</p>
      ) : (
        <div className="gifts-page__list">
          {tiers.map((tier) => (
            <PriceTierCard key={tier.priceKey} tier={tier} />
          ))}
        </div>
      )}
    </div>
  );
}
