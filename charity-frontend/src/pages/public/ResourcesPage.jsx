
import { useEffect, useState } from "react";
import api from "../../services/api";

const sections = [
  { key: "documents", title: "Trust Registration & Tax Benefits" },
  { key: "reports", title: "Annual Reports" },
  { key: "awards", title: "Awards & Recognition" },
  { key: "gallery", title: "Photo Gallery" },
];

export default function ResourcesPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          sections.map(async (section) => {
            const response = await api.get(`/resources/${section.key}`);
            return [section.key, response.data.items || []];
          })
        );

        setData(Object.fromEntries(results));
      } catch (error) {
        console.error("Unable to load public resources", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const fileLink = (url) =>
    url?.startsWith("http://") || url?.startsWith("https://")
      ? url
      : `https://charity-and-donation-management-platform.onrender.com${url}`;

  if (loading) return <main className="resources-public"><p>Loading resources...</p></main>;

  return (
    <main className="resources-public">
      <header>
        <p>CARECONNECT • TRANSPARENCY</p>
        <h1>Trust, Transparency & Impact</h1>
        <p>Explore our published documents, annual reports, awards and activities.</p>
      </header>

      {sections.map((section) => (
        <section key={section.key} className="public-resource-section">
          <h2>{section.title}</h2>

          {(data[section.key] || []).length === 0 ? (
            <p>Resources will be added here soon.</p>
          ) : (
            <div className="public-resource-grid">
              {data[section.key].map((item) => (
                <article className="public-resource-card" key={item.id}>
                  {(item.photo_url || item.image_url) && (
                    <img
                      src={fileLink(item.photo_url || item.image_url)}
                      alt={item.title}
                      loading="lazy"
                    />
                  )}

                  <h3>{item.title}</h3>

                  {item.report_year && <p>Report year: {item.report_year}</p>}
                  {item.award_year && <p>Year: {item.award_year}</p>}
                  {item.organization && <p>{item.organization}</p>}
                  {item.description && <p>{item.description}</p>}

                  {(item.file_url || item.certificate_url) && (
                    <a
                      href={fileLink(item.file_url || item.certificate_url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View / Download
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}