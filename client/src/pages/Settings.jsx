import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Moon, Sun, Shield, HardDrive } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <h3><User size={18} /> Profile</h3>
          </div>
          <div className="card-body">
            <div className="profile-section">
              {user?.picture && (
                <img src={user.picture} alt="" className="profile-avatar" />
              )}
              <div className="profile-details">
                <div className="setting-row">
                  <label>Name</label>
                  <span>{user?.name}</span>
                </div>
                <div className="setting-row">
                  <label>Email</label>
                  <span>{user?.email}</span>
                </div>
                <div className="setting-row">
                  <label>Google ID</label>
                  <span className="text-muted">{user?.googleId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>{darkMode ? <Moon size={18} /> : <Sun size={18} />} Appearance</h3>
          </div>
          <div className="card-body">
            <div className="setting-row clickable" onClick={toggleTheme}>
              <div>
                <label>Dark Mode</label>
                <p className="text-muted text-sm">Switch between light and dark theme</p>
              </div>
              <div className={`toggle ${darkMode ? 'on' : ''}`}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><Shield size={18} /> Security</h3>
          </div>
          <div className="card-body">
            <div className="setting-row">
              <div>
                <label>Authentication</label>
                <p className="text-muted text-sm">Signed in via Google OAuth 2.0</p>
              </div>
              <span className="badge badge-green">Connected</span>
            </div>
            <div className="setting-row">
              <div>
                <label>Session</label>
                <p className="text-muted text-sm">Your session is valid for 7 days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><HardDrive size={18} /> Data & Storage</h3>
          </div>
          <div className="card-body">
            <div className="setting-row">
              <div>
                <label>Storage Provider</label>
                <p className="text-muted text-sm">All files stored in your Google Drive</p>
              </div>
              <span className="badge badge-blue">Google Drive</span>
            </div>
            <div className="setting-row">
              <div>
                <label>App Folder</label>
                <p className="text-muted text-sm">Files are organized in the CloudGallery folder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
