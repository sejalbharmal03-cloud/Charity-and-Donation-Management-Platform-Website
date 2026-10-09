export function About() {
  return (
    <section className="section page static-page">
      <div className="static-content">
        <span className="eyebrow">ABOUT US</span>

        <h1>
          Technology for a
          <br />
          <em>kinder world.</em>
        </h1>

        <p className="lead">
          CareConnect brings donors, volunteers, sponsors, and community
          projects together in one simple platform.
        </p>

        <div className="static-grid">
          <div className="static-card">
            <span>01</span>
            <h3>Connect</h3>
            <p>
              Bring people and meaningful causes together through one
              accessible platform.
            </p>
          </div>

          <div className="static-card">
            <span>02</span>
            <h3>Support</h3>
            <p>
              Make it easier for donors to discover campaigns and contribute
              to causes they care about.
            </p>
          </div>

          <div className="static-card">
            <span>03</span>
            <h3>Create impact</h3>
            <p>
              Turn individual contributions into meaningful community
              progress.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { messages } from "../../services/services";

export function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const response = await messages.create(form);

      if (response.data.success) {
        setFeedback("Your message has been sent successfully!");
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        setFeedback("Unable to send your message. Please try again.");
      }
    } catch (error) {
      setFeedback(
        error.response?.data?.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section page static-page">
      <div className="static-content">
        <span className="eyebrow">CONTACT</span>

        <h1>
          We would love to
          <br />
          <em>hear from you.</em>
        </h1>

        <p className="lead">
          Have a question about our campaigns, volunteering, or CareConnect?
          Send us a message.
        </p>

        <form className="contact-card" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Subject
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="General Inquiry"
            />
          </label>

          <label>
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>

          {feedback && <p role="status">{feedback}</p>}
        </form>
      </div>
    </section>
  );
}
