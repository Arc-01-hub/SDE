import { FiArrowUpRight, FiZap, FiShield, FiUsers } from "react-icons/fi";
import "./home.css";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../../utils/auth";

export const Home = () => {
  const loggedIn = isLoggedIn();

  return (
    <main className="home-container">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Real-time collaboration
            </div>

            <h1>
              The smarter way to<br />
              <span className="accent">edit documents</span><br />
              together
            </h1>

            <p className="subtitle">
              Write, review and ship work as a team — with live cursors,
              instant sync, and zero conflicts.
            </p>

            <div className="hero-ctas">
              {!loggedIn ? (
                <>
                  <Link to="/register" className="btn primary">
                    Get Started Free <FiArrowUpRight className="btn-icon" />
                  </Link>
                  <Link to="/login" className="btn ghost">Sign In</Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn primary">
                  Go to Dashboard <FiArrowUpRight className="btn-icon" />
                </Link>
              )}
            </div>

            <ul className="hero-features">
              <li><strong>Real-time editing</strong> with conflict-free collaboration</li>
              <li><strong>Version history</strong> and easy rollback</li>
              <li><strong>Invite teammates</strong> and collaborate instantly</li>
            </ul>
          </div>

          <figure className="hero-media" aria-hidden>
            <div className="hero-media-inner">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80"
                alt="Team collaborating on documents"
              />
            </div>
            {/* Floating stat cards */}
            <div className="hero-stat stat-1">
              <div className="hero-stat-value">∞</div>
              <div className="hero-stat-label">Real-time sync</div>
            </div>
            <div className="hero-stat stat-2">
              <div className="hero-stat-value">🔒</div>
              <div className="hero-stat-label">Secure & private</div>
            </div>
          </figure>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="section-divider">
        <div className="divider-line" />
      </div>

      {/* ── FEATURES ── */}
      <section className="about-section" id="about">
        <div className="about-head">
          <span className="about-tag">✦ Why SDE</span>
          <h2>Collaborate Smarter, Together</h2>
          <p className="about-desc">
            Our platform brings teams together with intuitive tools for drafting,
            reviewing and finalizing content. Instantly see updates and track changes
            so everyone stays aligned.
          </p>
        </div>

        <div className="about-grid">
          <div className="card feature">
            <div className="feature-icon-wrap">
              <FiZap className="feature-icon" />
            </div>
            <h3>Fast Collaboration</h3>
            <p>Real-time cursors, presence indicators and low-latency syncing across all your devices.</p>
          </div>
          <div className="card feature">
            <div className="feature-icon-wrap">
              <FiShield className="feature-icon" />
            </div>
            <h3>Reliable History</h3>
            <p>Automatic versioning keeps your work safe and recoverable at any point in time.</p>
          </div>
          <div className="card feature">
            <div className="feature-icon-wrap">
              <FiUsers className="feature-icon" />
            </div>
            <h3>Easy Onboarding</h3>
            <p>Invite teammates via email, accept with one click, and start collaborating instantly.</p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      {!loggedIn && (
        <div className="cta-banner">
          <div className="cta-banner-inner">
            <div className="cta-banner-copy">
              <h3>Ready to collaborate?</h3>
              <p>Create your free account and invite your team in under a minute.</p>
            </div>
            <Link to="/register" className="btn cta-white">
              Get Started Free <FiArrowUpRight />
            </Link>
          </div>
        </div>
      )}

    </main>
  );
};