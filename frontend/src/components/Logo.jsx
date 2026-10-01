// The Campus Lost & Found logo: a map pin with a check mark
// ("found at this place") next to the name.
function Logo({ light = false }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>

      <svg
        className="brand-mark"
        viewBox="0 0 40 40"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
        </defs>

        <rect width="40" height="40" rx="11" fill="url(#brand-gradient)" />

        <path
          fill="#ffffff"
          d="M20 7.5c-5.8 0-10.5 4.5-10.5 10.2 0 6.9 8.3 13.7 9.7 14.8.5.4 1.1.4 1.6 0 1.4-1.1 9.7-7.9 9.7-14.8C30.500 12 25.800 7.500 20 7.500z"
        />

        <path
          fill="none"
          stroke="#4338ca"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.400 17.900l3.200 3.200 6-6.200"
        />
      </svg>

      <span className="brand-text">
        <span className="brand-name">Campus</span>
        <span className="brand-tagline">Lost &amp; Found</span>
      </span>

    </span>
  );
}

export default Logo;
