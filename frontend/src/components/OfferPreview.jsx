import { Link } from "react-router-dom";
import {
  Avatar,
  Card,
  CardActions,
  CardHeader,
  CardMedia,
  IconButton,  
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';


export default function OfferPreview({ offer }) {
  const owner = offer.owner;
  const firstOfferImage = "http://localhost:8000/" + offer.images[0]?.data;
  const offerUrl = `/offers/${offer.id}`;
  const profileUrl = `/users/${offer.owner}`;

  return (
    <Card sx={{ maxWidth: "auto" }}>
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
      <Link to={offerUrl}>
        <CardMedia
          component="img"
          height="194"
          image={firstOfferImage}
          alt="Paella dish"
        />
      </Link>
      <CardActions disableSpacing>
        <IconButton aria-label="add to favorites">
          <FavoriteIcon />
        </IconButton>
        <IconButton aria-label="share">
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};