// src/components/BookCard.jsx
export default function BookCard({ book }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-2">
      <h2 className="text-xl font-bold">{book.Title}</h2>
      <p className="text-gray-700">Author: {book.Author}</p>
      <p className="text-gray-600 text-sm">Publisher: {book.Publisher}</p>
      <p className="text-sm text-gray-500">Dewey: {book.DeweyDecimal}</p>
      <p className="text-sm text-gray-500">LCCN: {book.LCCN}</p>
    </div>
  );
}
