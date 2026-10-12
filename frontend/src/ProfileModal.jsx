import { X } from 'lucide-react';

export default function ProfileModal({ user, profile, onClose }) {
  return (
    <div className="pz-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="pz-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pz-modal-head">
          <h2 id="profile-title">Profile Details</h2>
          <button className="pz-x" onClick={onClose} aria-label="Close profile details">
            <X size={20} />
          </button>
        </div>
        <label>
          Full name
          <input value={profile?.full_name || user.user_metadata?.full_name || ''} readOnly />
        </label>
        <label>
          Email address
          <input value={profile?.email || user.email || ''} readOnly />
        </label>
        <div className="pz-modal-actions">
          <button className="pz-ghost" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}
