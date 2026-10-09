import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { campaigns } from "../../services/services";

export default function Campaigns() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    campaigns
      .all()
      .then((response) => {
        setItems(response.data?.projects || []);
      })
      .catch((error) => {
        console.error("Unable to load campaigns:", error);
        setItems([]);
      });
  }, []);

  return (
    <section className="section page">
      <div className="campaigns-heading">
        <span className="eyebrow">OUR CAUSES</span>

        <h1>Campaigns that create change</h1>

        <p className="lead">
          Choose a cause you care about and make a direct difference.
        </p>
      </div>

      <div className="cards">
        {items.map((campaign) => {
          const raised = Number(campaign.raised || 0);
          const goal = Number(campaign.goal || 0);
          const progress = Math.min(
            Number(campaign.progress || 0),
            100
          );

          const image =
            campaign.image_url ||
            "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=900&q=80";

          return (
            <article className="campaign" key={campaign.id}>
              <div
                className="campaignimg"
                style={{
                  backgroundImage: `url(${image})`,
                }}
              />

              <div className="campaignbody">
                <span className="tag">
                  {campaign.category || "Cause"}
                </span>

                <h3>{campaign.title}</h3>

                <p>{campaign.description}</p>

                <div className="progress">
                  <i
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="row">
                  <strong>
                    ₹{raised.toLocaleString("en-IN")}
                  </strong>

                  <span>
                    {progress}% funded
                  </span>
                </div>

                <div className="campaign-meta">
                  <span>
                    Goal: ₹{goal.toLocaleString("en-IN")}
                  </span>
                </div>

                <Link to={`/campaigns/${campaign.id}`}>
                  View details →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {!items.length && (
        <div className="empty">
          No active campaigns found.
        </div>
      )}
    </section>
  );
}