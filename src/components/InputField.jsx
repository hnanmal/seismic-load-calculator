export default function InputField({ label, name, value, onChange }) {
    return (
      <div>
        <label className="block font-medium mb-1">{label}</label>
        <input
          type="number"
          step="any"
          name={name}
          value={value}
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
      </div>
    );
  }
  