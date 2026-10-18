import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { createStaticServer } from './static-server';

const server = createStaticServer(join(process.cwd(), 'dist'));

test.beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(4322, '127.0.0.1', resolve));
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test.use({ baseURL: 'http://127.0.0.1:4322' });

/**
 * 원본 포트폴리오(docs/원본 포트폴리오, 46쪽) 빠짐없음 보장.
 * 쪽마다 고유한 문구 2~3개를 골라 빌드된 페이지 본문에서 찾는다. 전화번호·생년월일은 공개하지 않기로 해 없어야 한다.
 */
const required: Record<string, string[]> = {
  '/': [
    // 1쪽 표지
    '사용자가 체감하는 변화를 만드는 AI 엔지니어', '데이터 기반 가설·실험으로 속도·정확도·비용을 개선합니다', 'moon010103@naver.com', 'github.com/tmdekd', 'velog.io/@tmdekd',
    // 2쪽 이력 사항
    '순천향대학교 사물인터넷학과 졸업', '능동고등학교 졸업', '정보처리기사 필기 합격', 'TOPCIT 500점', '2024 캡스톤 디자인 및 AI 해커톤', '2023 LISA HACKATHON', 'SK네트웍스 FAMILY AI캠프 10기', '모두를 위한 딥러닝 입문', '프로젝트 기반 풀스택 개발자 양성·육성 과정',
    'LLM 기반 RAG 파이프라인 설계 및 평가', 'LangGraph', 'FastAPI',
    // 3~4쪽 INDEX
    'NeuroCare', 'LAWMATE', 'VINO', '요리왕 좌룡', 'Recipe AI', 'AI 돌봄 보고서', '푸드스코어링', 'ARPA-H', '항생제 중재 및 관리 멀티 에이전트',
  ],
  '/projects/neurocare/': [
    '독거노인 정서 돌봄 AI 서비스', '짧은 기간 내 AI 기반 챗봇 서비스 구현 성공', 'HonamISHackathon',
    '우울증 노인은 정상군 대비 자살 시도율이 약 3~4배 높음', '2023년 한 해에만 3,838명', '독거노인 비율이 16.0%에서 21.1%까지',
    '단순한 대화형 챗봇을 넘어, 정서적 돌봄 플랫폼으로', '보호자 연계 및 리포트 제공',
    'Spring Boot', 'Gemma3-4b', 'Runpod',
    '날씨 아이콘을 활용해 자신의 심리 상태를 직관적으로 확인', '보호자 모드 연계를 통해 사용자 상태를 원격으로 확인',
    '공감형 대화를 어떻게 구현할 것인가?', '데이터 품질을 어떻게 확보할 것인가?', '모델의 경량화와 응답 속도를 어떻게 확보할 것인가?',
    '고령자 근현대 경험 구술 데이터', 'LoRA 기반 파인튜닝 및 양자화', 'RunPod Serverless',
    '팀장이라는 자리의 무게', '기술적 선택과 집중', '사용자 중심의 구현', 'github.com/tmdekd/HonamISHackathon',
  ],
  '/projects/lawmate/': [
    '법무법인 업무보조 AI 플랫폼', '기업 참여 프로젝트 우수팀 선정', 'SKN10-FINAL-3Team',
    'Harvey는 법률 산업 특화 생성형 AI 서비스로 개발됨', '2023년 전체 소송 건수 666만 건', '민사소송이 68.1% 차지',
    '단순 반복작업을 넘어, 법률 전략과 협업을 지원하는 AI 플랫폼으로', 'AI 지원으로 초보 인력도 신속 대응 가능',
    'Uvicorn', 'Gemma3-1b', 'Docker',
    '사용자 계정 관리 전용 권한 보유', 'LangGraph 기반 Agent가 유사 사건 + 업무량 고려하여 팀 추천', 'Full Fine-tuning 모델에 전달됨', '5가지 카테고리로 분류',
    '권한별 기능을 어떻게 차별화할 것인가?', 'AI 팀 추천 기능을 어떻게 구현할 것인가?', 'Django Middleware 클래스에서 JWT 토큰 유효성 검증 일괄 처리',
    'VectorSearch', 'SQLSearch', 'ScoreCalc', 'Explain', '모듈화된 노드 구조로 기능을 작은 단위로 개발·검증·교체 가능',
    '사건 접수 기능', '유사 판례 검색 및 Chatbot 질의응답 기능',
    '기획과 구현을 연결하는 역할', '흐름을 만드는 선택과 판단', '협업과 소통이 성과로 이어진 이유',
  ],
  '/projects/vino/': [
    '생성형 AI 기반 와인 입문가이드 챗봇', 'PM, AI Engineer', 'Fine-tuned sLLM과 다단계 평가 구조를 적용', 'SKN10-4th-2Team',
    '와인 정보의 복잡성', '실생활 음식과의 연결 부족', '검색 기반 정보의 한계',
    '흩어진 와인 정보의 파편을, 대화로 풀어주는 입문 가이드', '응답 신뢰도를 보강하는 다단계 구조',
    '질문 유형에 따라 응답 경로 분기', '생성과 평가를 분리한 다단계 구조', 'RAG → 외부 검색 순으로 단계적 보완',
    '요약 + 핵심 포인트 구조로 입문자가 기억해야 할 정보만 직관적으로 제시',
    'Hallucination (환각문제)을 어떻게 해결할 것인가?', "LLM 응답은 언제 '충분하다'고 판단할 수 있을까?", 'FAISS Vector Store', 'LLM-as-a-Judge', 'Tavily',
    '팀장으로서의 역할 인식', '응답 구조의 재설계', '선택과 집중의 경험', '18주차-회고', 'github.com/tmdekd/SKN10-4th-2Team',
  ],
  '/projects/yoriwang-jwaryong/': [
    '생성형 AI 기반 맞춤형 레시피 추천 챗봇', 'LLM Fine-tuning · RAG Pipeline Design', 'Fine-tuned sLLM + RAG 분기형 응답 구조 설계', 'SKN10-3rd-5Team',
    '요리 이름 중심 검색의 구조적 한계', '현실적인 조리 환경과 사용자 제약', '정보 제공 중심 레시피의 한계',
    '냉장고 속 재료를 바로 요리로 연결해주는 대화형 레시피 가이드', '대체 재료를 포함한 실행 중심 레시피 제안',
    '요리 질문 여부에 따른 처리 분기', '유튜브 자막·레시피 데이터 기반 RAG 활용',
    '보유 재료만으로 가능한 요리 추천', '조리 도구·시간 제약을 고려한 추천', '상황에 맞게 변형 가능한 요리 안내', '바로 따라 할 수 있는 단계별 레시피', '추가 질문을 통한 추천 개선', '신뢰도 높은 레시피 추천을 위한 응답 구조',
    'Hallucination (환각문제)을 어떻게 해결할 것인가?', "LLM 응답은 언제 '충분하다'고 판단할 수 있을까?", '대화는 복잡해도, 결과는 어떻게 단순하게 할 수 있을까?',
    '멀티 쿼리를 생성해 내부 문서 RAG(FAISS)로 근거를 검색하고 재생성', '이전 대화에서 입력된 조건을 모두 하나의 맥락으로 통합',
    '역할과 기여', '응답 구조에 대한 고민', '실행 가능한 서비스', '15주차-회고', 'github.com/tmdekd/SKN10-3rd-5Team',
  ],
};

for (const [route, phrases] of Object.entries(required)) {
  test(`${route} carries every original portfolio phrase for that page`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const missing = phrases.filter((phrase) => !text.includes(phrase.replace(/\s+/g, ' ')));
    expect(missing, `${route} 누락: ${missing.join(' | ')}`).toEqual([]);
  });
}

test('never publishes the phone number or birth date from the original PDF', async ({ page }) => {
  for (const route of Object.keys(required)) {
    await page.goto(route);
    const html = await page.content();
    expect(html).not.toMatch(/010[- ]?2530[- ]?6958/);
    expect(html).not.toMatch(/2001\.01\.03/);
  }
});
