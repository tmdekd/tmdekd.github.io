/**
 * 프로필 데이터. 원본 포트폴리오(docs/원본 포트폴리오, 2025) 1·2·3·4·46쪽의 내용을 빠짐없이 옮겼다.
 * 공개 사이트 정책(2026-10-16 결정): 전화번호·생년월일은 싣지 않는다. 사진은 싣는다.
 */
export const profile = {
  name: '문승기',
  englishName: 'Moon Seung Gi',
  role: 'AI Engineer',
  photo: { src: '/media/profile.webp', alt: '문승기 증명사진', width: 350, height: 385 },
  /** 원본 표지 인사말 */
  tagline: '사용자가 체감하는 변화를 만드는 AI 엔지니어',
  taglineDetail: '데이터 기반 가설·실험으로 속도·정확도·비용을 개선합니다.',
  headline: 'LLM·RAG·Agent 서비스와 문서 파싱·검색 시스템을 설계하고 구현하는 AI 엔지니어',
  introduction:
    '복잡한 업무 문제를 구조화하고, 검색과 추론이 실제 서비스 흐름으로 이어지도록 설계합니다. 모델 성능만이 아니라 데이터 품질, 평가, 운영까지 함께 봅니다.',
  contact: {
    email: 'moon010103@naver.com',
    github: 'https://github.com/tmdekd',
    velog: 'https://velog.io/@tmdekd/posts',
    /** 원본 표지의 Notion QR은 싣지 않기로 함(2026-10-16 결정) */
    /** 미리캔버스에 웹 게시된 원본 포트폴리오(docs/원본 포트폴리오/웹에 게시된 링크.txt) */
    portfolioOriginal: 'https://www.miricanvas.com/v2/ko/design2/v/932e57a4-64e7-45f7-8781-7615642f41be',
    /** 공개 이력서 PDF 경로(/files/….pdf). 없으면 Contact에 '준비 중'으로 표시 */
    resume: undefined as string | undefined,
  },
  career: [
    {
      company: '바이텍정보통신',
      team: '기술연구소',
      role: 'AI 개발자',
      period: '2026.04 — 현재',
      description: '전력산업 연구개발 과제·사업의 기획 및 수주 과정에 참여하며, 폐쇄망 환경을 고려한 AI 서비스의 기획·설계·개발을 수행하고 있습니다.',
      highlights: [] as readonly string[],
    },
    {
      company: '아크릴',
      team: 'AI 연구개발',
      role: 'LLM 엔지니어 인턴',
      period: '2025.10 — 2026.03',
      description: 'LLM 기반 서비스 구현과 연구개발 업무를 수행했습니다.',
      highlights: ['LLM 기반 RAG 파이프라인 설계 및 평가', 'LLM · RAG · Vector DB · Evaluation'],
    },
  ],
  /** 원본 INDEX 05–08: 인턴 기간에 참여한 프로젝트(제목만 공개) */
  internProjects: [
    { number: '05', title: 'Recipe AI', subtitle: '업무 보조 유사 레시피 검색 AI 서비스' },
    { number: '06', title: 'AI 돌봄 보고서', subtitle: '건강·주거 데이터를 활용한 AI 기반 돌봄 지원' },
    { number: '07', title: '푸드스코어링', subtitle: '개인 맞춤형 음식 취향 및 영양 점수 산출 서비스' },
    { number: '08', title: 'ARPA-H', subtitle: '항생제 중재 및 관리 멀티 에이전트' },
  ],
  workflow: [
    { number: '01', title: '문제 분석', description: '사용자와 업무의 문제를 기능보다 먼저 정의합니다.' },
    { number: '02', title: '구조 설계', description: '데이터·검색·추론·응답 흐름을 연결해 설계합니다.' },
    { number: '03', title: '구현과 검증', description: '작게 구현하고 평가 기준으로 반복 검증합니다.' },
    { number: '04', title: '서비스 연결', description: '운영 환경과 사용 흐름까지 고려해 완성합니다.' },
  ],
  /** 원본 이력 사항의 SKILL 6개(원본의 숙련도 막대는 자기 평가라 수치 없이 순서만 유지) */
  coreSkills: ['Python', 'LangChain', 'LangGraph', 'RAG', 'ML / DL', 'FastAPI'],
  skills: [
    {
      group: 'LLM · RAG · Agent',
      description: '문서와 검색 데이터를 바탕으로 질문에 답하는 AI 서비스 흐름을 설계·구현합니다.',
      items: ['OpenAI API', 'LangChain', 'LangGraph', 'RAG', 'Fine-tuning', 'Reranking', 'Evaluation'],
    },
    {
      group: 'Backend · Data',
      description: 'AI 기능이 실제 서비스로 동작하도록 API와 데이터 흐름을 구현합니다.',
      items: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'FAISS', 'VectorDB', 'GraphDB', 'ML / DL'],
    },
    {
      group: 'Deployment · Operations',
      description: '개발 환경부터 배포·운영 흐름까지 연결합니다.',
      items: ['Docker', 'AWS', 'RunPod', 'GitHub Actions', 'CI/CD'],
    },
  ],
  /** 원본 2쪽 EDUCATION */
  education: [
    { period: '2019.03 — 2025.02', title: '순천향대학교 사물인터넷학과 졸업' },
    { period: '2016.03 — 2019.01', title: '능동고등학교 졸업' },
  ],
  /** 원본 2쪽 ACTIVITIES */
  activities: [
    { period: '2025.01 — 2025.07', title: "'(KDT) SK네트웍스 FAMILY AI캠프 10기' 수료" },
    { period: '2024.07 — 2024.09', title: "'(KDC) 모두를 위한 딥러닝 입문' 수료" },
    { period: '2022.09 — 2023.03', title: "'(산대특) 프로젝트 기반 풀스택 개발자 양성·육성 과정' 수료" },
  ],
  /** 원본 2쪽 CERTIFICATION / AWARDS (원본 표기 순서) */
  awards: [
    { date: '2025.09.10', title: '정보처리기사 필기 합격', kind: '자격' },
    { date: '2024.11.11', title: 'TOPCIT 500점 (3수준)', kind: '자격' },
    { date: '2025.09.10', title: "'SK네트웍스 FAMILY AI캠프 10기 기업 참여 프로젝트' 우수팀 선정", kind: '수상' },
    { date: '2024.12.29', title: "'2024 캡스톤 디자인 및 AI 해커톤 경진대회' 최우수상 수상", kind: '수상' },
    { date: '2024.11.11', title: "'2023 LISA HACKATHON' 장려상 수상", kind: '수상' },
  ],
} as const;
