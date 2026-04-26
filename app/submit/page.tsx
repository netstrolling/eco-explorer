'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, X, Check, Loader2, Sparkles, ChevronLeft } from 'lucide-react';
import exifr from 'exifr';

const LOCATIONS = ['갯벌', '바다', '논', '밭', '숲', '기타'];
const CATEGORIES = ['해양생물', '어류', '양서류', '파충류', '조류', '포유류', '곤충', '식물', '기타'];

export default function SubmitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [savedTeamName, setSavedTeamName] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoLocation, setAutoLocation] = useState('');
  const [autoCategory, setAutoCategory] = useState('');
  const [autoName, setAutoName] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('galdar_teamName');
    if (saved) setSavedTeamName(saved);
  }, []);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 10)); // Max 10 files
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews].slice(0, 10));

      const firstImage = selectedFiles.find(f => f.type.startsWith('image/'));
      if (firstImage) {
        try {
          const gps = await exifr.gps(firstImage);
          if (gps && gps.latitude && gps.longitude) {
            setGpsLat(gps.latitude);
            setGpsLng(gps.longitude);
          }
        } catch (e) {
          console.error("GPS Extraction error:", e);
        }

        if (!autoName && !isAnalyzing) {
          analyzeImage(firstImage);
        }
      }
    }
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.location && LOCATIONS.includes(data.location)) setAutoLocation(data.location);
        if (data.category && CATEGORIES.includes(data.category)) setAutoCategory(data.category);
        if (data.name) setAutoName(data.name);
      }
    } catch (e) {
      console.error('AI analysis failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const urls = [...prev];
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
      return urls;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      let mediaUrls: string[] = [];

      // 1. Upload files first if any
      if (files.length > 0) {
        const fileData = new FormData();
        files.forEach(file => fileData.append('files', file));
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fileData
        });
        
        if (!uploadRes.ok) throw new Error('File upload failed');
        const uploadResult = await uploadRes.json();
        mediaUrls = uploadResult.urls;
      }

      // 2. Submit data
      const teamName = formData.get('teamName') as string;
      const data = {
        teamName,
        dateTime: formData.get('dateTime'),
        location: formData.get('location'),
        category: formData.get('category'),
        name: formData.get('name') || '모름',
        memo: formData.get('memo'),
        mediaUrls,
        lat: gpsLat,
        lng: gpsLng
      };

      const submitRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!submitRes.ok) throw new Error('Submission failed');
      
      // Cleanup previews
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Save for next time
      localStorage.setItem('galdar_teamName', teamName);
      
      router.push('/gallery?success=true');
    } catch (error) {
      console.error(error);
      alert('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-container">
      <div className="animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ChevronLeft size={24} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} />
            </div>
            발견 기록하기
          </h1>
          <div style={{ width: '24px' }}></div> {/* Spacer for centering */}
        </div>

        <div className="glass-panel">


        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">탐사 팀명 *</label>
            <input 
              type="text" 
              name="teamName" 
              className="form-control" 
              required 
              placeholder="예: 우도탐험대" 
              defaultValue={savedTeamName}
              key={savedTeamName}
            />
          </div>

          <div className="form-group">
            <label className="form-label">발견 일시 *</label>
            <input 
              type="datetime-local" 
              name="dateTime" 
              className="form-control" 
              required 
              defaultValue={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">사진/영상 업로드 (최대 10장)</label>
            <label className="file-upload-area" style={{ display: 'block' }}>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={32} color="var(--primary-light)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--primary)' }}>클릭하여 파일 선택</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>또는 터치하여 앨범 열기</div>
            </label>
            
            {previewUrls.length > 0 && (
              <div className="file-preview-grid">
                {previewUrls.map((url, i) => (
                  <div key={i} className="file-preview-item">
                    <img src={url} alt="Preview" />
                    <button type="button" className="remove-file" onClick={() => removeFile(i)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAnalyzing && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(13, 110, 253, 0.1)', color: 'var(--secondary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Sparkles size={18} />
                AI가 사진을 분석하여 정보를 찾고 있어요...
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">발견 장소 *</label>
            <select name="location" className="form-control" required value={autoLocation} onChange={e => setAutoLocation(e.target.value)}>
              <option value="">장소 선택</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">생물 종류 *</label>
            <select name="category" className="form-control" required value={autoCategory} onChange={e => setAutoCategory(e.target.value)}>
              <option value="">종류 선택</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">생물 이름</label>
            <input type="text" name="name" className="form-control" placeholder="모를 경우 비워두면 '모름'으로 기록됩니다." value={autoName} onChange={e => setAutoName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">관찰 메모</label>
            <textarea name="memo" className="form-control" placeholder="어떤 특징이 있었나요? 생물의 행동이나 주변 환경을 기록해 주세요."></textarea>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '16px' }}>
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={20} /> 업로드 중...</>
            ) : (
              <><Check size={20} /> 도감에 등록하기</>
            )}
          </button>
        </form>
      </div>
      </div>
    </main>
  );
}
