
import { useEffect, useState } from "react";
import { resources } from "../../services/services";

const sections = [
  { key: "documents", label: "Trust Documents" },
  { key: "reports", label: "Annual Reports" },
  { key: "awards", label: "Awards" },
  { key: "gallery", label: "Photo Gallery" },
];

const emptyForm = {
  title: "",
  description: "",
  report_year: "",
  document_type: "registration",
  registration_number: "",
  organization: "",
  award_year: "",
  issue_date: "",
  expiry_date: "",
  event_date: "",
  is_published: false,
};

export default function Resources() {
  const [type, setType] = useState("documents");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadItems(selectedType = type) {
    setLoading(true);
    try {
      const response = await resources.adminList(selectedType);
      setItems(response.data.items || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Data load hot nahi. Login/token check kar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems(type);
  }, [type]);

  function changeField(event) {
    const { name, value, type: inputType, checked } = event.target;
    setForm((old) => ({
      ...old,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setFile(null);
    setPhoto(null);
    setCertificate(null);
    setEditingId(null);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item, is_published: Boolean(item.is_published) });
    setFile(null);
    setPhoto(null);
    setCertificate(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        data.append(key, String(value));
      }
    });

    if (file) data.append("file", file);
    if (photo) data.append("photo", photo);
    if (certificate) data.append("certificate", certificate);

    try {
      if (editingId) {
        await resources.update(type, editingId, data);
        setMessage("Record update zala!");
      } else {
        await resources.create(type, data);
        setMessage("Record add zala!");
      }

      resetForm();
      await loadItems(type);
    } catch (error) {
      setMessage(error.response?.data?.message || "Save karta ala nahi.");
    }
  }

  async function togglePublish(item) {
    try {
      await resources.update(type, item.id, {
        is_published: !Boolean(item.is_published),
      });
      await loadItems(type);
      setMessage("Publish status update zala.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Status update zala nahi.");
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`"${item.title}" delete karaycha ka?`)) return;

    try {
      await resources.remove(type, item.id);
      setMessage("Record delete zala.");
      if (editingId === item.id) resetForm();
      await loadItems(type);
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete karta ala nahi.");
    }
  }

  const showFile = type === "documents" || type === "reports";
  const isImageSection = type === "gallery";
  const isAward = type === "awards";

  return (
    <div className="resources-page">
      <div className="resources-heading">
        <div>
          <p className="resources-eyebrow">CARECONNECT ADMIN</p>
          <h1>Documents & Recognition</h1>
          <p>Certificates, reports, awards ani photos manage kar.</p>
        </div>
      </div>

      <div className="resources-tabs">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={type === section.key ? "resource-tab active" : "resource-tab"}
            onClick={() => {
              setType(section.key);
              resetForm();
              setMessage("");
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {message && <div className="resources-message">{message}</div>}

      <form className="resources-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Record" : `Add ${sections.find((s) => s.key === type)?.label}`}</h2>

        <label>
          Title *
          <input
            name="title"
            value={form.title}
            onChange={changeField}
            required
            maxLength={200}
          />
        </label>

        {type === "documents" && (
          <>
            <label>
              Document Type
              <select name="document_type" value={form.document_type} onChange={changeField}>
                <option value="registration">Trust Registration</option>
                <option value="tax_benefit">Tax Benefits</option>
                <option value="certification">Other Certification</option>
              </select>
            </label>
            <label>
              Registration Number
              <input name="registration_number" value={form.registration_number} onChange={changeField} />
            </label>
            <label>
              Issue Date
              <input type="date" name="issue_date" value={form.issue_date || ""} onChange={changeField} />
            </label>
            <label>
              Expiry Date
              <input type="date" name="expiry_date" value={form.expiry_date || ""} onChange={changeField} />
            </label>
          </>
        )}

        {type === "reports" && (
          <label>
            Report Year *
            <input
              name="report_year"
              value={form.report_year}
              onChange={changeField}
              placeholder="2024-25"
              required
            />
          </label>
        )}

        {isAward && (
          <>
            <label>
              Awarding Organization
              <input name="organization" value={form.organization} onChange={changeField} />
            </label>
            <label>
              Award Year
              <input
                type="number"
                name="award_year"
                min="1901"
                max="2155"
                value={form.award_year || ""}
                onChange={changeField}
              />
            </label>
          </>
        )}

        {isImageSection && (
          <label>
            Event Date
            <input type="date" name="event_date" value={form.event_date || ""} onChange={changeField} />
          </label>
        )}

        <label>
          Description
          <textarea name="description" rows="4" value={form.description || ""} onChange={changeField} />
        </label>

        {showFile && (
          <label>
            PDF File {type === "reports" && !editingId ? "*" : ""}
            <input
              type="file"
              accept=".pdf,application/pdf"
              required={type === "reports" && !editingId}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        )}

        {(isAward || isImageSection) && (
          <label>
            Photo (JPG, PNG, WebP)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>
        )}

        {isAward && (
          <label>
            Award Certificate (PDF)
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setCertificate(e.target.files?.[0] || null)}
            />
          </label>
        )}

        <label className="resources-publish">
          <input
            type="checkbox"
            name="is_published"
            checked={Boolean(form.is_published)}
            onChange={changeField}
          />
          Public website var publish kar
        </label>

        <div className="resources-actions">
          <button className="resources-save" type="submit">
            {editingId ? "Save Changes" : "Add Record"}
          </button>
          {editingId && (
            <button className="resources-cancel" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="resources-list">
        <h2>Saved Records</h2>

        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>Ajun records nahit. Varchya form madhun pahila record add kar.</p>
        ) : (
          items.map((item) => (
            <article className="resource-record" key={item.id}>
              <div className="resource-record-info">
                <strong>{item.title}</strong>
                <span>{item.report_year || item.award_year || item.document_type || ""}</span>
                <span className={item.is_published ? "resource-status published" : "resource-status"}>
                  {item.is_published ? "Published" : "Draft"}
                </span>
                {(item.file_url || item.photo_url || item.image_url) && (
                  <a
                    href={`http://localhost:5000${item.file_url || item.photo_url || item.image_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View file
                  </a>
                )}
              </div>
              <div className="resource-record-actions">
                <button type="button" onClick={() => startEdit(item)}>Edit</button>
                <button type="button" onClick={() => togglePublish(item)}>
                  {item.is_published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" className="resource-delete" onClick={() => deleteItem(item)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}