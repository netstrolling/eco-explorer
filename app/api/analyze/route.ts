import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    const prompt = `
당신은 생태 탐사 도우미입니다. 이 사진을 분석해서 아래 세 가지 정보를 찾아주세요.
1. location: 사진의 배경을 보고 장소(갯벌, 바다, 논, 밭, 숲, 기타 중 하나)를 고르세요.
2. category: 중심이 되는 생물을 보고 종류(해양생물, 어류, 양서류, 파충류, 조류, 포유류, 곤충, 식물, 기타 중 하나)를 고르세요.
3. name: 생물의 이름을 추정해서 적어주세요. 모를 경우 빈 문자열로 남겨주세요.
응답은 반드시 아래 JSON 형식으로만 반환하세요:
{
  "location": "장소",
  "category": "종류",
  "name": "이름"
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } else {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
