import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [recentItems, setRecentItems] = useState([]);
  const [allItems, setAllItems] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [lostResponse, foundResponse] = await Promise.all([
          fetch("http://localhost:8000/api/lost-items.php"),
          fetch("http://localhost:8000/api/found-items.php"),
        ]);

        const lostData = await lostResponse.json();
        const foundData = await foundResponse.json();

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

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">

          <p className="hero-label">
            CAMPUS LOST & FOUND
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

        </div>
      </section>


      {/* Search Section */}
      <section className="search-section">

        <h2>Find an Item</h2>

        <div className="search-box">

          <input
            type="text"
            placeholder="Search for an item..."
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value)
            }
          >
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Documents</option>
            <option>Accessories</option>
            <option>Books</option>
            <option>Other</option>
          </select>

          <button onClick={handleSearch}>
            Search
          </button>

        </div>

        {/* Search Results */}
        {showResults && (
          <div className="home-search-results">

            <div className="search-results-header">

              <h3>
                Search Results
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
                <span>🔍</span>

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

                  <div
                    className="item-card"
                    key={`${item.reportType}-${item.id}`}
                    onClick={() =>
                      navigate(`/item/${item.id}`)
                    }
                  >

                    {/* Image */}
                    <div className="item-image">

                      {item.image_url ? (
                        <img
                          src={`http://localhost:8000/${item.image_url}`}
                          alt={item.title}
                        />
                      ) : (
                        <span>📦</span>
                      )}

                    </div>

                    {/* Badge */}
                    <span
                      className={
                        item.reportType === "lost"
                          ? "lost-badge"
                          : "found-badge"
                      }
                    >
                      {item.reportType === "lost"
                        ? "LOST"
                        : "FOUND"}
                    </span>

                    {/* Title */}
                    <h3>
                      {item.title}
                    </h3>

                    {/* Location */}
                    <p>
                      📍 {item.location}
                    </p>

                    {/* Category */}
                    <small className="recent-category">
                      {item.category}
                    </small>

                  </div>

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
            <p>RECENT REPORTS</p>

            <h2>
              Lost & Found Items
            </h2>
          </div>

          <Link
            to="/lost-items"
            className="view-all"
          >
            View All
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
              📦
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

              <div
                className="item-card"
                key={`${item.reportType}-${item.id}`}
                onClick={() =>
                  navigate(`/item/${item.id}`)
                }
              >

                {/* Image */}
                <div className="item-image">

                  {item.image_url ? (
                    <img
                      src={`http://localhost:8000/${item.image_url}`}
                      alt={item.title}
                    />
                  ) : (
                    <span>📦</span>
                  )}

                </div>


                {/* Badge */}
                <span
                  className={
                    item.reportType === "lost"
                      ? "lost-badge"
                      : "found-badge"
                  }
                >
                  {item.reportType === "lost"
                    ? "LOST"
                    : "FOUND"}
                </span>


                {/* Title */}
                <h3>
                  {item.title}
                </h3>


                {/* Location */}
                <p>
                  📍 {item.location}
                </p>


                {/* Category */}
                <small className="recent-category">
                  {item.category}
                </small>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Home;