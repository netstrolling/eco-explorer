import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// /space-lab K-Science Heritage — 장소 이름으로 과학사 콘텐츠(설명·퀴즈·유물) 자동 추천.
// 격리된 실험용 라우트. 기존 서비스와 무관.
export async function POST(request: Request) {
  try {
    const { name, theme } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '장소 이름이 필요합니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `당신은 한국 과학사·문화유산 교육 콘텐츠 작가입니다.
입력 장소: "${name}"${theme ? `\n참고 분야: "${theme}"` : ''}

이 장소(또는 바로 인근 지역)와 관련된 한국의 과학사/기술사/문화사 학습 콘텐츠를 만들어 주세요.
- 반드시 실제 역사적 사실에 기반하세요. 불확실하면 과장하지 말고 그 지역·시대의 과학사 주제로 자연스럽게 연결하세요.
- 퀴즈는 초·중등생도 풀 수 있는 흥미로운 객관식 1문항. 정답은 보기 중 명확히 하나.
- 모든 텍스트는 한국어.

아래 JSON 형식으로만 출력하세요(다른 말 금지):
{
  "theme": "분야 (예: 천문 관측, 도량형, 근대 의학)",
  "tagline": "감성적인 한 줄 카피",
  "blurb": "2~3문장 역사 설명(사실 기반)",
  "mission": { "prompt": "객관식 퀴즈 질문", "options": ["보기1","보기2","보기3","보기4"], "answer": 0 },
  "artifact": { "name": "수집 유물 부품 이름(예: 혼천의 조각)", "emoji": "관련 이모지 1개" }
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const m = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: 'AI 응답을 해석하지 못했습니다.' }, { status: 502 });

    const parsed = JSON.parse(m[1] || m[0]);

    // 검증·정규화
    const opts = Array.isArray(parsed?.mission?.options) ? parsed.mission.options.slice(0, 4).map(String) : [];
    while (opts.length < 4) opts.push('');
    let ans = Number(parsed?.mission?.answer);
    if (!Number.isInteger(ans) || ans < 0 || ans > 3) ans = 0;

    return NextResponse.json({
      theme: String(parsed.theme ?? ''),
      tagline: String(parsed.tagline ?? ''),
      blurb: String(parsed.blurb ?? ''),
      mission: { kind: 'quiz', prompt: String(parsed?.mission?.prompt ?? ''), options: opts, answer: ans },
      artifact: { name: String(parsed?.artifact?.name ?? ''), emoji: String(parsed?.artifact?.emoji ?? '🏺') },
    });
  } catch (e: any) {
    console.error('space-lab suggest error:', e);
    const msg = String(e?.message || e);
    const quota = e?.status === 429 || /quota|credit|Too Many Requests|depleted|billing/i.test(msg);
    return NextResponse.json(
      { error: quota ? 'AI 사용량/크레딧이 소진되었습니다. (Gemini 결제 확인 필요)' : 'AI 추천 중 오류가 발생했습니다.' },
      { status: quota ? 429 : 500 }
    );
  }
}
