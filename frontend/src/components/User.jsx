import api from "../utils/api";
import { useEffect, useState } from "react";
import { REFRESH_TOKEN } from "../data/constants";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getItem, setAuthTokens } from "../utils/localstorage";
import { 
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid2,
  Typography,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import OfferPreview from "./OfferPreview";


export default function User({ slug }) {
  const [user, setUser] = useState({});

  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [editing, setEditing] = useState(false);
  const currUsername = useCurrentUser().username;

  // Dialog
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  const isCurrUser = currUsername === slug;
  const avatarUrl = encodeURI(`http://localhost:8000/${user.avatar}`);

  useEffect(() => {
    if (slug) {
      getUser(slug);
    }
  }, [slug]);

  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
  }, [user]);

  // get tokens
  const refreshToken = getItem(REFRESH_TOKEN);

  const getUser = async (username) => {
    await api
      .get(`/users/${username}`)
      .then((res) => res.data)
      .then((data) => setUser(data))
  };

  const editUser = async (event) => {
    event.preventDefault();

    // generate form data
    const formData = new FormData();
    if (username) {
      formData.append("username", username);
    }
    if (email) {
      formData.append("email", email);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }

    // send request
    const res = await api
      .patch(`/users/me`, formData)
      .then((res) => res.status)
  
    if (res === 202) {
      // If username is changed, refresh token
      if (username !== user.username) {
        const tokenData = {
          refresh_token: refreshToken,
          username: username,
        };
        await api
          .post("/auth/token/refresh", tokenData)
          .then((res) => {
            if (res.status === 200) {
              setAuthTokens(res.data.access_token, res.data.refresh_token);
              getUser(username);
              setEditing(false);
              navigate(`/users/${username}`);
            }
          })
      }
    }
  };

  const handleChatRedirect = async () => {
    await api
      // Get chat id based on user id
      .get("/chats/id", { params: { user_id: user.id } })
      .then(async (res) => {
        // If chat exists, redirect to chat
        if (res.status === 200) {
          await api
            .get(`/chats/${res.data}`)
            .then((res) => navigate(`/chats/${res.data.id}`))
        }
      })
      .catch(async (err) => {
        // If chat does not exist, create chat and redirect to chat
        await api
          .post("/chats", { user_id: user.id })
          .then((res) => navigate(`/chats/${res.data.id}`))
      });
  }

  const handleAvatarDialogOpen = () => {
    setOpen(true);
  };

  const handleAvatarDialogClose = (value) => {
    setOpen(false);
    setSelectedValue(value);
  };

  const userProps = { username, avatarUrl }

  return (
    <div className="m-5">
      <Card sx={{ maxWidth: 300 }}>
        <CardMedia
          component="img"
          alt="avatar"
          image={avatarUrl}
          onClick={handleAvatarDialogOpen}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {user.username}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {user.email}
          </Typography>
        </CardContent>
        <CardActions>
          {isCurrUser ? (
            <ButtonGroup color="success" aria-label="Basic button group">
              <Button onClick={() => setEditing(!editing)}>Edit</Button>
              <Button onClick={() => navigate("/offers")}>Add</Button>
            </ButtonGroup>
          ) : (
            <Button color="success" onClick={handleChatRedirect}>Message</Button>
          )}
        </CardActions>
      </Card>
      <div className="mt-5">
        <UserOffers user={userProps} />
      </div>
      <UserAvatarDialog
        selectedValue={selectedValue}
        open={open}
        onClose={handleAvatarDialogClose}
        onUpdate={(u) => getUser(u)}
      />
    </div>
  );

      // <div className="max-w-sm w-full lg:max-w-full lg:flex">
      //   <div
      //     className="h-48 lg:h-48 lg:w-48 flex-none bg-cover 
      //     rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden"
      //     style={{ backgroundImage: `url('${avatarUrl}')` }}
      //   ></div>
      //   <div
      //     className="border-r border-b border-l border-gray-400 lg:border-l-0 lg:border-t 
      //     lg:border-gray-400 bg-gray-900 rounded-b lg:rounded-b-none dark:text-white
      //     lg:rounded-r p-4 flex flex-col justify-between leading-tight"
      //   >
      //     <div className="mb-8">
      //       <div className="font-bold text-xl mb-2">{user.username}</div>
      //       <p className="text-base">{user.email}</p>
      //     </div>
      //     <div className="flex">
      //       {isCurrUser ? (
      //         <ButtonGroup color="success" variant="contained" aria-label="Basic button group">
      //           <Button onClick={() => navigate("/settings")}>Settings</Button>
      //           <Button onClick={() => setEditing(!editing)}>Edit</Button>
      //           <Button onClick={() => navigate("/offers")}>Add</Button>
      //           <Button onClick={() => navigate("/password")}>Password</Button>
      //         </ButtonGroup>
      //       ) : (
      //         <Button color="success" onClick={handleChatRedirect}>Message</Button>
      //       )}
      //     </div>
      //     {editing && (
      //       <EditUser
      //         handler={editUser}
      //         username={username}
      //         email={email}
      //         setUsername={setUsername}
      //         setEmail={setEmail}
      //         setAvatar={setAvatar}
      //       />
      //     )}
      //   </div>
      // </div>
      // 
}


