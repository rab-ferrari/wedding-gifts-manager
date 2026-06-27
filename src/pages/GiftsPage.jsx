import { useText } from "../context/SiteDataContext";
import { useGifts } from "../hooks/useGifts";
import GiftCard from "../components/GiftCard";
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

  // Sort a copy, not the array from state directly -- [].sort() mutates
  // in place, which could cause subtle bugs if the same gifts array
  // reference is read or compared elsewhere. Gift ids are always
  // numeric, so a plain subtraction is the comparator.
  const sortedGifts = [...gifts].sort((a, b) => a.id - b.id);

  return (
    <div className="gifts-page">
      <h1 className="gifts-page__title">{title}</h1>

      {sortedGifts.length === 0 ? (
        <p className="gifts-page__empty">{emptyText}</p>
      ) : (
        <div className="gifts-page__list">
          {sortedGifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} />
          ))}
        </div>
      )}
    </div>
  );
}
