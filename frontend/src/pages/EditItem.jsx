import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL, apiFetch } from "../api.js";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Shows the saved location and moves the marker when the map is clicked
function LocationMarker({ latitude, longitude, setLatitude, setLongitude }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      setLatitude(lat);
      setLongitude(lng);
    },
  });

  return <Marker position={[latitude, longitude]} />;
}

function EditItem() {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = JSON.parse(localStorage.getItem("user"));

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Load the report and the categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemResponse, categoryResponse] = await Promise.all([
          apiFetch(`item-details.php?id=${id}`),
          apiFetch("categories.php"),
        ]);

        const itemData = await itemResponse.json();
        const categoryData = await categoryResponse.json();

        if (categoryData.success) {
          setCategories(categoryData.categories);
        }

        if (itemData.success) {
          const loaded = itemData.item;

          setItem(loaded);
          setTitle(loaded.title);
          setCategory(loaded.category_id || "");
          setLocation(loaded.location);
          setLatitude(Number(loaded.latitude));
          setLongitude(Number(loaded.longitude));
          setDate(loaded.item_date);
          setDescription(loaded.description || "");
        }
      } catch (error) {
        console.error("Failed to load report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("item_id", id);
      formData.append("title", title);
      formData.append("category_id", category);
      formData.append("location", location);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("item_date", date);
      formData.append("description", description);

      // Without a new photo the current one is kept
      if (image) {
        formData.append("image", image);
      }

      const response = await apiFetch("update-item.php", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        navigate(-1);
      }
    } catch (error) {
      console.error("Update report error:", error);
      alert("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="details-state">
        <div className="loading-spinner"></div>
        <p>Loading report...</p>
      </div>
    );
  }

  // Only the reporter or an admin can edit. The server checks this again.
  if (!item || !user || (!item.is_owner && user.role !== "admin")) {
    return (
      <div className="details-state">
        <h3>You cannot edit this report.</h3>
      </div>
    );
  }

  const isLost = item.type === "lost";

  return (
    <div className="form-page">
      <div className="form-card">

        <h1>Edit Report</h1>

        <p>
          Change the details of your {isLost ? "lost" : "found"} item report.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Item Name */}
          <label>Item Name</label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
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
          <label>{isLost ? "Lost Location" : "Found Location"}</label>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={150}
            required
          />

          {/* Map */}
          <label>
            Exact Location on Map
          </label>

          <p
            style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            Click on the map to move the marker.
          </p>

          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            scrollWheelZoom={true}
            style={{
              width: "100%",
              height: "300px",
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker
              latitude={latitude}
              longitude={longitude}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />

          </MapContainer>

          {/* Date */}
          <label>{isLost ? "Date Lost" : "Date Found"}</label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Photo */}
          <label>Photo</label>

          {item.image_url && (
            <img
              src={`${API_URL}/${item.image_url}`}
              alt={item.title}
              className="edit-current-photo"
            />
          )}

          <p
            style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            Choose a file only if you want to replace the photo.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files[0])
            }
          />

          {/* Description */}
          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="5"
            maxLength={2000}
            required
          />

          {/* Submit */}
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default EditItem;
