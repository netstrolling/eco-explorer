import Link from 'next/link'
import { Leaf, Camera, Library } from 'lucide-react'

export default function Home() {
  return (
    <main className="app-container">
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '50%', color: 'white' }}>
              <Leaf size={48} />
            </div>
          </div>
          
          <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>갈다 생태도감</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '16px' }}>
            고흥 우도의 아름다운 생태계를 탐사하고,<br />
            당신이 발견한 생물들을 기록해주세요!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link href="/submit" className="btn btn-primary" style={{ padding: '16px' }}>
              <Camera size={20} />
              기록 시작하기
            </Link>
            
            <Link href="/gallery" className="btn btn-secondary" style={{ padding: '16px' }}>
              <Library size={20} />
              다함께 만든 도감 보기
            </Link>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          © 2026 Galdar Eco Explorer
        </div>
      </div>
    </main>
  )
}
