// app/components/CustomerForm.jsx
export default function CustomerForm({ customer }) {
  return (
    <form method="post" className="p-4 space-y-4">
      <div>
        <label className="block">Name</label>
        <input
          type="text"
          name="displayName"
          defaultValue={customer?.displayName}
          className="border px-3 py-2 w-full"
          required
        />
      </div>
      <div>
        <label className="block">Email</label>
        <input
          type="email"
          name="email"
          defaultValue={customer?.email}
          className="border px-3 py-2 w-full"
        />
      </div>
      <div>
        <label className="block">Phone</label>
        <input
          type="text"
          name="phone"
          defaultValue={customer?.phone}
          className="border px-3 py-2 w-full"
        />
      </div>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </form>
  );
}
