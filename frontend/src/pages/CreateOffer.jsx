import React from "react";
import api from "../utils/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid2 as Grid,
  Container,
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';


export default function CreateOffer() {
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    type: 'apartment',
    phone: '',
    city: '',
    perHour: 0,
    perDay: 0,
    perMonth: 0,
    perYear: 0,
    images: null,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormValues((prev) => ({ ...prev, images: e.target.files }));
  };

  const createOffer = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", formValues.name);
    formData.append("description", formValues.description);
    formData.append("offer_type", formValues.type);
    formData.append("city", formValues.city);
    formData.append("phone", formValues.phone);

    const prices = {
      per_hour: formValues.perHour,
      per_day: formValues.perDay,
      per_month: formValues.perMonth,
      per_year: formValues.perYear,
    }
    formData.append("prices", JSON.stringify(prices));
    Array.from(formValues.images).forEach((image) => {
      formData.append("images", image)
    });
    await api
      .post("/offers", formData)
      .then((res) => { if (res.status === 201) navigate("/"); })
  };

  return (
    <div className="m-5">
      <Container maxWidth="sm">
        <form onSubmit={createOffer}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formValues.type}
                  onChange={handleChange}
                  label="Type"
                >
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="apartment">Apartment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>City</InputLabel>
                <Select
                  name="city"
                  value={formValues.city}
                  onChange={handleChange}
                  label="City"
                >
                  <MenuItem value="kyiv">Kyiv</MenuItem>
                  <MenuItem value="lviv">Lviv</MenuItem>
                  <MenuItem value="odessa">Odessa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {['perHour', 'perDay', 'perMonth', 'perYear'].map((field) => (
              <Grid size={3} key={field}>
                <TextField
                  fullWidth
                  label={field.replace('per', 'Per ')}
                  name={field}
                  value={formValues[field]}
                  onChange={handleChange}
                  type="number"
                  variant="outlined"
                />
              </Grid>
            ))}
            <Grid size={12}>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                color="teal"
                startIcon={<CloudUploadIcon />}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Create
              </Button>
            </Grid>
          </Grid>
        </form>
      </Container>
    </div>
  );
}