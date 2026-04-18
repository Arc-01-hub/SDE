import { FiArrowUpRight } from "react-icons/fi";
import "./home.css";
import { PiShootingStarThin } from "react-icons/pi";
import { HiInformationCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../../utils/auth";
import { useEffect } from "react";

export const Home = () => {

  return (
    <main className="home-container">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Shared Document Editor</h1>
            <p className="subtitle">Collaborate in real time — edit, comment and ship work together.</p>
            <div className="hero-ctas">
                        {
                          !isLoggedIn()?
                          <>
                            <Link to="/register" className="btn primary">Get Started <FiArrowUpRight className="btn-icon" /></Link>
                          <Link to="/login" className="btn ghost">Sign In</Link>
                          </>
                        :<Link to="/dashboard" className="btn primary">Dashboard</Link>
                        }
            </div>
            <ul className="hero-features" aria-hidden>
              <li><strong>Real-time editing</strong> with conflict-free collaboration</li>
              <li><strong>Version history</strong> and easy rollback</li>
              <li><strong>Comments & mentions</strong> to streamline reviews</li>
            </ul>
          </div>

          <figure className="hero-media" aria-hidden>
            <img src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZG9jdW1lbnQlMjBlZGl0b3J8ZW58MHx8MHx8fDA%3D&w=1000&q=80" alt="Team collaborating on documents"/>
          </figure>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-head">
          <HiInformationCircle size={22} />
          <h2>Collaborate Smarter, Together</h2>
        </div>

        <p>
          Our platform brings teams together with intuitive tools for drafting,
          reviewing and finalizing content. Instantly see updates, leave comments,
          and track changes so everyone stays aligned.
        </p>

        <div className="about-grid">
          <div className="card feature">
            <PiShootingStarThin className="feature-icon" />
            <h3>Fast Collaboration</h3>
            <p>Real-time cursors, presence indicators and low-latency syncing.</p>
          </div>
          <div className="card feature">
            <HiInformationCircle className="feature-icon" />
            <h3>Reliable History</h3>
            <p>Automatic versioning keeps your work safe and recoverable.</p>
          </div>
          <div className="card feature">
            <FiArrowUpRight className="feature-icon" />
            <h3>Easy Onboarding</h3>
            <p>Invite teammates, share links, and start collaborating instantly.</p>
          </div>
        </div>
      </section>
    </main>
  );
};
