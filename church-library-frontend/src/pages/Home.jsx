// src/pages/Home.jsx
import { useEffect, useState } from "react";
import BookCard from "../components/BookCard";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [filtered, setFiltered] = useState([]);

useEffect(() => {
  fetch('/api/books')
    .then((res) => res.json())
    .then((data) => setBooks(data))
    .catch((err) => console.error("Error fetching books:", err));
}, []);

  const handleSearch = (query) => {
    const lower = query.toLowerCase();
    const filtered = books.filter((b) =>
      [b.Title, b.Author, b.Publisher].some((field) =>
        field?.toLowerCase().includes(lower)
      )
    );
    setFiltered(filtered);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Church Library</h1>
      <SearchBar onSearch={handleSearch} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {filtered.map((book, i) => (
          <BookCard key={i} book={book} />
        ))}
      </div>
    </div>
  );
}
