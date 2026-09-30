import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Shield, KeyRound, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login, register, loginWithOtp } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDemoHint, setOtpDemoHint] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (authModalTab === 'otp') {
      if (!otpSent) {
        // Send OTP
        try {
          const res = await api.sendOtp(phone);
          if (res.success) {
            setOtpSent(true);
            if (res.demoCode) {
              setOtpDemoHint(res.demoCode);
              setOtpCode(res.demoCode); // Auto-fill demo OTP code for convenience
            }
            showToast(`Tasdiqlash kodi yuborildi! Kod: ${res.demoCode || 'SMS orqali keladi'}`);
          }
        } catch (err) {
          showToast(err.message || 'Kodni yuborib bo‘lmadi', 'error');
        }
      } else {
        // Verify OTP
        await loginWithOtp(phone, otpCode, name);
      }
    } else if (authModalTab === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password, phone);
    }

    setLoading(false);
  };

  const fillQuickDemo = (type) => {
    if (type === 'admin') {
      setEmail('admin@gastranom.uz');
      setPassword('adminpassword123');
      setAuthModalTab('login');
    } else {
      setEmail('jasur@example.uz');
      setPassword('customerpassword123');
      setAuthModalTab('login');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
            {authModalTab === 'otp' ? 'Telefon (SMS kod) orqali kirish' : authModalTab === 'login' ? 'Tizimga kirish' : 'Yangi hisob ochish'}
          </h3>
          <button onClick={closeAuthModal} className="btn-icon" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Demo Credentials */}
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tezkor test kirish:</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => fillQuickDemo('customer')}
              className="badge badge-primary"
              style={{ cursor: 'pointer' }}
            >
              Demo Mijoz
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin')}
              className="badge badge-danger"
              style={{ cursor: 'pointer' }}
            >
              <Shield size={12} /> Demo Admin
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { setAuthModalTab('otp'); setOtpSent(false); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: '700',
              fontSize: '0.825rem',
              color: authModalTab === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authModalTab === 'otp' ? '2.5px solid var(--primary)' : 'none',
              backgroundColor: authModalTab === 'otp' ? '#ffffff' : 'var(--bg-subtle)'
            }}
          >
            Telefon (OTP)
          </button>
          <button
            onClick={() => setAuthModalTab('login')}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: '700',
              fontSize: '0.825rem',
              color: authModalTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authModalTab === 'login' ? '2.5px solid var(--primary)' : 'none',
              backgroundColor: authModalTab === 'login' ? '#ffffff' : 'var(--bg-subtle)'
            }}
          >
            Email / Parol
          </button>
          <button
            onClick={() => setAuthModalTab('register')}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: '700',
              fontSize: '0.825rem',
              color: authModalTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authModalTab === 'register' ? '2.5px solid var(--primary)' : 'none',
              backgroundColor: authModalTab === 'register' ? '#ffffff' : 'var(--bg-subtle)'
            }}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {authModalTab === 'otp' ? (
            <>
              <div className="form-group">
                <label className="form-label">Telefon raqamingiz *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    disabled={otpSent}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="form-control"
                    style={{ paddingLeft: '38px', fontWeight: '600' }}
                  />
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  O‘zbekiston telefon raqami (masalan: +998901234567)
                </small>
              </div>

              {otpSent && (
                <>
                  <div className="form-group">
                    <label className="form-label">SMS tasdiqlash kodi *</label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="6 xonali kod"
                        className="form-control"
                        style={{ paddingLeft: '38px', fontSize: '1.1rem', letterSpacing: '4px', fontWeight: '700' }}
                      />
                    </div>
                    {otpDemoHint && (
                      <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                        ✓ Demo test kodi: <b>{otpDemoHint}</b> (avtomatik to‘ldirildi)
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600' }}
                    >
                      Raqamni o‘zgartirish
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem', borderRadius: '12px' }}
              >
                {loading ? 'Tekshirilmoqda...' : !otpSent ? 'SMS kod olish' : 'Tasdiqlash va kirish'}
              </button>
            </>
          ) : (
            <>
              {authModalTab === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label">To‘liq ismingiz</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masalan: Sardor Rahimov"
                        className="form-control"
                        style={{ paddingLeft: '38px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefon raqamingiz</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 (90) 123-45-67"
                        className="form-control"
                        style={{ paddingLeft: '38px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Elektron pochta</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gastranom.uz"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Parol</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem', borderRadius: '12px' }}
              >
                {loading ? 'Bajarilmoqda...' : authModalTab === 'login' ? 'Kirish' : 'Hisob yaratish'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
