import api from "../utils/api";
import User from "../components/User";
import Company from "../components/Company";
import OfferPreview from "../components/OfferPreview";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


function CompanyOffers({ currUser }) {
  const [company, setCompany] = useState([]);
  const [offers, setOffers] = useState([]);
  const username = currUser;

  useEffect(() => {
    getCompany(username);
    getOffers(username);
  }, [username]);

  const getCompany = async (name) => {
    await api
      .get(`/companies/${name}`)
      .then((res) => res.data)
      .then((data) => setCompany(data))
  };

  const getOffers = async (name) => {
    await api
      .get(`/companies/${name}/offers`)
      .then((res) => res.data)
      .then((data) => setOffers(data))
  };

  const listOffers = offers.map((item) => (
    <div
      className="mx-3 mt-6 flex flex-col rounded-lg bg-white 
      text-surface shadow-secondary-1 
      dark:bg-surface-dark dark:text-white 
      sm:shrink-0 sm:grow sm:basis-0"
      key={item.id}
    >
      <OfferPreview
        offer={item}
        onDelete={(u) => getOffers(u)}
        onUpdate={(u) => getOffers(u)}
      />
    </div>
  ));
  return (
    <>
      <div className="m-5">
        <Company
          company={company}
          onUpdate={(u) => getCompany(u)}
        />
        <div className="grid-cols-1 sm:grid md:grid-cols-3 ">
          {listOffers}
        </div>
      </div>
    </>
  );
}

export default function Profile() {
  const { name } = useParams();
  const url = window.location.href.includes("users");

  return (
    <div>
      {url ? (
        <User slug={name} />
      ) : (
        <CompanyOffers currUser={name} />
      )}
    </div>
  );
}
