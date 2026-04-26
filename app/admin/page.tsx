'use client';

import { useState, useEffect } from 'react';
import { Settings, Lock, Power } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploadEnabled, setIsUploadEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setIsUploadEnabled(data.isUploadEnabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'galdar123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 틀렸습니다.');
    }
  };

  const toggleUpload = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUploadEnabled: !isUploadEnabled, password })
      });
      
      if (res.ok) {
        setIsUploadEnabled(!isUploadEnabled);
      } else {
        alert('설정 변경에 실패했습니다.');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="app-container"><div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div></main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="app-container">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <Lock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>관리자 페이지</h1>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ textAlign: 'center' }}
                />
              </div>
              {error && <div style={{ color: '#dc3545', fontSize: '14px' }}>{error}</div>}
              <button type="submit" className="btn btn-primary">접속하기</button>
            </form>
            
            <div style={{ marginTop: '24px' }}>
              <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px' }}>홈으로 돌아가기</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      <div style={{ padding: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Settings size={28} style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: '24px', margin: 0 }}>시스템 설정</h1>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>사진 업로드 (추가) 기능</h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                행사가 종료되었을 때 이 기능을 끄면 사용자들이 더 이상 사진을 올릴 수 없습니다.
              </p>
            </div>
          </div>

          <div style={{ padding: '24px', background: isUploadEnabled ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: isUploadEnabled ? '#28a745' : '#dc3545', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Power size={24} />
              {isUploadEnabled ? '현재 업로드 가능 (ON)' : '현재 업로드 차단됨 (OFF)'}
            </div>
            
            <button 
              onClick={toggleUpload}
              disabled={saving}
              className={`btn ${isUploadEnabled ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%', maxWidth: '200px', background: isUploadEnabled ? '#dc3545' : '#28a745', color: 'white', border: 'none' }}
            >
              {saving ? '변경 중...' : (isUploadEnabled ? '업로드 끄기' : '업로드 켜기')}
            </button>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex' }}>홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
