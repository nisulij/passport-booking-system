import { useNavigate } from "react-router-dom";

export default function PassportServices() {
  const navigate = useNavigate();

  return (
    <div className="ps-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        .ps-root {
          min-height: 100vh;
          background: #f8f6f1;
          color: #17213a;
          font-family: 'DM Sans', sans-serif;
          padding: 48px 24px;
        }

        .ps-shell {
          width: min(900px, 100%);
          margin: 0 auto;
        }

        .ps-back {
          border: 0;
          background: transparent;
          color: #60738e;
          cursor: pointer;
          margin-bottom: 30px;
          font-size: 13px;
        }

        .ps-head {
          text-align: center;
          margin-bottom: 34px;
        }

        .ps-head h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 42px;
          font-weight: 400;
          margin: 0;
        }

        .ps-head p {
          color: #8a8d95;
          margin-top: 10px;
        }

        .ps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .ps-card {
          min-height: 260px;
          border: 1px solid #e3ded6;
          border-radius: 20px;
          background: #fff;
          padding: 28px;
          text-align: left;
          cursor: pointer;
          transition: .18s ease;
          display: flex;
          flex-direction: column;
        }

        .ps-card:hover {
          transform: translateY(-3px);
          border-color: #203f69;
          box-shadow: 0 14px 40px rgba(32,63,105,.08);
        }

        .ps-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #edf4fd;
          font-size: 25px;
          margin-bottom: 24px;
        }

        .ps-card h2 {
          font-family: 'DM Serif Display', serif;
          font-weight: 400;
          font-size: 24px;
          margin: 0 0 9px;
        }

        .ps-card p {
          color: #858a94;
          font-size: 13px;
          line-height: 1.65;
          margin: 0;
        }

        .ps-arrow {
          margin-top: auto;
          color: #203f69;
          font-weight: 700;
          font-size: 13px;
          padding-top: 25px;
        }

        @media (max-width: 650px) {
          .ps-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ps-shell">
        <button
          className="ps-back"
          onClick={() => navigate("/")}
        >
          ← Back to services
        </button>

        <div className="ps-head">
          <h1>Passport Appointment</h1>

          <p>
            Choose whether you are booking for one applicant
            or for family members.
          </p>
        </div>

        <div className="ps-grid">
          <button
            className="ps-card"
            onClick={() => navigate("/individual")}
          >
            <div className="ps-icon">👤</div>
            <h2>Individual</h2>
            <p>
              Book a passport appointment for one applicant with
              a dedicated 5-minute time slot.
            </p>
            <div className="ps-arrow">Continue →</div>
          </button>

          <button
            className="ps-card"
            onClick={() => navigate("/family")}
          >
            <div className="ps-icon">👨‍👩‍👧</div>
            <h2>Family</h2>
            <p>
              Book up to four family members on the same date,
              each with their own 5-minute slot and token.
            </p>
            <div className="ps-arrow">Continue →</div>
          </button>
        </div>
      </div>
    </div>
  );
}