import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function OwnerEarnings() {
  const [data, setData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/owner/earnings");
        setData(res.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Earnings</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total balance</p>
              <p className="text-3xl font-bold text-green-600">₹{(data.balance / 100).toFixed(0)}</p>
              <p className="mt-1 text-xs text-gray-400">Held until each slot is played; payouts via Razorpay Route in production.</p>
            </div>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              {data.transactions.length === 0 ? (
                <p className="p-6 text-gray-500">No earnings yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((t) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="px-4 py-3 capitalize">{t.type}</td>
                        <td className="px-4 py-3">{t.reason}</td>
                        <td className={`px-4 py-3 ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {t.amount >= 0 ? "+" : ""}₹{(t.amount / 100).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OwnerEarnings;