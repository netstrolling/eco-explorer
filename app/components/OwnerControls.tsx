'use client';

import { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { getMyPostToken, removeMyPost } from '@/lib/myposts';

const LOCATIONS = ['갯벌', '바다', '논', '밭', '숲', '기타'];
const CATEGORIES = ['해양생물', '어류', '양서류', '파충류', '조류', '포유류', '곤충', '식물', '기타'];

// 본인이 올린 글에만 수정/삭제 버튼을 노출한다.
// 권한 증명은 localStorage에 보관된 editToken으로 서버에서 검증한다.
export default function OwnerControls({
  submission,
  onChanged,
}: {
  submission: any;
  onChanged: () => void;
}) {
  const token = typeof window !== 'undefined' ? getMyPostToken(submission.id) : null;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    teamName: submission.teamName || '',
    name: submission.name || '',
    category: submission.category || '',
    location: submission.location || '',
    memo: submission.memo || '',
  });

  if (!token) return null;

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, editToken: token }),
      });
      if (res.ok) {
        setEditing(false);
        onChanged();
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 기록을 삭제할까요? 되돌릴 수 없습니다.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: token }),
      });
      if (res.ok) {
        removeMyPost(submission.id);
        onChanged();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={() => setEditing(true)}
          className="btn btn-secondary"
          style={{ width: 'auto', padding: '8px 14px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Pencil size={15} /> 수정
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="btn btn-secondary"
          style={{ width: 'auto', padding: '8px 14px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc3545' }}
        >
          <Trash2 size={15} /> 삭제
        </button>
      </div>

      {editing && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => !busy && setEditing(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', background: 'white', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setEditing(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '20px' }}>내 기록 수정</h2>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">팀명</label>
              <input type="text" className="form-control" value={form.teamName} onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">장소</label>
                <select className="form-control" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">종류</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">이름</label>
              <input type="text" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">관찰 메모</label>
              <textarea className="form-control" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={busy} style={{ flex: 1 }}>취소</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={busy} style={{ flex: 1 }}>{busy ? '저장 중...' : '저장하기'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
