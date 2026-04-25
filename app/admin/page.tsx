'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2, EyeOff, Eye, X } from 'lucide-react';

const LOCATIONS = ['갯벌', '바다', '논', '밭', '숲', '기타'];
const CATEGORIES = ['해양생물', '어류', '양서류', '파충류', '조류', '포유류', '곤충', '식물', '기타'];

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions?admin=true');
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

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

  return (
    <main className="wide-container">
      <div className="glass-panel" style={{ width: '100%', flex: 1, margin: '0 auto', overflowX: 'auto', position: 'relative' }}>
        <h1 style={{ marginBottom: '24px' }}>관리자 대시보드</h1>
      
      {loading ? (
        <div>로딩 중...</div>
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
