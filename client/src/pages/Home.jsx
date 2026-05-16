import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background: #faf9f7;
          display: flex;
          flex-direction: column;
        }

        .home-header {
          background: #1a1a2e;
          color: #fff;
          padding: 28px 40px;
        }

        .home-header-inner {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }
.admin-login-btn{
  margin-left:auto;
  background:transparent;
  color:#c8b8ff;
  border:1px solid rgba(200,184,255,0.25);
  padding:10px 18px;
  border-radius:10px;
  cursor:pointer;
  font-size:13px;
  font-weight:500;
  transition:all .2s ease;
}

.admin-login-btn:hover{
  background:rgba(200,184,255,0.12);
  border-color:#c8b8ff;
  color:#fff;
}
        .home-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(200,184,255,0.15);
          border: 1px solid rgba(200,184,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .home-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          font-weight: 400;
          letter-spacing: -0.2px;
          color: #fff;
        }

        .home-header .sub {
          font-size: 12px;
          color: #7070a0;
          margin-top: 2px;
          font-weight: 300;
        }

        .home-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
        }

        .home-center {
          max-width: 560px;
          width: 100%;
          text-align: center;
        }

        .home-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eeeaff;
          color: #6c4fe0;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 24px;
        }

        .home-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6c4fe0;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .home-center h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 38px;
          font-weight: 400;
          color: #1a1a2e;
          line-height: 1.2;
          letter-spacing: -0.5px;
          margin-bottom: 14px;
        }

        .home-center p {
          font-size: 16px;
          color: #888;
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .booking-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 28px;
        }

        .booking-card {
          background: #fff;
          border: 1.5px solid #e8e5e0;
          border-radius: 16px;
          padding: 28px 24px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          overflow: hidden;
        }

        .booking-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(108,79,224,0.04) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .booking-card:hover {
          border-color: #6c4fe0;
          box-shadow: 0 8px 32px rgba(108,79,224,0.1);
          transform: translateY(-2px);
        }

        .booking-card:hover::after { opacity: 1; }

        .booking-card:active { transform: translateY(0); }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #f0ecff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 18px;
          font-weight: 400;
          color: #1a1a2e;
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 13px;
          color: #999;
          line-height: 1.5;
          font-weight: 300;
        }

        .card-arrow {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #6c4fe0;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s, transform 0.2s;
        }

        .booking-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .home-footer-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: #bbb;
        }

        .home-footer-note span { color: #ddd; }

        @media (max-width: 500px) {
          .booking-cards { grid-template-columns: 1fr; }
          .home-center h2 { font-size: 28px; }
          .home-header { padding: 20px 24px; }
        }
      `}</style>

      <div className="home-root">
     <header className="home-header">
  <div className="home-header-inner">

    <div className="home-logo">
      🛂
    </div>

    <div>
      <h1>Passport Services</h1>
      <div className="sub">
        Official Appointment Booking Portal
      </div>
    </div>

    <button
      className="admin-login-btn"
      onClick={() =>
        navigate("/admin-login")
      }
    >
      🛡 ADMIN LOGIN
    </button>

  </div>
</header>

        <div className="home-body">
          <div className="home-center">

            <div className="home-badge">
              <div className="home-badge-dot" />
              Slots Available Now
            </div>

            <h2>Book Your Passport Appointment</h2>
            <p>Choose your booking type below to get started.</p>

            <div className="booking-cards">
              <button className="booking-card" onClick={() => navigate("/individual")}>
                <div className="card-icon">🧑</div>
                <div>
                  <div className="card-title">Individual</div>
                  <div className="card-desc">Book a single appointment for yourself with a dedicated time slot.</div>
                </div>
                <div className="card-arrow">Book now →</div>
              </button>

              <button className="booking-card" onClick={() => navigate("/family")}>
                <div className="card-icon">👨‍👩‍👧</div>
                <div>
                  <div className="card-title">Family</div>
                  <div className="card-desc">Schedule appointments for multiple family members in one booking.</div>
                </div>
                <div className="card-arrow">Book now →</div>
              </button>
            </div>

            <div className="home-footer-note">
              🔒 Secure & encrypted <span>·</span> No account required <span>·</span> Instant confirmation
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}