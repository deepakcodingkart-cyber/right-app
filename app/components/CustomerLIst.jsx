// app/components/CustomerList.jsx
import { Link } from "@remix-run/react";

export default function CustomerList({ customers }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Customers</h2>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Phone</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="border px-4 py-2">{c.displayName}</td>
              <td className="border px-4 py-2">{c.email}</td>
              <td className="border px-4 py-2">{c.phone || "-"}</td>
              <td className="border px-4 py-2 space-x-2">
                <Link to={`/customers/${encodeURIComponent(c.id)}`}>View</Link>
                <Link to={`/customers/${encodeURIComponent(c.id)}.edit`}>
                  Edit
                </Link>
                <Link to={`/customers/${encodeURIComponent(c.id)}.delete`}>
                  Delete
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        to="/customers/new"
        className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        + New Customer
      </Link>
    </div>
  );
}
