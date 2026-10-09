import { useEffect, useMemo, useState } from "react";
import { messages } from "../../services/services";

export default function Messages() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      setError("");
      const response = await messages.all();
      setItems(response.data.messages || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.name,
        item.email,
        item.subject,
        item.message,
        item.status,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [items, search]);

  const markAsRead = async (id) => {
    try {
      await messages.read(id);
      setItems((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, status: "read" } : item
        )
      );
    } catch {
      alert("Unable to update message status.");
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      await messages.remove(id);
      setItems((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch {
      alert("Unable to delete message.");
    }
  };

  return (
    <section className="section">
      <h1>Messages</h1>
      <p>Manage contact and feedback messages from users.</p>

      <input
        type="search"
        placeholder="Search name, email, subject or message..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{
          width: "100%",
          maxWidth: 500,
          padding: 12,
          margin: "16px 0",
        }}
      />

      {loading && <p>Loading messages...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <p>Total messages: {filteredMessages.length}</p>

          {filteredMessages.length === 0 ? (
            <p>No messages found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Sender",
                      "Email",
                      "Subject",
                      "Message",
                      "Date",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: "left",
                          padding: 10,
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredMessages.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: 10 }}>{item.name}</td>

                      <td style={{ padding: 10 }}>
                        <a href={`mailto:${item.email}`}>
                          {item.email}
                        </a>
                      </td>

                      <td style={{ padding: 10 }}>
                        {item.subject || "General Inquiry"}
                      </td>

                      <td style={{ padding: 10, minWidth: 220 }}>
                        {item.message}
                      </td>

                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "—"}
                      </td>

                      <td style={{ padding: 10 }}>
                        {item.status === "read" ? "Read" : "Unread"}
                      </td>

                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>
                        {item.status !== "read" && (
                          <button onClick={() => markAsRead(item.id)}>
                            Mark as Read
                          </button>
                        )}{" "}

                        <a
                          href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(
                            `Re: ${item.subject || "General Inquiry"}`
                          )}`}
                        >
                          Reply
                        </a>{" "}

                        <button onClick={() => deleteMessage(item.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

