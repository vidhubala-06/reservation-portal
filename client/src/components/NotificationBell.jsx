import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function NotificationBell() {
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const res = await axios.get("/notifications");
      setUnread(res.data.notifications.filter((n) => !n.is_read).length);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <Link to="/notifications" className="relative text-lg text-gray-600 hover:text-green-600">
      🔔
      {unread > 0 && (
        <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </Link>
  );
}

export default NotificationBell;