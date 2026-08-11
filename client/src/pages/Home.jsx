import { useNavigate } from "react-router-dom";

const EMBLEM_SRC = "/images/sri-lanka-emblem.svg";
const FLAG_SRC = "/images/flag.png";

export default function Home() {
  const navigate = useNavigate();

  const services = [
    {
      key: "passport",
      icon: "🛂",
      title: "Passport Services",
      description: "Individual and family passport appointments.",
      note: "5-minute slots",
      path: "/passport",
    },
    {
      key: "birth",
      icon: "📜",
      title: "Birth Certificate",
      description: "Book an appointment for birth certificate related services.",
      note: "15-minute slots",
      path: "/birth-certificate",
    },
    {
      key: "other",
      icon: "🏛",
      title: "Other Consular Services",
      description: "Book document, attestation and other consular appointments.",
      note: "30-minute slots",
      path: "/other-services",
    },
  ];

  return (
    <div className="home-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        button { font: inherit; }

        .home-root {
          min-height: 100vh;
          background: #f8f6f1;
          color: #17213a;
          font-family: 'DM Sans', sans-serif;
        }

        .gold-line { height: 4px; background: #e7ad18; }

        .official-header {
          background: #fff;
          border-bottom: 1px solid #e7e2d8;
        }

        .official-header-inner {
          width: min(1500px, calc(100% - 64px));
          min-height: 138px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .official-brand {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .official-emblem {
          width: 74px;
          height: 92px;
          object-fit: contain;
        }

        .official-kicker {
          color: #7d002f;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .19em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .official-title {
          color: #151b31;
          font-size: 27px;
          font-weight: 700;
        }

        .official-subtitle {
          margin-top: 6px;
          color: #756b66;
          font-size: 16px;
        }

        .official-right {
          display: flex;
          align-items: center;
          gap: 28px;
          text-align: right;
        }

        .official-right-label {
          color: #8d8582;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .official-right-title {
          margin-top: 7px;
          color: #7d002f;
          font-size: 16px;
          font-weight: 700;
        }

        .flag-wrap {
          padding: 7px;
          border: 2px solid #e7ad18;
          border-radius: 12px;
          background: #fff9e8;
        }

        .official-flag {
          display: block;
          width: 98px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
        }

        .home-main {
          width: min(1260px, calc(100% - 48px));
          margin: 0 auto;
          padding: 68px 0 72px;
        }

        .home-intro {
          max-width: 760px;
          margin: 0 auto 42px;
          text-align: center;
        }

        .home-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 13px;
          border: 1px solid #eadfca;
          border-radius: 999px;
          background: #fffdf8;
          color: #7d002f;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .home-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #17834b;
        }

        .home-intro h2 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(38px, 5vw, 58px);
          font-weight: 400;
          letter-spacing: -.03em;
          line-height: 1.06;
        }

        .home-intro p {
          max-width: 620px;
          margin: 16px auto 0;
          color: #7a7a82;
          font-size: 16px;
          line-height: 1.7;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .service-card {
          min-height: 305px;
          padding: 30px;
          border: 1px solid #e4dfd6;
          border-radius: 22px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: .18s ease;
          position: relative;
          overflow: hidden;
        }

        .service-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 4px;
          background: #e7ad18;
          opacity: 0;
          transition: .18s ease;
        }

        .service-card:hover {
          transform: translateY(-4px);
          border-color: #d8c99e;
          box-shadow: 0 18px 50px rgba(44,35,22,.08);
        }

        .service-card:hover::before { opacity: 1; }

        .service-icon {
          width: 56px;
          height: 56px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          background: #f7f2e8;
          border: 1px solid #ebe1cf;
          font-size: 25px;
          margin-bottom: 28px;
        }

        .service-title {
          font-family: 'DM Serif Display', serif;
          font-size: 25px;
          margin-bottom: 10px;
        }

        .service-desc {
          color: #7f8088;
          font-size: 14px;
          line-height: 1.65;
        }

        .service-bottom {
          margin-top: auto;
          padding-top: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .service-note { color: #9a918a; font-size: 11px; }

        .service-arrow {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #203f69;
          color: #fff;
          font-size: 17px;
        }

        .home-bottom {
          margin-top: 34px;
          padding-top: 23px;
          border-top: 1px solid #e6e1d9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .security-note {
          color: #9a948f;
          font-size: 12px;
        }

        .admin-btn {
          border: 1px solid #d7dce5;
          background: #fff;
          color: #40516c;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .service-grid { grid-template-columns: 1fr; }
          .official-right-text { display: none; }
        }

        @media (max-width: 600px) {
          .official-header-inner {
            width: calc(100% - 30px);
            padding: 18px 0;
          }

          .official-emblem {
            width: 54px;
            height: 70px;
          }

          .official-kicker { font-size: 10px; }
          .official-title { font-size: 18px; }
          .official-subtitle { font-size: 12px; }
          .official-flag { width: 70px; height: 43px; }

          .home-main {
            width: calc(100% - 28px);
            padding-top: 42px;
          }

          .home-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="gold-line" />

      <header className="official-header">
        <div className="official-header-inner">
          <div className="official-brand">
            <img
              className="official-emblem"
              src={EMBLEM_SRC}
              alt="Sri Lanka emblem"
            />

            <div>
              <div className="official-kicker">
                Official Digital Service
              </div>

              <div className="official-title">
                Embassy of Sri Lanka in France
              </div>

              <div className="official-subtitle">
                Consular Appointment Portal
              </div>
            </div>
          </div>

          <div className="official-right">
            <div className="official-right-text">
              <div className="official-right-label">
                Consular Services
              </div>

              <div className="official-right-title">
                Online Appointments
              </div>
            </div>

            <div className="flag-wrap">
              <img
                className="official-flag"
                src={FLAG_SRC}
                alt="Sri Lanka flag"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="home-intro">
          <div className="home-badge">
            <span className="home-badge-dot" />
            Appointment Services Available
          </div>

          <h2>How can we assist you?</h2>

          <p>
            Choose the consular service you need. Each service has its
            own appointment calendar and availability.
          </p>
        </section>

        <section className="service-grid">
          {services.map((service) => (
            <button
              key={service.key}
              className="service-card"
              onClick={() => navigate(service.path)}
            >
              <div className="service-icon">
                {service.icon}
              </div>

              <div className="service-title">
                {service.title}
              </div>

              <div className="service-desc">
                {service.description}
              </div>

              <div className="service-bottom">
                <span className="service-note">
                  {service.note}
                </span>

                <span className="service-arrow">
                  →
                </span>
              </div>
            </button>
          ))}
        </section>

        <div className="home-bottom">
          <div className="security-note">
            🔒 Secure appointment portal · No public account required ·
            Confirmation token provided after booking
          </div>

          <button
            className="admin-btn"
            onClick={() => navigate("/admin-login")}
          >
            🛡 Admin Login
          </button>
        </div>
      </main>
    </div>
  );
}