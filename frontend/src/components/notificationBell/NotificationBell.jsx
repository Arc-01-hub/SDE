import { useState, useEffect, useRef } from "react";
import { IoIosNotificationsOutline } from "react-icons/io";
import { MdCheck, MdClose } from "react-icons/md";
import api from "../api/api";
import "./NotificationBell.css";

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const bellRef = useRef(null);
  const userId = localStorage.getItem("userId");

  const fetchInvitations = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const resp = await api.get(`/invitations/${userId}`);
      setInvitations(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleAccept = async (invId) => {
    setActionLoading(invId + "accept");
    try {
      await api.put(`/invitations/${invId}/accept`);
      setInvitations((prev) => prev.filter((i) => i._id !== invId));
      setOpen(false);
      // ✅ Force full page reload so project details refreshes collaborators
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invId) => {
    setActionLoading(invId + "decline");
    try {
      await api.put(`/invitations/${invId}/decline`);
      setInvitations((prev) => prev.filter((i) => i._id !== invId));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const count = invitations.length;

  return (
    <div className="notif-wrap" ref={bellRef}>
      <button
        className="notification-btn"
        aria-label="Notifications"
        onClick={() => { setOpen((p) => !p); if (!open) fetchInvitations(); }}
      >
        <IoIosNotificationsOutline size={32} />
        {count > 0 && <span className="notif-badge">{count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {count > 0 && <span className="notif-count">{count} pending</span>}
          </div>

          {loading ? (
            <div className="notif-empty">Loading...</div>
          ) : count === 0 ? (
            <div className="notif-empty">No new notifications</div>
          ) : (
            <div className="notif-list">
              {invitations.map((inv) => (
                <div key={inv._id} className="notif-item">
                  <div className="notif-avatar">
                    {inv.sender?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="notif-body">
                    <p className="notif-text">
                      <strong>{inv.sender?.username}</strong> invited you to collaborate on{" "}
                      <strong>{inv.project?.title}</strong>
                    </p>
                    <div className="notif-actions">
                      <button
                        className="notif-btn accept"
                        onClick={() => handleAccept(inv._id)}
                        disabled={actionLoading === inv._id + "accept"}
                      >
                        <MdCheck size={13} />
                        {actionLoading === inv._id + "accept" ? "..." : "Accept"}
                      </button>
                      <button
                        className="notif-btn decline"
                        onClick={() => handleDecline(inv._id)}
                        disabled={actionLoading === inv._id + "decline"}
                      >
                        <MdClose size={13} />
                        {actionLoading === inv._id + "decline" ? "..." : "Decline"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};