import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Map එක click කළාම location select කරන component එක
function LocationMarker({ setLatitude, setLongitude }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      setPosition([lat, lng]);
      setLatitude(lat);
      setLongitude(lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function ReportLostItem() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  // Map coordinates
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/categories.php"
        );

        const data = await response.json();

        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Category loading error:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Please login first.");
      return;
    }

    // Check map location
    if (latitude === null || longitude === null) {
      alert("Please select the lost location on the map.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("user_id", user.id);
      formData.append("title", title);
      formData.append("category_id", category);
      formData.append("location", location);

      // Send map coordinates
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      formData.append("item_date", date);
      formData.append("description", description);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(
        "http://localhost:8000/api/report-lost.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        setTitle("");
        setCategory("");
        setLocation("");

        // Reset map location
        setLatitude(null);
        setLongitude(null);

        setDate("");
        setDescription("");
        setImage(null);

        document.getElementById("item-image").value = "";
      }
    } catch (error) {
      console.error("Report lost item error:", error);
      alert("Could not connect to server.");
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">

        <h1>Report Lost Item</h1>

        <p>
          Provide details about the item you lost.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Item Name */}
          <label>Item Name</label>

          <input
            type="text"
            placeholder="e.g. Black iPhone 13"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />


          {/* Category */}
          <label>Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">
              Select category
            </option>

            {categories.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>


          {/* Location */}
          <label>Lost Location</label>

          <input
            type="text"
            placeholder="e.g. University Library"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />


          {/* Map */}
          <label>
            Select Exact Location on Map
          </label>

          <p
            style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            Click on the map to select where you lost the item.
          </p>

          <MapContainer
            center={[6.9271, 79.8612]}
            zoom={15}
            scrollWheelZoom={true}
            style={{
              width: "100%",
              height: "300px",
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />

          </MapContainer>


          {/* Selected Coordinates */}
          {latitude !== null && longitude !== null && (
            <p
              style={{
                fontSize: "13px",
                color: "#2563eb",
                marginBottom: "20px",
              }}
            >
              📍 Selected Location:{" "}
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}


          {/* Date */}
          <label>Date Lost</label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />


          {/* Photo */}
          <label>Photo</label>

          <input
            id="item-image"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files[0])
            }
          />


          {/* Description */}
          <label>Description</label>

          <textarea
            placeholder="Describe the item..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="5"
            required
          />


          {/* Submit */}
          <button type="submit">
            Report Lost Item
          </button>

        </form>

      </div>
    </div>
  );
}

export default ReportLostItem;