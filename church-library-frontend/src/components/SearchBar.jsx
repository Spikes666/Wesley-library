// src/components/SearchBar.jsx
export default function SearchBar({ onSearch }) {
  return (
    <input
      type="text"
      placeholder="Search title, author, or publisher..."
      onChange={(e) => onSearch(e.target.value)}
      className="w-full p-2 border rounded-lg shadow-sm"
    />
  );
}
