'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, EyeOff, Eye, X, Settings, Lock, Power, CalendarDays, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';

const LOCATIONS = ['갯벌', '바다', '논', '밭', '숲', '기타'];
const CATEGORIES = ['해양생물', '어류', '양서류', '파충류', '조류', '포유류', '곤충', '식물', '기타'];

export default function AdminPage() {
  // Auth & Settings State
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploadEnabled, setIsUploadEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [editingGuide, setEditingGuide] = useState<any | null>(null);
  const [guidePages, setGuidePages] = useState<{title: string; content: string; imageUrl: string}[]>([]);
  const [taggingEvent, setTaggingEvent] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPhases, setEditingPhases] = useState<any | null>(null);
  const [phaseList, setPhaseList] = useState<{ name: string; startDate: string; endDate: string }[]>([]);

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
      fetchEvents();
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) setEvents(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'), slug: fd.get('slug'),
        startDate: fd.get('startDate'), endDate: fd.get('endDate'),
        password,
      }),
    });
    if (res.ok) { await fetchEvents(); setShowNewEventForm(false); }
    else alert('행사 생성 실패');
  };

  const handleToggleActive = async (ev: any) => {
    const res = await fetch(`/api/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !ev.isActive, password }),
    });
    if (res.ok) fetchEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('행사를 삭제하면 연결된 기록들의 행사 태그도 사라집니다. 계속하시겠습니까?')) return;
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) fetchEvents();
    else alert('삭제 실패');
  };

  const openGuideEditor = (event: any) => {
    const pages = JSON.parse(event.guidePages || '[]');
    const filled = [0, 1, 2].map(i => pages[i] || { title: '', content: '', imageUrl: '' });
    setGuidePages(filled);
    setEditingGuide(event);
  };

  const handleGuideImageUpload = async (index: number, file: File) => {
    const fd = new FormData();
    fd.append('files', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const { urls } = await res.json();
      setGuidePages(prev => prev.map((p, i) => i === index ? { ...p, imageUrl: urls[0] } : p));
    } else {
      alert('이미지 업로드 실패');
    }
  };

  const handleSaveGuide = async () => {
    if (!editingGuide) return;
    const res = await fetch(`/api/events/${editingGuide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guidePages, password }),
    });
    if (res.ok) { await fetchEvents(); setEditingGuide(null); }
    else alert('저장 실패');
  };

  const openPhaseEditor = (event: any) => {
    let phases: { name: string; startDate: string; endDate: string }[] = [];
    try { phases = JSON.parse(event.phases || '[]'); } catch { phases = []; }
    setPhaseList(phases.length > 0 ? phases : [{ name: '', startDate: '', endDate: '' }]);
    setEditingPhases(event);
  };

  const handleSavePhases = async () => {
    if (!editingPhases) return;
    // 이름과 두 날짜가 모두 채워진 기간만 저장
    const cleaned = phaseList.filter(p => p.name.trim() && p.startDate && p.endDate);
    const res = await fetch(`/api/events/${editingPhases.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phases: cleaned, password }),
    });
    if (res.ok) { await fetchEvents(); setEditingPhases(null); }
    else alert('저장 실패');
  };

  const openTagging = (ev: any) => {
    setSelectedIds(new Set(submissions.filter(s => s.eventId === ev.id).map((s: any) => s.id)));
    setTaggingEvent(ev);
  };

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleTagSubmissions = async () => {
    if (!taggingEvent) return;
    const res = await fetch(`/api/events/${taggingEvent.id}/tag-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionIds: Array.from(selectedIds), password }),
    });
    if (res.ok) {
      await fetchSubmissions();
      setTaggingEvent(null);
    } else {
      alert('저장 실패');
    }
  };

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
      setLoadingSettings(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/submissions?admin=true');
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
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

  const handleDelete = async (id: string) => {
    if (!confirm('정말 영구적으로 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) return;
    
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
    }
  };

  const handleToggleHide = async (item: any) => {
    try {
      const newStatus = !item.isHidden;
      const res = await fetch(`/api/submissions/${item.id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: newStatus })
      });
      if (res.ok) {
        setSubmissions(prev => prev.map(s => s.id === item.id ? { ...s, isHidden: newStatus } : s));
      }
    } catch (e) {
      console.error(e);
      alert('상태 변경 실패');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      teamName: formData.get('teamName'),
      location: formData.get('location'),
      category: formData.get('category'),
      name: formData.get('name'),
      memo: formData.get('memo'),
    };

    try {
      const res = await fetch(`/api/submissions/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const updated = await res.json();
        setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
        setEditingItem(null); // Close modal
      }
    } catch (error) {
      console.error(error);
      alert('수정 실패');
    }
  };

  if (loadingSettings) {
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
    <main className="wide-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. 설정 섹션 */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Settings size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', margin: 0 }}>시스템 설정</h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>사진 업로드 (추가) 기능</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              행사가 종료되었을 때 이 기능을 끄면 사용자들이 더 이상 사진을 올릴 수 없습니다.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontWeight: 'bold', color: isUploadEnabled ? '#28a745' : '#dc3545', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Power size={20} />
              {isUploadEnabled ? 'ON' : 'OFF'}
            </div>
            <button 
              onClick={toggleUpload}
              disabled={saving}
              className={`btn ${isUploadEnabled ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '120px', background: isUploadEnabled ? '#dc3545' : '#28a745', color: 'white', border: 'none' }}
            >
              {saving ? '변경 중...' : (isUploadEnabled ? '끄기' : '켜기')}
            </button>
          </div>
        </div>
      </div>

      {/* 2. 행사 관리 */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarDays size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '20px', margin: 0 }}>행사 관리</h2>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => setShowNewEventForm(true)}>
            <Plus size={16} /> 새 행사
          </button>
        </div>

        {showNewEventForm && (
          <form onSubmit={handleCreateEvent} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>행사명</label>
              <input name="name" className="form-control" required placeholder="우도 생태 탐사" />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>슬러그 (URL)</label>
              <input name="slug" className="form-control" required placeholder="udo-2026-05" />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>시작일</label>
              <input name="startDate" type="datetime-local" className="form-control" required />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>종료일</label>
              <input name="endDate" type="datetime-local" className="form-control" required />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setShowNewEventForm(false)}>취소</button>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>생성</button>
            </div>
          </form>
        )}

        {events.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>등록된 행사가 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>행사명</th>
                <th style={{ padding: '10px 12px' }}>기간</th>
                <th style={{ padding: '10px 12px' }}>슬러그</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev: any) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{ev.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(ev.startDate).toLocaleDateString('ko')} ~ {new Date(ev.endDate).toLocaleDateString('ko')}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '13px' }}>/events/{ev.slug}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(ev)}
                        title={ev.isActive ? '홈/갤러리 표시 끄기' : '홈/갤러리에 표시'}
                        style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: ev.isActive ? 'var(--primary)' : '#e9ecef', color: ev.isActive ? 'white' : '#6c757d' }}
                      >
                        {ev.isActive ? '진행중 표시' : '표시 꺼짐'}
                      </button>
                      <button onClick={() => openTagging(ev)} style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: '4px', fontSize: '13px' }}>
                        게시물 태깅
                      </button>
                      <button onClick={() => openPhaseEditor(ev)} title="답사/본행사 등 기간 설정" style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <CalendarDays size={16} /> 기간 편집
                      </button>
                      <button onClick={() => openGuideEditor(ev)} title="안내 페이지 편집" style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <BookOpen size={16} /> 안내 편집
                      </button>
                      <button onClick={() => handleDeleteEvent(ev.id)} title="삭제" style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 안내 페이지 편집 모달 */}
      {editingGuide && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', background: 'white', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <button onClick={() => setEditingGuide(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '20px' }}>{editingGuide.name} — 안내 페이지</h2>
            {guidePages.map((page, i) => (
              <div key={i} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--primary)' }}>{i + 1}페이지</div>
                <input
                  className="form-control" placeholder="제목" value={page.title}
                  onChange={e => setGuidePages(prev => prev.map((p, j) => j === i ? { ...p, title: e.target.value } : p))}
                  style={{ marginBottom: '8px' }}
                />
                <textarea
                  className="form-control" placeholder="내용" rows={4} value={page.content}
                  onChange={e => setGuidePages(prev => prev.map((p, j) => j === i ? { ...p, content: e.target.value } : p))}
                  style={{ marginBottom: '8px' }}
                />
                {page.imageUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={page.imageUrl} alt="" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                    <button
                      type="button"
                      onClick={() => setGuidePages(prev => prev.map((p, j) => j === i ? { ...p, imageUrl: '' } : p))}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                    >×</button>
                  </div>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', padding: '6px 12px', border: '1px dashed var(--primary)', borderRadius: '8px' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleGuideImageUpload(i, e.target.files[0])} />
                    + 이미지 추가
                  </label>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setEditingGuide(null)} style={{ flex: 1 }}>취소</button>
              <button className="btn btn-primary" onClick={handleSaveGuide} style={{ flex: 1 }}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 기간(답사/본행사) 편집 모달 */}
      {editingPhases && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', background: 'white', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <button onClick={() => setEditingPhases(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '6px' }}>{editingPhases.name} — 기간 설정</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              답사기간, 본행사처럼 행사를 여러 기간으로 나눠 랭킹을 따로 볼 수 있습니다. 각 기록은 관찰 일시 기준으로 자동 분류됩니다.
            </p>

            {phaseList.map((p, i) => (
              <div key={i} style={{ marginBottom: '12px', padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setPhaseList(prev => prev.filter((_, j) => j !== i))}
                  title="이 기간 삭제"
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
                <div style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>기간 이름</label>
                  <input
                    className="form-control" placeholder="예: 답사기간 / 본행사" value={p.name}
                    onChange={e => setPhaseList(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>시작일</label>
                    <input
                      type="date" className="form-control" value={p.startDate}
                      onChange={e => setPhaseList(prev => prev.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>종료일</label>
                    <input
                      type="date" className="form-control" value={p.endDate}
                      onChange={e => setPhaseList(prev => prev.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x))}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setPhaseList(prev => [...prev, { name: '', startDate: '', endDate: '' }])}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', padding: '8px 12px', border: '1px dashed var(--primary)', borderRadius: '8px', background: 'none', marginBottom: '20px' }}
            >
              <Plus size={16} /> 기간 추가
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setEditingPhases(null)} style={{ flex: 1 }}>취소</button>
              <button className="btn btn-primary" onClick={handleSavePhases} style={{ flex: 1 }}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 게시물 태깅 모달 */}
      {taggingEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', background: 'white', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>{taggingEvent.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>태깅할 게시물을 선택하세요</div>
              </div>
              <button onClick={() => setTaggingEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {submissions.map((s: any) => {
                const checked = selectedIds.has(s.id);
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', cursor: 'pointer', background: checked ? 'rgba(13,110,253,0.05)' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleId(s.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.teamName}</span>
                        {s.event && (
                          <span style={{ fontSize: '11px', background: 'var(--primary)', color: 'white', padding: '1px 7px', borderRadius: '10px' }}>{s.event.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {format(new Date(s.dateTime), 'yyyy.MM.dd')} · {s.category} · {s.location}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedIds.size}건 선택됨</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setTaggingEvent(null)} style={{ width: 'auto', padding: '8px 16px' }}>취소</button>
                <button className="btn btn-primary" onClick={handleTagSubmissions} style={{ width: 'auto', padding: '8px 16px' }}>저장하기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 게시물 관리 대시보드 */}
      <div className="glass-panel" style={{ width: '100%', flex: 1, margin: '0 auto', overflowX: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0 }}>게시물 관리 대시보드</h1>
          <Link href="/" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}>
            홈으로 돌아가기
          </Link>
        </div>
      
      {loadingData ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>게시물을 불러오는 중...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>상태</th>
              <th style={{ padding: '12px' }}>일시</th>
              <th style={{ padding: '12px' }}>팀명</th>
              <th style={{ padding: '12px' }}>장소 / 종류</th>
              <th style={{ padding: '12px' }}>이름</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(item => {
              const isHidden = item.isHidden;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', opacity: isHidden ? 0.6 : 1, background: isHidden ? '#f8f9fa' : 'transparent' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                      background: isHidden ? '#e9ecef' : '#d1e7dd', color: isHidden ? '#6c757d' : '#0f5132'
                    }}>
                      {isHidden ? '숨김' : '표시중'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{format(new Date(item.dateTime), 'yyyy-MM-dd HH:mm')}</td>
                  <td style={{ padding: '12px' }}>{item.teamName}</td>
                  <td style={{ padding: '12px' }}>{item.location} / {item.category}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => handleToggleHide(item)}
                      title={isHidden ? "갤러리에 보이기" : "갤러리에서 숨기기"}
                      style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: '4px' }}
                    >
                      {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                      onClick={() => setEditingItem(item)}
                      title="정보 수정"
                      style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      title="영구 삭제"
                      style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'white', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setEditingItem(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '20px' }}>기록 수정</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">팀명</label>
                <input type="text" name="teamName" className="form-control" defaultValue={editingItem.teamName} required />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">장소</label>
                  <select name="location" className="form-control" defaultValue={editingItem.location}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">종류</label>
                  <select name="category" className="form-control" defaultValue={editingItem.category}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">이름</label>
                <input type="text" name="name" className="form-control" defaultValue={editingItem.name} required />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">관찰 메모</label>
                <textarea name="memo" className="form-control" defaultValue={editingItem.memo || ''}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>취소</button>
                <button type="submit" className="btn btn-primary">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
