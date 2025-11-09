import api from "../utils/api";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Link } from "react-router-dom";
import { 
  Button,
  ButtonGroup,
  Rating,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Avatar,
  IconButton,
  Typography
} from "@mui/material";
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';


export default function OfferDetail({ offer, onDelete, onUpdate }) {
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const username = useCurrentUser()?.username;
  const profileUrl = `/users/${offer.owner}`;

  useEffect(() => {
    setDescription(offer.description);
  }, [offer]);

  const owner = offer.owner;
  const isOwner = username === owner;
  const avgRating = offer.avg_rating ? parseFloat(offer.avg_rating).toFixed(1) : 0;

  const updateOffer = async (event) => {
    event.preventDefault();
    await api
      .patch(`/offers/${offer.id}`, { description })
      .then((res) => {
        if (res.status === 202) {
          console.log("updated");
          setEditing(false);
        } else {
          console.log("error");
        }
        onUpdate(username);
      })
  };

  const deleteOffer = async () => {
    await api
      .delete(`/offers/${offer.id}`)
      .then((res) => {
        if (res.status === 204) {
          console.log("deleted");
        } else {
          console.log("error");
        }
        onDelete(username);
      })
  };

  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardHeader
        avatar={<Avatar src={offer.avatarUrl} />}
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={<Link to={profileUrl}>{owner}</Link>}
        subheader={offer.created_at}
      />
      <CardMedia
        component="img"
        height="194"
        image={`http://localhost:8000/${offer.images[0].data}`}
      />
      <CardContent>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {offer.description}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <Rating name="half-rating-read" defaultValue={avgRating} precision={0.5} readOnly/>
        <IconButton aria-label="add to favorites">
          <FavoriteIcon />
        </IconButton>
        <IconButton aria-label="share">
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
    <div className="w-full max-w-sm bg-white border border-gray-200
      rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      {/* <Carousel className="rounded-xl">
        {offer.images.map((image, index) => (
          <img
            key={index}
            src={`http://localhost:8000/${image.data}`}
            alt="Image Net"
            className="h-full w-full object-cover"
          />
        ))}
      </Carousel> */}
      <div className="px-5 pb-5">
        <h5 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          <Link to={profileUrl}>{owner}</Link>
        </h5>
        <p className="mb-4 text-base">{offer.description}</p>
        <div className="flex items-center">
          {isOwner && (
            <>
              <ButtonGroup color="success" variant="contained" aria-label="Basic button group">
                <Button onClick={() => setEditing(!editing)}>Edit</Button>
                <Button variant="contained" onClick={() => deleteOffer()}>Delete</Button>
              </ButtonGroup>
              {editing && (
                <UpdateOffer 
                  description={description}
                  setDescription={(e) => setDescription(e.target.value)}
                  updateOffer={(e) => updateOffer(e)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
}


function UpdateOffer({description, setDescription, updateOffer}) {
  return (
    <form className="max-w-sm mx-auto">
      <div className="mb-2 mt-2">
        <label htmlFor="avatar" className="block mb-2 text-sm font-medium text-gray-900">
          Description
        </label>
        <input type="description" id="description" 
          className="bg-gray-50 border border-gray-300 
          text-gray-900 text-sm rounded-lg 
          focus:ring-blue-500 focus:border-blue-500 block w-full 
          p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
          dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="description"
          value={description}
          onChange={setDescription} 
        />
      </div>
      <button onClick={updateOffer} 
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
        focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
        text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 
        dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        Submit
      </button>
    </form>
  );
}
