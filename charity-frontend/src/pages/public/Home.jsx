
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { campaigns } from "../../services/services";

export default function Home() {
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
    <div className="cc-home">
      <section className="cc-hero">
        <div className="cc-brand">
          <span className="cc-brand-icon">♡</span>
          <div>
            <strong>CareConnect</strong>
            <small>Together, we make a difference</small>
          </div>
        </div>

        <div className="cc-hero-content">
          <span className="cc-eyebrow">
            <span className="cc-dot" />
            MAKE AN IMPACT
          </span>

          <h1>
            Small acts.
            <br />
            <em>Big change.</em>
          </h1>

          <p>
            Every contribution can change a life. Discover causes,
            support communities and become part of something meaningful.
          </p>

          <div className="cc-actions">
            <Link to="/campaigns" className="cc-button cc-button-primary">
              Explore campaigns <span>→</span>
            </Link>

            <Link to="/register" className="cc-button cc-button-outline">
              Become a volunteer
            </Link>
          </div>

          <div className="cc-trust">
            <span>♡</span> Every act of kindness matters
          </div>
        </div>

        <div className="cc-hero-decoration" aria-hidden="true">
          <div className="cc-circle cc-circle-one" />
          <div className="cc-circle cc-circle-two" />
          <span className="cc-heart">♡</span>
        </div>
      </section>

      <section className="cc-impact">
        <div className="cc-section-heading">
          <div>
            <span className="cc-section-label">OUR COMMUNITY</span>
            <h2>Your impact matters</h2>
          </div>
          <span className="cc-heading-mark">✳</span>
        </div>

        <div className="cc-stats-grid">
          <div className="cc-stat-card">
            <span className="cc-stat-icon">♡</span>
            <strong>50+</strong>
            <span>Lives supported</span>
            <small>Making care count</small>
          </div>

          <div className="cc-stat-card">
            <span className="cc-stat-icon">✳</span>
            <strong>25+</strong>
            <span>Active campaigns</span>
            <small>Causes that matter</small>
          </div>

          <div className="cc-stat-card">
            <span className="cc-stat-icon">♧</span>
            <strong>1000+</strong>
            <span>Community donors</span>
            <small>Kindness in action</small>
          </div>

          <div className="cc-stat-card">
            <span className="cc-stat-icon">⌂</span>
            <strong>15+</strong>
            <span>Partner organizations</span>
            <small>Stronger together</small>
          </div>
        </div>
      </section>

      <section className="cc-causes">
        <div className="cc-section-heading">
          <div>
            <span className="cc-section-label">MAKE A DIFFERENCE</span>
            <h2>Featured causes</h2>
            <p>Find a cause close to your heart.</p>
          </div>

          <Link to="/campaigns" className="cc-view-all">
            View all campaigns <span>→</span>
          </Link>
        </div>

        <div className="cc-cause-grid">
          <Link to="/campaigns" className="cc-cause-card cc-cause-community">
            <span className="cc-cause-icon">♡</span>
            <div>
              <span className="cc-cause-label">CARE FOR PEOPLE</span>
              <h3>Community care</h3>
              <p>Help families and communities access the support they need.</p>
              <span className="cc-cause-link">Explore campaigns →</span>
            </div>
            <span className="cc-cause-number">01</span>
          </Link>

          <Link to="/campaigns" className="cc-cause-card cc-cause-animals">
            <span className="cc-cause-icon">♧</span>
            <div>
              <span className="cc-cause-label">PROTECT ANIMALS</span>
              <h3>Animal welfare</h3>
              <p>Support animal care, rescue and a safer life for every animal.</p>
              <span className="cc-cause-link">Explore campaigns →</span>
            </div>
            <span className="cc-cause-number">02</span>
          </Link>
        </div>

        <div className="cc-live-campaigns">
          <div className="cc-section-heading">
            <div>
              <span className="cc-section-label">YOUR HELP GOES FURTHER</span>
              <h2>Campaigns that need you</h2>
            </div>
            <Link to="/campaigns" className="cc-view-all">
              View all →
            </Link>
          </div>

          <div className="cc-live-grid">
            {items.slice(0, 3).map((campaign) => (
              <article className="cc-live-card" key={campaign.id}>
                <div
                  className="cc-live-image"
                  style={{
                    backgroundImage: campaign.image_url
                      ? `url(${campaign.image_url})`
                      : "linear-gradient(135deg, #d9eee1, #f0f5df)",
                  }}
                >
                  {!campaign.image_url && <span>♡</span>}
                </div>

                <div className="cc-live-body">
                  <span className="cc-campaign-tag">
                    {campaign.category || "Community"}
                  </span>
                  <h3>{campaign.title}</h3>
                  <p>{(campaign.description || "").slice(0, 100)}</p>
                  <Link to={`/campaigns/${campaign.id}`}>
                    Support this cause →
                  </Link>
                </div>
              </article>
            ))}

            {!items.length && (
              <p className="cc-no-campaigns">
                New campaigns will appear here soon. Visit our campaigns page
                to discover ways to help.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="cc-cta">
        <span>♡</span>
        <h2>A little kindness can go a long way.</h2>
        <p>Be part of a community that turns compassion into action.</p>
        <Link to="/campaigns" className="cc-button cc-button-primary">
          Find your cause →
        </Link>
      </section>
    </div>
  );
}