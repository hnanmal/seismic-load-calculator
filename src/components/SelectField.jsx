export default function SelectField({ label, name, value, options, onChange }) {
    return (
      <div>
        <label className="block font-medium mb-1">{label}</label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="border p-2 rounded w-full"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }
  