function UserAvatarDialog({ onClose, selectedValue, open, onUpdate }) {
  const username = useCurrentUser().username;

  const handleClose = () => {
    onClose(selectedValue);
  };

  const deleteAvatar = async (value) => {
    await api
      .delete("/users/reset-avatar")
      .then((res) => {
        if (res.status === 204) {
          onClose(value);
          onUpdate(username);
        }
      })
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Choose an option:</DialogTitle>
      <List sx={{ pt: 0 }}>
        {['Change avatar', 'Delete avatar'].map((btn) => (
          <ListItem disablePadding key={btn}>
            <ListItemButton onClick={() => deleteAvatar(btn)}>
              <ListItemText primary={btn} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

function UserOffers({ user }) {
  const [offers, setOffers] = useState([]);
  const { username, avatarUrl } = user;

  useEffect(() => {
    if (username) {
      getOffers(username);
    }
  }, [user]);

  const getOffers = async (username) => {
    await api
      .get(`/users/${username}/offers`)
      .then((res) => res.data.items)
      .then((data) => {
        data.map((offer) => offer.avatarUrl = avatarUrl);
        setOffers(data);
      })
  };

  const listOffers = offers.map((item) => {
    return (
      <Grid2 key={item.id} size={4}>
        <OfferPreview
          offer={item}
          onDelete={(u) => getOffers(u)}
          onUpdate={(u) => getOffers(u)}
        />
      </Grid2>
    );
  });

  return <Grid2 container spacing={3}>{listOffers}</Grid2>;
}

function EditingFields({ field, value, type, onChange }) {
  return (
    <>
      <label
        htmlFor={field}
        className="block mb-2 text-sm font-medium text-gray-900"
      >
        {field}
      </label>
      <input
        id={field}
        type={type}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
          focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
          dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
          dark:focus:ring-blue-500 dark:focus:border-blue-500"
        value={value}
        onChange={onChange}
      />
    </>
  )
}


function EditUser({
  handler,
  username,
  email,
  setUsername,
  setEmail,
  setAvatar
}) {
  return (
    <form className="max-w-sm mx-auto" onSubmit={handler}>
      <div className="mb-2 mt-2">
        <EditingFields
          field={"username"}
          value={username}
          type={"username"}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <EditingFields
          field={"email"}
          value={email}
          type={"email"}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <EditingFields
          field={"avatar"}
          type={"file"}
          onChange={(e) => setAvatar(e.target.files[0])}
        />
      </div>
      <button
        type="submit"
        className="text-white bg-teal-500 hover:bg-teal-600 focus:ring-4 
        focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
        text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-teal-500
        dark:hover:bg-teal-600 dark:focus:ring-blue-800"
      >
        Submit
      </button>
    </form>
  );
}
