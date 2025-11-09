import OfferDetail from "../components/OfferDetail.jsx";
import api from "../utils/api.js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


export default function Offer() {
  const { offer_id } = useParams();
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    getOffer();
  }, [offer_id]);

  const getOffer = async () => {
    await api
      .get(`/offers/${offer_id}`)
      .then((res) => res.data)
      .then(async (data) => {
        await api
          .get(`/users/${data.owner}`)
          .then((res) => res.data.avatar)
          .then((avatar) => {
            data.avatarUrl = encodeURI(`http://localhost:8000/${avatar}`);
            setOffer(data);
          })
      })
  }

  if (!offer) {
    return <div>Loading...</div>
  }

  return (
    <div className="m-5">
      <OfferDetail
        offer={offer}
        onDelete={() => getOffer()}
        onUpdate={() => getOffer()}
      />
    </div>
  )
}
