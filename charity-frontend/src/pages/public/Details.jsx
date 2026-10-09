import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { campaigns, donations } from "../../services/services";
import { useAuth } from "../../context/AuthContext";

export default function Details() {
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);

    campaigns
      .one(id)
      .then((response) => {
        setCampaign(response.data?.project || null);
      })
      .catch((error) => {
        console.error("Unable to load campaign:", error);
        setCampaign(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <section className="section page">
        <div className="empty">Loading campaign…</div>
      </section>
    );
  }

  if (!campaign) {
    return (
      <section className="section page">
        <div className="empty">
          <h2>Campaign not found</h2>
          <Link to="/campaigns">← Back to campaigns</Link>
        </div>
      </section>
    );
  }

  const raised = Number(campaign.raised || 0);
  const goal = Number(campaign.goal || 0);
  const progress = Math.min(
    Number(campaign.progress || 0),
    100
  );

  const image =
    campaign.image_url ||
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80";

  const donate = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!user) {
      setMessage("Please sign in before donating.");
      return;
    }

    const donationAmount = Number(amount);

    if (!donationAmount || donationAmount <= 0) {
      setMessage("Please enter a valid donation amount.");
      return;
    }

    try {
      setDonating(true);

      await donations.create({
        campaign_id: campaign.id,
        amount: donationAmount,
        payment_method: "online",
      });

      setMessage(
        "Donation submitted successfully. Thank you!"
      );

      setAmount("");

      // Refresh campaign data so raised amount updates immediately.
      const response = await campaigns.one(id);

      setCampaign(response.data?.project || campaign);
    } catch (error) {
      console.error("Donation error:", error);

      setMessage(
        error.response?.data?.message ||
          "Donation failed. Please try again."
      );
    } finally {
      setDonating(false);
    }
  };

  return (
    <section className="detail page">
      <div
        className="detailimg"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />

      <div className="detailbody">
        <Link
          to="/campaigns"
          className="backlink"
        >
          ← Back to campaigns
        </Link>

        <span className="tag">
          {campaign.category || "Cause"}
        </span>

        <h1>{campaign.title}</h1>

        <p>{campaign.description}</p>

        <div className="bigprogress">
          <i
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="row">
          <strong>
            ₹{raised.toLocaleString("en-IN")} raised
          </strong>

          <span>
            Goal ₹{goal.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="funding-info">
          <span>{progress}% funded</span>

          <span>
            ₹{Math.max(goal - raised, 0).toLocaleString("en-IN")}{" "}
            remaining
          </span>
        </div>

        <form
          className="donatebox"
          onSubmit={donate}
        >
          <h3>Make a contribution</h3>

          <p>
            Your contribution helps this campaign move closer
            to its goal.
          </p>

          <input
            type="number"
            min="1"
            step="1"
            placeholder="Donation amount (₹)"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            required
          />

          <button
            type="submit"
            className="primary"
            disabled={donating}
          >
            {donating ? "Processing…" : "Donate now"}
          </button>

          {message && (
            <small className="donation-message">
              {message}

              {!user && (
                <>
                  {" "}
                  <Link to="/login">Login</Link>
                </>
              )}
            </small>
          )}
        </form>
      </div>
    </section>
  );
}