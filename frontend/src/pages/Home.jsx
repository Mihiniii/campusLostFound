import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "../api.js";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Handshake,
  MapPin,
  Megaphone,
  MessagesSquare,
  Package,
  Search,
  SearchX,
} from "lucide-react";
import ItemCard from "../components/ItemCard.jsx";

function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [lostResponse, foundResponse, categoryResponse] =
          await Promise.all([
            apiFetch("lost-items.php"),
            apiFetch("found-items.php"),
            apiFetch("categories.php"),
          ]);

        const lostData = await lostResponse.json();
        const foundData = await foundResponse.json();
        const categoryData = await categoryResponse.json();

        if (categoryData.success) {
          setCategories(categoryData.categories);
        }

        const lostItems = lostData.success
          ? lostData.items.map((item) => ({
              ...item,
              reportType: "lost",
            }))
          : [];

        const foundItems = foundData.success
          ? foundData.items.map((item) => ({
              ...item,
              reportType: "found",
            }))
          : [];

        const combinedItems = [
          ...lostItems,
          ...foundItems,
        ];

        combinedItems.sort(
          (a, b) =>
            new Date(b.created_at || b.item_date) -
            new Date(a.created_at || a.item_date)
        );

        setAllItems(combinedItems);
        setRecentItems(combinedItems.slice(0, 3));

      } catch (error) {
        console.error(
          "Failed to load recent reports:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Search
  const handleSearch = () => {
    const text = searchText.toLowerCase().trim();

    const results = allItems.filter((item) => {

      const matchesText =
        text === "" ||
        item.title?.toLowerCase().includes(text) ||
        item.location?.toLowerCase().includes(text) ||
        item.description?.toLowerCase().includes(text);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        item.category?.toLowerCase() ===
          selectedCategory.toLowerCase();

      return matchesText && matchesCategory;
    });

    setSearchResults(results);
    setShowResults(true);
  };

  // Search when pressing Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchText("");
    setSelectedCategory("All Categories");
    setSearchResults([]);
    setShowResults(false);
  };

  const lostCount = allItems.filter(
    (item) => item.reportType === "lost"
  ).length;

  const foundCount = allItems.length - lostCount;

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-inner">

          <div className="hero-content">

            <p className="hero-label">
              Campus Lost & Found
            </p>

            <h1>
              Lost something?
              <br />
              <span>Let's help you find it.</span>
            </h1>

            <p className="hero-description">
              Report lost items, find belongings and help your
              campus community return what matters.
            </p>

            <div className="hero-buttons">

              <Link
                to="/report-lost"
                className="primary-btn"
              >
                Report Lost Item
              </Link>

              <Link
                to="/report-found"
                className="secondary-btn"
              >
                Report Found Item
              </Link>

            </div>

            {/* Numbers from the current reports */}
            {!loading && allItems.length > 0 && (
              <div className="hero-stats">

                <div>
                  <strong>{lostCount}</strong>
                  <span>Lost items open</span>
                </div>

                <div>
                  <strong>{foundCount}</strong>
                  <span>Found items waiting</span>
                </div>

              </div>
            )}

          </div>

          {/* Latest reports shown as a stack of small cards */}
          {recentItems.length > 0 && (
            <div className="hero-visual" aria-hidden="true">

              {recentItems.map((item, index) => (
                <div
                  className={`hero-card hero-card-${index + 1}`}
                  key={`${item.reportType}-${item.id}`}
                >

                  <div className="hero-card-image">
                    {item.image_url ? (
                      <img
                        src={`${API_URL}/${item.image_url}`}
                        alt=""
                      />
                    ) : (
                      <Package size={22} strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="hero-card-text">

                    <span
                      className={
                        item.reportType === "lost"
                          ? "lost-badge"
                          : "found-badge"
                      }
                    >
                      {item.reportType === "lost"
                        ? "Lost"
                        : "Found"}
                    </span>

                    <strong>{item.title}</strong>

                    <small>
                      <MapPin size={12} />
                      {item.location}
                    </small>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </section>


      {/* Search Section */}
      <section className="search-section">

        <div className="search-panel">

          <h2>Find an Item</h2>

          <div className="search-box">

            <div className="search-input">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search by name, place or description..."
                value={searchText}
                onChange={(e) =>
                  setSearchText(e.target.value)
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }
            >
              <option>All Categories</option>

              {categories.map((category) => (
                <option key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button onClick={handleSearch}>
              Search
            </button>

          </div>

        </div>

        {/* Search Results */}
        {showResults && (
          <div className="home-search-results">

            <div className="search-results-header">

              <h3>
                Search Results ({searchResults.length})
              </h3>

              <button
                type="button"
                onClick={clearSearch}
              >
                Clear
              </button>

            </div>

            {searchResults.length === 0 ? (

              <div className="search-no-results">
                <SearchX size={36} strokeWidth={1.5} />

                <h3>
                  No items found
                </h3>

                <p>
                  Try another item name, location or category.
                </p>
              </div>

            ) : (

              <div className="items-grid">

                {searchResults.map((item) => (
                  <ItemCard
                    key={`${item.reportType}-${item.id}`}
                    item={item}
                    type={item.reportType}
                  />
                ))}

              </div>

            )}

          </div>
        )}

      </section>


      {/* Recent Reports */}
      <section className="items-section">

        <div className="section-heading">

          <div>
            <p>Recent Reports</p>

            <h2>
              Lost & Found Items
            </h2>
          </div>

          <Link
            to="/lost-items"
            className="view-all"
          >
            View All
            <ArrowRight size={16} />
          </Link>

        </div>


        {/* Loading */}
        {loading && (
          <div className="recent-loading">
            <div className="loading-spinner"></div>

            <p>
              Loading recent reports...
            </p>
          </div>
        )}


        {/* Empty */}
        {!loading && recentItems.length === 0 && (
          <div className="recent-empty">

            <div className="recent-empty-icon">
              <Package size={36} strokeWidth={1.5} />
            </div>

            <h3>
              No recent reports
            </h3>

            <p>
              There are no lost or found items reported yet.
            </p>

          </div>
        )}


        {/* Items */}
        {!loading && recentItems.length > 0 && (

          <div className="items-grid">

            {recentItems.map((item) => (
              <ItemCard
                key={`${item.reportType}-${item.id}`}
                item={item}
                type={item.reportType}
              />
            ))}

          </div>

        )}

      </section>


      {/* How It Works */}
      <section className="steps-section">

        <div className="section-heading">
          <div>
            <p>How It Works</p>

            <h2>
              Three steps to get it back
            </h2>
          </div>
        </div>

        <div className="steps-grid">

          <div className="step-card">
            <div className="step-icon">
              <Megaphone size={22} />
            </div>

            <h3>1. Report</h3>

            <p>
              Post what you lost or found with a photo, the date
              and the exact place on the map.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">
              <MessagesSquare size={22} />
            </div>

            <h3>2. Connect</h3>

            <p>
              Message the reporter privately or send a claim
              with details only the owner would know.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">
              <Handshake size={22} />
            </div>

            <h3>3. Return</h3>

            <p>
              Once the claim is accepted, arrange the handover
              and mark the item as returned.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;
