export default function Header({ onClose, title }) {
  return (
    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <span className="font-semibold">{title}</span>
      <button onClick={onClose}>✖</button>
    </div>
  );
}
