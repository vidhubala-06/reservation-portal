import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import { Html5Qrcode } from "html5-qrcode";

function StaffDashboard() {
    const [turf, setTurf] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState("");
    const scannerRef = useRef(null);

    const load = async () => {
        try {
            const res = await axios.get("/staff/turf");
            setTurf(res.data.turf);
            setBookings(res.data.bookings);
        } catch {
            /* ignore */
        }
    };
    useEffect(() => { load(); }, []);

    const stopScan = async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* ignore */ }
            scannerRef.current = null;
        }
        setScanning(false);
    };

    const submitToken = async (token) => {
        try {
            const res = await axios.post("/staff/checkin", { token });
            setResult("✅ " + res.data.message);
            load();
        } catch (e) {
            setResult("❌ " + (e.response?.data?.message || "Check-in failed"));
        }
    };

    const startScan = () => {
        setResult("");
        setScanning(true);
        setTimeout(async () => {
            const html5Qr = new Html5Qrcode("qr-reader");
            scannerRef.current = html5Qr;
            try {
                await html5Qr.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: 250 },
                    async (decodedText) => {
                        await stopScan();
                        await submitToken(decodedText);
                    },
                    () => { }
                );
            } catch (e) {
                setResult("Camera error: " + e.message);
                setScanning(false);
            }
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="mx-auto max-w-2xl px-6 py-10">
                <h2 className="text-2xl font-bold text-gray-900">{turf ? turf.name : "Staff Check-in"}</h2>
                {turf && <p className="mb-4 text-sm text-gray-500">{turf.location_address}</p>}

                {!scanning ? (
                    <button onClick={startScan} className="mb-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">
                        📷 Scan check-in QR
                    </button>
                ) : (
                    <div className="mb-4">
                        <div id="qr-reader" className="w-full max-w-sm" />
                        <button onClick={stopScan} className="mt-2 rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700">Stop</button>
                    </div>
                )}

                {result && <p className="mb-4 rounded-lg bg-white p-3 shadow-sm">{result}</p>}

                <h3 className="mb-2 font-semibold text-gray-800">Today's bookings</h3>
                {bookings.length === 0 ? (
                    <p className="text-gray-500">No bookings today.</p>
                ) : (
                    <div className="space-y-2">
                        {bookings.map((b) => (
                            <div key={b.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{b.customer_name}</p>
                                    <p className="text-sm text-gray-500">{b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)} · {b.customer_phone || "—"}</p>
                                </div>
                                {b.checked_in ? (
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Checked in ✓</span>
                                ) : (
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Pending</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StaffDashboard;