import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { users, campaigns, donations } from "../../services/services";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [campaignList, setCampaignList] = useState([]);
  const [donationList, setDonationList] = useState([]);
  const [donationStats, setDonationStats] = useState(null);
  const [donationTrend, setDonationTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const safeArray = (value, type = "") => {
    if (Array.isArray(value)) return value;

    if (!value || typeof value !== "object") {
      return [];
    }

    if (type === "campaigns") {
      if (Array.isArray(value.projects)) return value.projects;
      if (Array.isArray(value.campaigns)) return value.campaigns;

      if (value.data) {
        const nested = safeArray(value.data, "campaigns");
        if (nested.length > 0) return nested;
      }
    }

    if (type === "donations") {
      if (Array.isArray(value.donations)) return value.donations;

      if (value.data) {
        const nested = safeArray(value.data, "donations");
        if (nested.length > 0) return nested;
      }
    }

    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.results)) return value.results;
    if (Array.isArray(value.items)) return value.items;

    return [];
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          overviewRes,
          campaignsRes,
          donationsRes,
          statsRes,
          trendRes,
        ] = await Promise.all([
          users.overview(),
          campaigns.all(),
          donations.all(),
          donations.stats(),
          donations.trend(),
        ]);

        setOverview(
          overviewRes?.data?.data ||
            overviewRes?.data ||
            null
        );

        const campaignsData = safeArray(
          campaignsRes?.data,
          "campaigns"
        );

        setCampaignList(campaignsData);

        const donationsData = safeArray(
          donationsRes?.data,
          "donations"
        );

        setDonationList(donationsData);

        const statsData =
          statsRes?.data?.stats ||
          statsRes?.data?.data ||
          statsRes?.data ||
          null;

        setDonationStats(statsData);

        const trendData =
          trendRes?.data?.trend ||
          trendRes?.data?.monthly ||
          trendRes?.data?.data ||
          trendRes?.data ||
          [];

        setDonationTrend(
          Array.isArray(trendData)
            ? trendData
            : []
        );
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        setOverview(null);
        setCampaignList([]);
        setDonationList([]);
        setDonationStats(null);
        setDonationTrend([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-inner">
          <span className="loading-heart">♥</span>
          <strong>Loading dashboard...</strong>
          <span>Please wait a moment.</span>
        </div>
      </div>
    );
  }

  const completedDonations = donationList.filter(
    (donation) =>
      String(donation?.status || "").toLowerCase() ===
      "completed"
  );

  const totalRaisedFromDonations =
    completedDonations.reduce(
      (sum, donation) =>
        sum +
        Number(
          donation?.amount ||
            donation?.donation_amount ||
            donation?.total_amount ||
            0
        ),
      0
    );

  const totalRaised =
    Number(
      donationStats?.totalDonations ??
        donationStats?.totalRaised ??
        donationStats?.total_raised ??
        donationStats?.raised ??
        0
    ) || totalRaisedFromDonations;

  const totalDonationCount =
    Number(
      donationStats?.donationCount ??
        donationStats?.count ??
        donationStats?.total_donation_count ??
        0
    ) || completedDonations.length;

  const calculatedAverage =
    totalDonationCount > 0
      ? totalRaised / totalDonationCount
      : 0;

  const averageDonation =
    Number(
      donationStats?.averageDonation ??
        donationStats?.average_donation ??
        donationStats?.average ??
        0
    ) || calculatedAverage;

  const activeCampaigns = campaignList.filter(
    (campaign) =>
      String(campaign?.status || "").toLowerCase() ===
      "active"
  );

  const totalProjectGoal = campaignList.reduce(
    (sum, campaign) =>
      sum + Number(campaign?.goal || 0),
    0
  );

  const totalProjectRaised = campaignList.reduce(
    (sum, campaign) =>
      sum + Number(campaign?.raised || 0),
    0
  );

  const activeCampaignCount =
    activeCampaigns.length;

  const projectPercentage =
    totalProjectGoal > 0
      ? Math.min(
          (totalProjectRaised / totalProjectGoal) *
            100,
          100
        )
      : 0;

  const graphData = donationTrend
    .map((item) => {
      const year = item?.year;
      const month = item?.month;

      let label =
        item?.label ||
        item?.date ||
        "";

      if (year && month) {
        label = `${year}-${String(month).padStart(
          2,
          "0"
        )}`;
      }

      if (!label) {
        label = "Month";
      }

      return {
        label,
        amount: Number(
          item?.amount ??
            item?.total ??
            item?.value ??
            0
        ),
      };
    })
    .filter((item) => item.amount >= 0);

  const maxDonationValue = Math.max(
    ...graphData.map(
      (item) => item.amount
    ),
    1
  );

  const recentDonations = [...donationList]
    .sort((a, b) => {
      const dateA = new Date(
        a?.created_at ||
          a?.createdAt ||
          a?.date ||
          0
      );

      const dateB = new Date(
        b?.created_at ||
          b?.createdAt ||
          b?.date ||
          0
      );

      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div className="dashboard-page">

      {/* HERO */}
      <section className="dashboard-hero">

        <div className="hero-content">

          <span className="hero-label">
            CARECONNECT OVERVIEW
          </span>

          <h1>
            <span className="together-text">
              Together, we can
            </span>{" "}
            make a difference.
          </h1>

          <p>
            Manage campaigns, donations,
            volunteers and community impact
            from one place.
          </p>

          <div className="dashboard-hero-actions">

            <Link
              to="/admin/campaigns"
              className="dashboard-hero-button"
            >
              Manage campaigns →
            </Link>

            <Link
              to="/admin/donations"
              className="dashboard-hero-link"
            >
              View donations
            </Link>

          </div>

        </div>

        <div className="hero-heart">
          ♥
        </div>

      </section>


      {/* MISSION */}
      <section className="our-mission-section">

        <div className="mission-heading">

          <div>

            <small>
              OUR PURPOSE
            </small>

            <h2>
              Our Mission
            </h2>

            <p>
              We believe that every contribution,
              no matter how small, can create
              meaningful change.
            </p>

          </div>

        </div>


        <div className="mission-points">

          <div className="mission-card">

            <div className="mission-icon">
              ♥
            </div>

            <div>
              <h3>
                Better Communities
              </h3>

              <p>
                Supporting people and communities
                that need a helping hand.
              </p>
            </div>

          </div>


          <div className="mission-card">

            <div className="mission-icon">
              ♡
            </div>

            <div>
              <h3>
                Stronger Together
              </h3>

              <p>
                Connecting donors, volunteers
                and organizations for a common
                purpose.
              </p>
            </div>

          </div>


          <div className="mission-card">

            <div className="mission-icon">
              ✓
            </div>

            <div>
              <h3>
                Lasting Impact
              </h3>

              <p>
                Turning every contribution into
                positive and lasting change.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* STAT CARDS */}
      <section className="dashboard-stats">

        <div className="dashboard-stat-card">
          <span className="stat-icon">₹</span>

          <div>
            <small>TOTAL RAISED</small>

            <h3>
              ₹
              {totalRaised.toLocaleString(
                "en-IN"
              )}
            </h3>
          </div>
        </div>


        <div className="dashboard-stat-card">
          <span className="stat-icon">♥</span>

          <div>
            <small>TOTAL DONATIONS</small>

            <h3>
              {totalDonationCount}
            </h3>
          </div>
        </div>


        <div className="dashboard-stat-card">
          <span className="stat-icon">♙</span>

          <div>
            <small>AVERAGE DONATION</small>

            <h3>
              ₹
              {Math.round(
                averageDonation
              ).toLocaleString("en-IN")}
            </h3>
          </div>
        </div>


        <div className="dashboard-stat-card">
          <span className="stat-icon">◈</span>

          <div>
            <small>ACTIVE CAMPAIGNS</small>

            <h3>
              {activeCampaignCount}
            </h3>
          </div>
        </div>

      </section>


      {/* DONATION OVERVIEW + PROJECT STATUS */}
      <section className="dashboard-two-column">

        {/* DONATION OVERVIEW — KEEP AS IS */}

        <div className="dashboard-panel donation-overview-panel">

          <div className="panel-header">

            <div>

              <small>
                CONTRIBUTIONS
              </small>

              <h2>
                Donation Overview
              </h2>

            </div>

            <span className="panel-total">
              ₹
              {totalRaised.toLocaleString(
                "en-IN"
              )}
            </span>

          </div>


          <div className="donation-graph">

            {graphData.length > 0 ? (

              graphData.map(
                (item, index) => {

                  const height =
                    item.amount > 0
                      ? Math.max(
                          (item.amount /
                            maxDonationValue) *
                            100,
                          8
                        )
                      : 5;

                  return (
                    <div
                      className="donation-bar-column"
                      key={`${item.label}-${index}`}
                    >

                      <span className="donation-bar-value">
                        ₹
                        {item.amount.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      <div className="donation-bar-track">

                        <div
                          className="donation-bar-fill"
                          style={{
                            height:
                              `${height}%`,
                          }}
                        />

                      </div>

                      <span className="donation-bar-label">
                        {item.label}
                      </span>

                    </div>
                  );
                }
              )

            ) : (

              <div className="graph-empty">
                No donation data available.
              </div>

            )}

          </div>


          <div className="donation-bottom-stats">

            <div>

              <span>
                Total donations
              </span>

              <strong>
                {totalDonationCount}
              </strong>

            </div>


            <div>

              <span>
                Average donation
              </span>

              <strong>
                ₹
                {Math.round(
                  averageDonation
                ).toLocaleString("en-IN")}
              </strong>

            </div>

          </div>

        </div>


        {/* PROJECT STATUS */}

        <div className="dashboard-panel project-status-panel">

          <div className="panel-header">

            <div>

              <small>
                CAMPAIGN FUNDING
              </small>

              <h2>
                Project Status
              </h2>

            </div>

          </div>


          <div className="project-status-content">

            <div
              className="project-pie"
              style={{
                background:
                  `conic-gradient(
                    #237a57 0% ${projectPercentage}%,
                    #e5ece8 ${projectPercentage}% 100%
                  )`,
              }}
            >

              <div className="project-pie-center">

                <strong>
                  {projectPercentage.toFixed(1)}%
                </strong>

                <span>
                  funded
                </span>

              </div>

            </div>


            <div className="project-status-details">

              <div className="project-status-row">

                <span>
                  <i className="status-dot green-dot" />
                  Raised
                </span>

                <strong>
                  ₹
                  {totalProjectRaised.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div className="project-status-row">

                <span>
                  <i className="status-dot gray-dot" />
                  Goal
                </span>

                <strong>
                  ₹
                  {totalProjectGoal.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div className="project-progress">

                <div
                  style={{
                    width:
                      `${projectPercentage}%`,
                  }}
                />

              </div>


              <p>
                {activeCampaignCount} active
                campaigns are currently being
                managed through CareConnect.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* RECENT DONATIONS */}
      <section className="recent-donations-section">

        <div className="section-heading-row">

          <div>

            <small>
              CONTRIBUTIONS
            </small>

            <h2>
              Recent Donations
            </h2>

          </div>


          <Link
            to="/admin/donations"
            className="view-all-link"
          >
            View all →
          </Link>

        </div>


        <div className="recent-donations-card">

          {recentDonations.length > 0 ? (

            recentDonations.map(
              (donation, index) => {

                const donorName =
                  donation?.user_name ||
                  donation?.donor_name ||
                  donation?.name ||
                  donation?.user?.name ||
                  "Demo User";

                const amount =
                  Number(
                    donation?.amount ||
                    donation?.donation_amount ||
                    donation?.total_amount ||
                    0
                  );

                const status =
                  donation?.status ||
                  donation?.payment_status ||
                  "completed";

                const normalizedStatus =
                  String(status).toLowerCase();

                return (
                  <div
                    className="recent-donation-item"
                    key={
                      donation?.id ||
                      `donation-${index}`
                    }
                  >

                    <div className="donation-left">

                      <div className="donation-avatar">
                        ₹
                      </div>

                      <div className="donation-info">

                        <strong>
                          {donorName}
                        </strong>

                        <span>
                          Donation
                        </span>

                      </div>

                    </div>


                    <div className="donation-right">

                      <strong>
                        ₹
                        {amount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <span
                        className={`donation-status status-${normalizedStatus}`}
                      >
                        {status}
                      </span>

                    </div>

                  </div>
                );
              }
            )

          ) : (

            <div className="no-donations">
              No donations found.
            </div>

          )}

        </div>

      </section>

    </div>
  );
}