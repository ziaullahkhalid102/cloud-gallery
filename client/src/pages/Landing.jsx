import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Cloud, Shield, Key, Zap, HardDrive, Globe,
  Sun, Moon, ArrowRight, CheckCircle,
} from 'lucide-react';

export default function Landing() {
  const { darkMode, toggleTheme } = useTheme();

  const features = [
    {
      icon: Shield,
      title: 'Google Authentication',
      desc: 'Secure login with your Google account. No passwords to remember.',
    },
    {
      icon: HardDrive,
      title: 'Your Google Drive',
      desc: 'Files stored directly in your own Google Drive. We never touch your data.',
    },
    {
      icon: Key,
      title: 'API Access',
      desc: 'Generate API keys to upload files from any app, website, or service.',
    },
    {
      icon: Zap,
      title: 'Fast Uploads',
      desc: 'Upload images, videos, audio, and documents with real-time progress.',
    },
    {
      icon: Globe,
      title: 'Access Anywhere',
      desc: 'Your files are in Google Drive — access them from any device.',
    },
    {
      icon: Cloud,
      title: 'Zero Storage Cost',
      desc: 'Uses your existing Google Drive quota. No extra fees.',
    },
  ];

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <Cloud size={32} />
          <span>CloudGallery</span>
        </div>
        <div className="landing-header-actions">
          <button onClick={toggleTheme} className="icon-btn">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="btn btn-outline">Sign In</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Your Personal<br /><span className="gradient-text">Cloud Gallery</span></h1>
          <p className="hero-subtitle">
            Upload and manage files directly in your Google Drive.
            Generate API keys to integrate with any platform.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
          <div className="hero-checks">
            <span><CheckCircle size={16} /> Free to use</span>
            <span><CheckCircle size={16} /> No server storage</span>
            <span><CheckCircle size={16} /> API included</span>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <h2>Everything You Need</h2>
        <p className="section-subtitle">A complete cloud storage platform powered by your Google Drive</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <f.icon size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Connect your Google Drive and start managing your files in seconds.</p>
        <Link to="/login" className="btn btn-primary btn-lg">
          Sign in with Google <ArrowRight size={20} />
        </Link>
      </section>

      <footer className="landing-footer">
        <p>CloudGallery &mdash; Personal Cloud Storage Platform</p>
      </footer>
    </div>
  );
}
