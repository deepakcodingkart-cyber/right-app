export default function FormInput({ 
  label, 
  name, 
  type = "text", 
  defaultValue, 
  placeholder,
  required = false,
  textarea = false
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          style={{ 
            width: "100%", 
            padding: "0.5rem", 
            minHeight: 100,
            fontFamily: "inherit"
          }}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          style={{ 
            width: "100%", 
            padding: "0.5rem" 
          }}
        />
      )}
    </div>
  );
}